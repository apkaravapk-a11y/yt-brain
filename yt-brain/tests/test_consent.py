from datetime import timedelta
from pathlib import Path

from yt_brain.consent.policy import ConsentPolicy, HARD_NEVER, AUTO_ELIGIBLE, KILLSWITCH_PATH
from yt_brain.consent.windows import WindowRegistry
from yt_brain.consent.predictor import HeuristicPredictor


def test_hard_never_blocks(tmp_path, monkeypatch):
    # redirect killswitch path to ensure it's absent
    monkeypatch.setattr("yt_brain.consent.policy.KILLSWITCH_PATH", tmp_path / "absent")
    p = ConsentPolicy(predictor=HeuristicPredictor())
    for action in list(HARD_NEVER)[:5]:
        r = p.decide(action)
        assert r.decision == "ask"
        assert "hard-never" in r.reason


def test_autoelig_returns_ask_without_high_confidence(tmp_path, monkeypatch):
    monkeypatch.setattr("yt_brain.consent.policy.KILLSWITCH_PATH", tmp_path / "absent")
    p = ConsentPolicy(predictor=HeuristicPredictor())
    # heuristic prior for 'like' is 0.55 → should fall into 'ask' band
    r = p.decide("like")
    assert r.decision == "ask"


def test_killswitch_forces_ask(tmp_path, monkeypatch):
    sentinel = tmp_path / "consent-pause"
    sentinel.write_text("x")
    monkeypatch.setattr("yt_brain.consent.policy.KILLSWITCH_PATH", sentinel)
    p = ConsentPolicy(predictor=HeuristicPredictor())
    r = p.decide("save_to_playlist")
    assert r.decision == "ask"
    assert "consent-pause" in r.reason


def test_windows_open_and_expire():
    reg = WindowRegistry()
    reg.open("like", duration=timedelta(seconds=60), max_count=2)
    assert reg.is_open_for("like")
    assert reg.consume("like")
    assert reg.consume("like")
    assert not reg.consume("like")  # exhausted
    assert not reg.is_open_for("like")


def test_windows_refuse_pickle():
    import pickle, pytest
    reg = WindowRegistry()
    with pytest.raises(RuntimeError):
        pickle.dumps(reg)
