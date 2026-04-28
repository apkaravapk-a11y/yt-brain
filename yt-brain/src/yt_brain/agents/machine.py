"""Machine-access agent — fs / shell / git / install.

Every public function returns a `Result` dict with `ok`, `decision`, `reason`,
`evidence`, and (for actions that produce output) `output`. Decisions go through
`decide_namespaced` so the existing Π policy layer is the single source of truth.

Hard rules baked in:
  - Banned filenames: results.md, master.md, GUIDE.md (boundary: harness rule)
  - Allowlist of writable dirs (project / Desktop / Downloads / .claude/exo)
  - Shell regex deny: rm -rf, format, del /f /s /q, fdisk, cipher /w, sdelete,
    reg delete, password rotation patterns
  - Sentinel files cannot be deleted by AI
  - Halt sentinel `C:/docs/.halt-all` makes everything return deny instantly
"""
from __future__ import annotations
import re
import subprocess
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

from ..consent.policy import (
    ConsentPolicy, DecisionResult, classify_action, decide_namespaced, HARD_FORBIDDEN,
)
from .audit import audit

ALLOWLIST_DIRS: tuple[str, ...] = (
    "C:/projects/",
    "C:/Users/apkar/Desktop/",
    "C:/Users/apkar/Downloads/",
    "C:/Users/apkar/.claude/exo/",
    # Sandbox for tests:
    "C:/Users/apkar/AppData/Local/Temp/watchlight-sandbox/",
)

BANNED_FILENAMES = frozenset({"results.md", "master.md", "guide.md"})

SENTINEL_NAMES = frozenset({
    ".brainstorm-off", ".consent-pause", ".browser-halt",
    ".notify-off", ".halt-all", ".thermal-pause", ".plan-autosave-off",
})

HALT_SENTINEL = Path("C:/docs/.halt-all")

# Regex deny for shell.run — irreversible commands.
SHELL_DENY = re.compile(
    r"(?ix)"
    r"(\brm\s+-rf\b)"
    r"|(\bformat\s+[a-z]:)"
    r"|(\bdel\s+/[fsq])"
    r"|(\breg\s+delete\b)"
    r"|(\bfdisk\b)"
    r"|(\bcipher\s+/w\b)"
    r"|(\bsdelete\b)"
    r"|(\bnet\s+user\s+\S+\s+/delete\b)"
    r"|(\bschtasks\s+/delete\s+/tn\s+\".*?(brainstorm|consent|halt))"
)


@dataclass
class Result:
    ok: bool
    decision: str       # allow | deny | ask
    reason: str
    evidence: dict[str, Any] = field(default_factory=dict)
    output: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _halted() -> Result | None:
    if HALT_SENTINEL.exists():
        return Result(False, "deny", "halt-all sentinel is active",
                      evidence={"sentinel": str(HALT_SENTINEL)})
    return None


def _banned_filename(path: str | Path) -> bool:
    return Path(str(path)).name.lower() in BANNED_FILENAMES


def _is_sentinel(path: str | Path) -> bool:
    return Path(str(path)).name.lower() in SENTINEL_NAMES


def _normalize(p: str | Path) -> str:
    return str(p).replace("\\", "/")


# ── Filesystem ────────────────────────────────────────────────────────────

def read_file(policy: ConsentPolicy, path: str | Path) -> Result:
    h = _halted()
    if h: return h
    p = _normalize(path)
    key = classify_action("fs.read", p, allowlist_dirs=ALLOWLIST_DIRS)
    d = decide_namespaced(policy, key)
    if d.decision != "allow":
        audit("fs.read", p, d.decision, d.reason)
        return Result(False, d.decision, d.reason, evidence={"path": p, "key": key})
    try:
        text = Path(p).read_text(encoding="utf-8", errors="replace")
        audit("fs.read", p, "allow", "ok", {"bytes": len(text)})
        return Result(True, "allow", d.reason, evidence={"path": p, "key": key, "bytes": len(text)},
                      output=text[:200_000])  # cap to 200KB to avoid blowing up the response
    except Exception as exc:
        audit("fs.read", p, "error", str(exc))
        return Result(False, "deny", f"read failed: {exc}", evidence={"path": p})


def write_file(policy: ConsentPolicy, path: str | Path, content: str) -> Result:
    h = _halted()
    if h: return h
    p = _normalize(path)
    if _banned_filename(p):
        msg = ("This filename is banned by harness policy. "
               "Use docs/notes-YYYY-MM-DD.md or similar instead.")
        audit("fs.write", p, "deny", msg)
        return Result(False, "deny", msg, evidence={"path": p, "rule": "banned-filename"})
    if _is_sentinel(p):
        msg = "Sentinel files cannot be modified by the AI (boundary: no policy fighting)."
        audit("fs.write", p, "deny", msg)
        return Result(False, "deny", msg, evidence={"path": p, "rule": "sentinel-protect"})
    key = classify_action("fs.write", p, allowlist_dirs=ALLOWLIST_DIRS)
    d = decide_namespaced(policy, key)
    if d.decision != "allow":
        audit("fs.write", p, d.decision, d.reason)
        return Result(False, d.decision, d.reason, evidence={"path": p, "key": key})
    try:
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        Path(p).write_text(content, encoding="utf-8")
        audit("fs.write", p, "allow", "ok", {"bytes": len(content)})
        return Result(True, "allow", d.reason, evidence={"path": p, "key": key, "bytes": len(content)})
    except Exception as exc:
        audit("fs.write", p, "error", str(exc))
        return Result(False, "deny", f"write failed: {exc}", evidence={"path": p})


