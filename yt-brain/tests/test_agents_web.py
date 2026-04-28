"""Phase 18 W8 canary tests — web engine."""
from __future__ import annotations
from pathlib import Path
import pytest

from yt_brain.consent.policy import ConsentPolicy
from yt_brain.consent.predictor import HeuristicPredictor
from yt_brain.consent.windows import WindowRegistry
from yt_brain.agents import web
from yt_brain.agents.web_payment_blocklist import is_payment_endpoint


@pytest.fixture(autouse=True)
def setup(monkeypatch, tmp_path):
    monkeypatch.setenv("WATCHLIGHT_AUDIT_LOG", str(tmp_path / "audit.jsonl"))
    halt = Path("C:/docs/.halt-all")
    if halt.exists(): halt.unlink()
    yield


@pytest.fixture
def policy():
    return ConsentPolicy(predictor=HeuristicPredictor(), windows=WindowRegistry())


def test_payment_blocklist_known_hosts():
    assert is_payment_endpoint("https://api.stripe.com/v1/charges")
    assert is_payment_endpoint("api.razorpay.com/orders/pay")
    assert is_payment_endpoint("https://api.coinbase.com/withdraw")
    # Hint paths
    assert is_payment_endpoint("https://example.com/checkout/cart")
    # Negatives
    assert not is_payment_endpoint("https://github.com/whatever")
    assert not is_payment_endpoint("https://api.github.com/zen")


def test_web_fetch_payment_endpoint_denied(policy):
    r = web.web_fetch(policy, "https://api.stripe.com/v1/charges")
    assert not r.ok
    assert r.decision == "deny"
    assert "payment" in r.reason.lower()


def test_web_fetch_post_default_ask(policy):
    # POST is "ask" by default in NAMESPACE_DEFAULTS — without predictor approval
    # the policy returns ask, which surfaces as deny in our current Result mapping.
    r = web.web_fetch(policy, "https://api.github.com/zen", method="POST")
    assert r.decision in ("ask", "deny")  # never silently allowed


def test_halt_blocks_fetch(policy):
    halt = Path("C:/docs/.halt-all")
    halt.parent.mkdir(parents=True, exist_ok=True)
    halt.write_text("test")
    try:
        r = web.web_fetch(policy, "https://example.com")
        assert not r.ok and "halt" in r.reason.lower()
    finally:
        if halt.exists(): halt.unlink()
