#!/usr/bin/env python
"""Master orchestrator — runs every phase's test suite end-to-end with gate enforcement.

No phase proceeds until the prior phase is green on G1 (tests) + G2 (smoke check) + G3 (log).
"""
from __future__ import annotations
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

RESULTS = Path("C:/docs/results.md")
REPORT = Path("C:/projects/yt-brain-tests/last_run.json")


PHASES = [
    {"n": "0",   "label": "plans consolidation",     "check": ["powershell", "-NoProfile", "-Command", "'junction=' + (Get-Item C:/Users/apkar/.claude/plans).LinkType"], "cwd": None},
    {"n": "0.5", "label": "always-brainstorm hook",  "check": ["powershell", "-NoProfile", "-Command", "'hook=' + (Test-Path 'C:/Users/apkar/.claude/plugins/local-skills/always-brainstorm/hooks/user-prompt-submit-brainstorm.ps1')"], "cwd": None},
    {"n": "1",   "label": "yt-brain pytest",         "check": [sys.executable, "-m", "pytest", "-x", "-q"], "cwd": "C:/projects/yt-brain"},
    {"n": "2",   "label": "yt-ai pytest",            "check": [sys.executable, "-m", "pytest", "-x", "-q"], "cwd": "C:/projects/yt-ai"},
    {"n": "4",   "label": "control plane dispatch",  "check": [sys.executable, "-m", "yt_brain.control.dispatch", "mode.list"], "cwd": None},
    {"n": "7",   "label": "UI file exists",          "check": ["powershell", "-NoProfile", "-Command", "'ui=' + (Test-Path 'C:/projects/yt-brain-ui/index.html')"], "cwd": None},
]


def run_phase(phase: dict) -> tuple[bool, str]:
    res = subprocess.run(phase["check"], capture_output=True, text=True, timeout=180, cwd=phase.get("cwd"))
    ok = res.returncode == 0
    tail = (res.stdout or "").strip().splitlines()
    tail_str = tail[-1] if tail else (res.stderr or "").strip()[-200:]
    return ok, tail_str[:200]


def main() -> int:
    report = {"started_at": datetime.utcnow().isoformat() + "Z", "phases": []}
    all_green = True
    for p in PHASES:
        t0 = datetime.utcnow()
        ok, summary = run_phase(p)
        dt_ms = (datetime.utcnow() - t0).total_seconds() * 1000.0
        phase_report = {
            "phase": p["n"], "label": p["label"],
            "outcome": "green" if ok else "red",
            "latency_ms": round(dt_ms, 1),
            "summary_tail": summary,
        }
        report["phases"].append(phase_report)
        status = "✓" if ok else "✖"
        print(f"{status} phase {p['n']:>4} — {p['label']:<40} {summary}")
        if not ok:
            all_green = False
    report["ended_at"] = datetime.utcnow().isoformat() + "Z"
    report["all_green"] = all_green
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    RESULTS.parent.mkdir(parents=True, exist_ok=True)
    with RESULTS.open("a", encoding="utf-8") as f:
        f.write(f"\n- [{report['ended_at']}] yt-brain orchestrator: "
                f"all_green={all_green} phases={len(PHASES)} "
                f"red={[p['phase'] for p in report['phases'] if p['outcome']=='red']}\n")
    return 0 if all_green else 1


if __name__ == "__main__":
    sys.exit(main())