def delete_file(policy: ConsentPolicy, path: str | Path) -> Result:
    """Delete is treated as fs.write (allowlist-gated) PLUS sentinel/banned guards."""
    h = _halted()
    if h: return h
    p = _normalize(path)
    if _is_sentinel(p):
        msg = "Sentinel files cannot be deleted by the AI."
        audit("fs.delete", p, "deny", msg)
        return Result(False, "deny", msg, evidence={"path": p, "rule": "sentinel-protect"})
    key = classify_action("fs.write", p, allowlist_dirs=ALLOWLIST_DIRS)
    d = decide_namespaced(policy, key)
    if d.decision != "allow":
        audit("fs.delete", p, d.decision, d.reason)
        return Result(False, d.decision, d.reason, evidence={"path": p, "key": key})
    try:
        Path(p).unlink()
        audit("fs.delete", p, "allow", "ok")
        return Result(True, "allow", d.reason, evidence={"path": p, "key": key})
    except Exception as exc:
        audit("fs.delete", p, "error", str(exc))
        return Result(False, "deny", f"delete failed: {exc}", evidence={"path": p})


# ── Shell ─────────────────────────────────────────────────────────────────

def run_shell(policy: ConsentPolicy, command: str, *, cwd: str | None = None,
              timeout_sec: int = 30) -> Result:
    h = _halted()
    if h: return h
    cmd_lower = (command or "").lower().strip()
    if SHELL_DENY.search(cmd_lower):
        msg = "Shell command matches the irreversible-command deny pattern."
        audit("shell.run", command, "deny", msg)
        return Result(False, "deny", msg, evidence={"command": command, "rule": "shell-deny"})
    key = classify_action("shell.run", cmd_lower)
    d = decide_namespaced(policy, key)
    if d.decision != "allow":
        audit("shell.run", command, d.decision, d.reason)
        return Result(False, d.decision, d.reason, evidence={"command": command, "key": key})
    try:
        proc = subprocess.run(
            command, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout_sec,
        )
        out = (proc.stdout or "")[:200_000]
        err = (proc.stderr or "")[:50_000]
        audit("shell.run", command, "allow", f"rc={proc.returncode}", {"stdout_len": len(out)})
        return Result(
            ok=proc.returncode == 0, decision="allow", reason=d.reason,
            evidence={"command": command, "key": key, "rc": proc.returncode, "stderr": err},
            output=out,
        )
    except subprocess.TimeoutExpired:
        audit("shell.run", command, "error", "timeout")
        return Result(False, "deny", "command timed out", evidence={"command": command})
    except Exception as exc:
        audit("shell.run", command, "error", str(exc))
        return Result(False, "deny", f"shell failed: {exc}", evidence={"command": command})


# ── Git ───────────────────────────────────────────────────────────────────

def git_commit(policy: ConsentPolicy, repo_path: str, message: str) -> Result:
    h = _halted()
    if h: return h
    d = decide_namespaced(policy, "git.commit.local")
    if d.decision != "allow":
        audit("git.commit", repo_path, d.decision, d.reason)
        return Result(False, d.decision, d.reason, evidence={"repo": repo_path})
    return run_shell(policy, f'git -C "{repo_path}" commit -m "{message}"')


def git_push(policy: ConsentPolicy, repo_path: str, *, force: bool = False) -> Result:
    if force:
        d = decide_namespaced(policy, "git.push.force")
        if d.decision != "allow":
            audit("git.push.force", repo_path, "deny", d.reason)
            return Result(False, "deny", d.reason, evidence={"repo": repo_path})
    d = decide_namespaced(policy, "git.push")
    if d.decision != "allow":
        audit("git.push", repo_path, d.decision, d.reason)
        return Result(False, d.decision, d.reason, evidence={"repo": repo_path})
    flag = " --force" if force else ""
    return run_shell(policy, f'git -C "{repo_path}" push{flag}')


# ── Install ───────────────────────────────────────────────────────────────

def install_package(policy: ConsentPolicy, manager: str, name: str) -> Result:
    h = _halted()
    if h: return h
    mgr = manager.lower()
    if mgr not in ("pip", "npm"):
        d = decide_namespaced(policy, "install.system")
        if d.decision != "allow":
            return Result(False, "deny", d.reason, evidence={"manager": mgr, "name": name})
    else:
        d = decide_namespaced(policy, f"install.{mgr}")
        if d.decision != "allow":
            return Result(False, d.decision, d.reason, evidence={"manager": mgr, "name": name})
    cmd = {
        "pip": f"pip install --quiet {name}",
        "npm": f"npm install --silent {name}",
        "winget": f"winget install --silent {name}",
        "choco": f"choco install -y {name}",
    }.get(mgr, "")
    if not cmd:
        return Result(False, "deny", f"unknown package manager: {manager}", evidence={"manager": mgr})
    return run_shell(policy, cmd, timeout_sec=300)
