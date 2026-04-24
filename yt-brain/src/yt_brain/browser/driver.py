"""Λ — browser driver. Lazy-imports Playwright so the core package runs
without it. Provides safe no-op stubs when Playwright is absent, so scaffolding
tests pass on any workstation. Real behavior lights up when `pip install
playwright` + `playwright install chromium` have run.
"""
from __future__ import annotations
import os
from dataclasses import dataclass
from pathlib import Path

from .rate_limit import TokenBucket

BROWSER_HALT = Path("C:/docs/.browser-halt")
PROFILE_DIR = Path("C:/browsers/yt-brain-chrome")


@dataclass
class SessionInfo:
    profile_path: str
    playwright_available: bool
    halted: bool


def session_info() -> SessionInfo:
    try:
        import playwright.sync_api  # noqa: F401
        avail = True
    except Exception:
        avail = False
    return SessionInfo(
        profile_path=str(PROFILE_DIR),
        playwright_available=avail,
        halted=BROWSER_HALT.exists(),
    )


class Driver:
    """Thin wrapper that will host real Playwright commands in Phase 1.5.

    For now, exposes the public surface so adapters (CLI / MCP) can be wired,
    and tests can exercise the rate limiter + session-info without needing a
    running Chromium.
    """

    def __init__(self, *, rate_hz: float = 0.3, burst: int = 3):
        self.bucket = TokenBucket(rate_hz=rate_hz, burst=burst)
        self._playwright = None
        self._context = None

    # lifecycle
    def up(self, headed: bool = True):
        if BROWSER_HALT.exists():
            raise RuntimeError("browser-halt sentinel present; refusing to start")
        try:
            from playwright.sync_api import sync_playwright  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "playwright not installed; run `pip install playwright && playwright install chromium`"
            ) from exc
        self._playwright = sync_playwright().start()
        PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        self._context = self._playwright.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=not headed,
            args=["--disable-blink-features=AutomationControlled"],
        )
        return self

    def down(self):
        if self._context is not None:
            try:
                self._context.close()
            except Exception:
                pass
        if self._playwright is not None:
            try:
                self._playwright.stop()
            except Exception:
                pass
        self._context = self._playwright = None

    # tools (real implementations light up in Phase 1.5 execute)
    def goto(self, url: str):
        self.bucket.acquire()
        if not self._context:
            return {"ok": False, "error": "driver not up"}
        page = self._context.pages[0] if self._context.pages else self._context.new_page()
        page.goto(url)
        return {"ok": True, "url": page.url, "title": page.title()}

    def screenshot(self, path: str | None = None) -> str | None:
        if not self._context or not self._context.pages:
            return None
        page = self._context.pages[0]
        out = path or f"C:/browsers/screenshots/{int(__import__('time').time())}.png"
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=out, full_page=False)
        return out
