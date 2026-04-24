from pathlib import Path

from yt_brain.storage.db import Repo
from yt_brain.sources.models import VideoRecord
from yt_brain.services.sync import ingest_videos
from yt_brain.services.search import search_titles


def test_ingest_and_search(tmp_path: Path):
    repo = Repo(tmp_path / "yt.sqlite")
    records = [
        VideoRecord(video_id="a1", title="RAG with LlamaIndex", channel_name="AI Daily", source="takeout"),
        VideoRecord(video_id="a2", title="Agentic workflows in production", channel_name="AI Daily", source="takeout"),
        VideoRecord(video_id="a3", title="My vacation vlog", channel_name="LifeCh", source="takeout"),
    ]
    up, skip = ingest_videos(repo, records)
    assert up == 3 and skip == 0

    hits = search_titles(repo, "RAG")
    assert len(hits) == 1 and hits[0]["video_id"] == "a1"
    hits = search_titles(repo, "AI Daily")
    assert len(hits) == 2
    hits = search_titles(repo, "")
    assert hits == []


def test_ingest_rejects_empty_ids(tmp_path: Path):
    repo = Repo(tmp_path / "yt.sqlite")
    up, skip = ingest_videos(repo, [VideoRecord(video_id="")])
    assert up == 0 and skip == 1
