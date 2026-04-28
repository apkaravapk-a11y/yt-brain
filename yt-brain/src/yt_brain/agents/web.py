"""Web-access agent — fetch / search / browse with rate limiting + payment blocklist."""
from __future__ import annotations
import time
from dataclasses import dataclass, field
from urllib.parse import urlparse
from urllib import robotparser

from ..consent.policy import ConsentPolicy, decide_namespaced
from .web_payment_blocklist import is_payment_endpoint
from .audit import audit
from .machine import Result, _halted

# Token bucket — 0.3 Hz default (one request every ~3.3s) to be polite.
@dataclass
class TokenBucket:
    rate_hz: float = 0.3
    burst: int = 3
    _tokens: float = 3.0
    _last: float = field(default_factory=lambda: time.monotonic())

    def acquire(self) -> float:
        now = time.monotonic()
        self._tokens = min(self.burst, self._tokens + (now - self._last) * self.rate_hz)
        self._last = now
        if self._tokens >= 1:
            self._tokens -= 1
            return 0.0
        wait = (1 - self._tokens) / max(self.rate_hz, 1e-6)
        time.sleep(min(wait, 5.0))
        self._tokens = 0
        return wait


_BUCKET = TokenBucket()


def _check_robots(url: str) -> bool:
    try:
        u = urlparse(url)
        # YouTube-family hosts: skip robots check (we only use them via the user's session)
        if any(u.hostname and u.hostname.endswith(d) for d in (".youtube.com", "youtube.com", "googlevideo.com")):
            return True
        rp = robotparser.RobotFileParser()
        rp.set_url(f"{u.scheme}://{u.hostname}/robots.txt")
        rp.read()
        return rp.can_fetch("WatchlightBot/0.3", url)
    except Exception:
        return True  # be permissive on error


def web_fetch(policy: ConsentPolicy, url: str, *, method: str = "GET",
              body: str | None = None) -> Result:
    h = _halted()
    if h: return h
    method = method.upper()
    if is_payment_endpoint(url):
        msg = "Payment endpoints are hard-denied (boundary: no money outside Max)."
        audit("web.fetch", url, "deny", msg)
        return Result(False, "deny", msg, evidence={"url": url, "rule": "payment-blocklist"})
    if not _check_robots(url):
        msg = "Site disallows this fetch in robots.txt."
        audit("web.fetch", url, "deny", msg)
        return Result(False, "deny", msg, evidence={"url": url, "rule": "robots-disallow"})
    key = "web.fetch.post" if method != "GET" else "web.fetch.get"
    d = decide_namespaced(policy, key)
    if d.decision != "allow":
        audit("web.fetch", url, d.decision, d.reason)
        return Result(False, d.decision, d.reason, evidence={"url": url, "method": method, "key": key})
    waited = _BUCKET.acquire()
    try:
        import httpx
        with httpx.Client(follow_redirects=True, timeout=15.0,
                          headers={"User-Agent": "WatchlightBot/0.3 (+https://watchlight.vercel.app)"}) as c:
            r = c.request(method, url, content=body)
        text = r.text[:200_000]
        audit("web.fetch", url, "allow", f"status={r.status_code}",
              {"status": r.status_code, "bytes": len(r.content), "wait_s": round(waited, 2)})
        return Result(
            ok=r.is_success, decision="allow", reason=d.reason,
            evidence={"url": url, "method": method, "status": r.status_code,
                      "bytes": len(r.content), "wait_s": round(waited, 2)},
            output=text,
        )
    except Exception as exc:
        audit("web.fetch", url, "error", str(exc))
        return Result(False, "deny", f"fetch failed: {exc}", evidence={"url": url})


def web_search(policy: ConsentPolicy, query: str, limit: int = 8) -> Result:
    """DuckDuckGo HTML scrape — no API key required, gentle on rate."""
    h = _halted()
    if h: return h
    d = decide_namespaced(policy, "web.fetch.get")
    if d.decision != "allow":
        return Result(False, d.decision, d.reason, evidence={"query": query})
    url = f"https://duckduckgo.com/html/?q={query.replace(' ', '+')}"
    res = web_fetch(policy, url)
    if not res.ok:
        return res
    # Naïve link extraction
    import re
    hits = re.findall(r'<a class="result__a" href="([^"]+)"[^>]*>(.*?)</a>', res.output)
    items = [{"url": h[0], "title": re.sub("<[^>]+>", "", h[1])[:200]} for h in hits[:limit]]
    audit("web.search", query, "allow", f"hits={len(items)}")
    return Result(True, "allow", d.reason, evidence={"query": query, "hits": len(items)},
                  output="\n".join(f"{i['title']} — {i['url']}" for i in items))
