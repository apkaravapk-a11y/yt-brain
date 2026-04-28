"""Phase 18 W8 canary tests — machine engine.

Covers banned filenames, allowlist boundaries, sentinel protection, shell deny.
"""
from __future__ import annotations
import os
import shutil
from pathlib import Path

import pytest

from yt_brain.consent.policy import ConsentPolicy
from yt_brain.consent.predictor import HeuristicPredictor
from yt_brain.consent.windows import WindowRegistry
from yt_brain.agents import machine


SANDBOX = Path("C:/Users/apkar/AppData/Local/Temp/watchlight-sandbox")


@pytest.fixture(autouse=True)
def isolate(tmp_path, monkeypatch):
    SANDBOX.mkdir(parents=True, exist_ok=True)
    log = tmp_path / "audit.jsonl"
    monkeypatch.setenv("WATCHLIGHT_AUDIT_LOG", str(log))
    # ensure halt sentinel is OFF for these tests
    halt = Path("C:/docs/.halt-all")
    if halt.exists(): halt.unlink()
    yield
    # cleanup sandbox files (don't remove dir to avoid races)
    for f in list(SANDBOX.glob("*")):
        try: f.unlink()
        except Exception: pass


@pytest.fixture
def policy():
    return ConsentPolicy(predictor=HeuristicPredictor(), windows=WindowRegistry())


def test_write_banned_filename_denied(policy):
    target = SANDBOX / "results.md"
    r = machine.write_file(policy, target, "x")
    assert not r.ok
    assert r.decision == "deny"
    assert "banned" in r.reason.lower()


def test_write_to_sandbox_denied_without_window(policy):
    # SANDBOX is in the allowlist (added explicitly in machine.py), so a write
    # there should ASK in default policy (not deny outright).
    target = SANDBOX / "ok.txt"
    r = machine.write_file(policy, target, "hello")
    assert r.decision in ("ask", "deny")  # never silently allow without explicit window


def test_write_outside_allowlist_denied(policy):
    # C:/Windows is definitely not allowlisted
    r = machine.write_file(policy, "C:/Windows/Temp/should-not-exist.txt", "x")
    assert not r.ok
    assert r.decision == "deny"


def test_sentinel_cannot_be_overwritten(policy):
    r = machine.write_file(policy, SANDBOX / ".halt-all", "x")
    assert not r.ok
    assert r.decision == "deny"
    assert "sentinel" in r.reason.lower() or "banned" in r.reason.lower()


def test_shell_deny_rm_rf(policy):
    r = machine.run_shell(policy, "rm -rf /tmp/whatever")
    assert not r.ok
    assert r.decision == "deny"


def test_shell_deny_format(policy):
    r = machine.run_shell(policy, "format c:")
    assert not r.ok
    assert r.decision == "deny"


def test_halt_sentinel_blocks_everything(policy, tmp_path):
    halt = Path("C:/docs/.halt-all")
    halt.parent.mkdir(parents=True, exist_ok=True)
    halt.write_text("test")
    try:
        r = machine.read_file(policy, SANDBOX / "anything.txt")
        assert not r.ok and "halt" in r.reason.lower()
    finally:
        if halt.exists(): halt.unlink()
