"""Contract tests for Batch C additions: /api/live/visit and /api/status cache."""
import os
import pathlib

from fastapi.testclient import TestClient


def _fresh_app(tmp_path: pathlib.Path):
    os.environ["YT_BRAIN_DB"] = str(tmp_path / "yt.sqlite")
    # Re-import so module-level DB_PATH picks up the env var and the singleton
    # _repo is fresh per test.
    import importlib
    from yt_brain.api import server as srv
    importlib.reload(srv)
    return srv, TestClient(srv.app)


def test_live_visit_records_video(tmp_path):
    _, client = _fresh_app(tmp_path)
    r = client.post("/api/live/visit", json={
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Never Gonna Give You Up - YouTube",
    })
    assert r.status_code == 200
    assert r.json() == {"ok": True, "video_id": "dQw4w9WgXcQ"}

    r2 = client.get("/api/videos")
    assert r2.status_code == 200
    vids = r2.json()
    assert any(v["video_id"] == "dQw4w9WgXcQ" for v in vids)
    v = next(v for v in vids if v["video_id"] == "dQw4w9WgXcQ")
    assert v["source"] == "live_visit"
    assert "Never Gonna Give You Up" in v["title"]


def test_live_visit_rejects_non_watch_url(tmp_path):
    _, client = _fresh_app(tmp_path)
    r = client.post("/api/live/visit", json={"url": "https://www.youtube.com/", "title": "home"})
    assert r.status_code == 200
    assert r.json()["ok"] is False


def test_status_returns_expected_shape(tmp_path):
    _, client = _fresh_app(tmp_path)
    r = client.get("/api/status")
    assert r.status_code == 200
    body = r.json()
    for key in ("video_count", "mode", "sentinels", "backends", "ai_router", "ts"):
        assert key in body
    names = {b["name"] for b in body["backends"]}
    assert {"yt_ai_router", "ollama", "anthropic_cloud", "stub"}.issubset(names)


def test_mode_roundtrip(tmp_path):
    _, client = _fresh_app(tmp_path)
    r = client.post("/api/mode", json={"name": "minority"})
    assert r.status_code == 200
    assert r.json()["name"] == "minority"
    # put it back so other tests see jarvis
    client.post("/api/mode", json={"name": "jarvis"})
