"""Audit log — every agent call lands here. Read by /receipts and the dashboard."""
from __future__ import annotations
import json
import os
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = Path(os.environ.get(
    "WATCHLIGHT_AUDIT_LOG",
    str(Path.home() / ".claude" / "exo" / "watchlight-audit.jsonl"),
))


def audit(action: str, target: str, decision: str, reason: str,
          evidence: dict | None = None) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    rec = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "target": str(target)[:500],
        "decision": decision,
        "reason": reason,
        "evidence": evidence or {},
    }
    try:
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec) + "\n")
    except Exception:
        pass  # auditing must never break the parent call


def tail_audit(limit: int = 200) -> list[dict]:
    if not LOG_FILE.exists():
        return []
    try:
        lines = LOG_FILE.read_text(encoding="utf-8").splitlines()[-limit:]
        out = []
        for ln in lines:
            try:
                out.append(json.loads(ln))
            except Exception:
                continue
        return out
    except Exception:
        return []
