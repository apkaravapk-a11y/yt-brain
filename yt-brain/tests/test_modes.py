from pathlib import Path

from yt_brain.modes.router import current_mode, set_mode, MODES, MODE_TABLE


def test_mode_table_has_all_six():
    expected = {"jarvis", "minority", "ops", "samantha", "mentat", "scholar"}
    assert set(MODES) == expected
    assert set(MODE_TABLE.keys()) == expected


def test_mode_switch(monkeypatch, tmp_path: Path):
    mode_file = tmp_path / ".current-mode"
    monkeypatch.setattr("yt_brain.modes.router.CURRENT_MODE_FILE", mode_file)
    for m in MODES:
        cfg = set_mode(m)
        assert cfg.name == m
        assert current_mode().name == m


def test_mode_invalid(monkeypatch, tmp_path: Path):
    import pytest
    mode_file = tmp_path / ".current-mode"
    monkeypatch.setattr("yt_brain.modes.router.CURRENT_MODE_FILE", mode_file)
    with pytest.raises(ValueError):
        set_mode("jarvis9000")


def test_mentat_lock_only_on_mentat():
    assert MODE_TABLE["mentat"].mentat_lock is True
    for m in ("jarvis", "minority", "ops", "samantha", "scholar"):
        assert MODE_TABLE[m].mentat_lock is False
