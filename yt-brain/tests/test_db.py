from datetime import datetime
from pathlib import Path

from yt_brain.storage.db import Repo
from yt_brain.sources.models import VideoRecord, WebEvent, Comment


def _repo(tmp_path: Path) -> Repo:
    return Repo(tmp_path / "yt.sqlite")


def test_upsert_and_count(tmp_path: Path):
    repo = _repo(tmp_path)
    assert repo.count_videos() == 0
    v = VideoRecord(video_id="abc", title="Hello", channel_name="X", source="youtube_api")
    assert repo.upsert_video(v) is True
    assert repo.count_videos() == 1
    # idempotent — second upsert with identical data should not break
    repo.upsert_video(v)
    assert repo.count_videos() == 1


def test_web_events_and_comments(tmp_path: Path):
    repo = _repo(tmp_path)
    repo.upsert_video(VideoRecord(video_id="vid1", source="psi_home"))
    now = datetime.utcnow()
    repo.put_web_events([
        WebEvent(surface="psi_home", captured_at=now, video_id="vid1", rank=1, text="tile"),
        WebEvent(surface="psi_trending", captured_at=now, video_id="vid1", rank=7),
    ])
    repo.put_comments([
        Comment(video_id="vid1", comment_id="c1", author="u1", body="great", likes=10),
    ])
    v = repo.get_video("vid1")
    assert v["video_id"] == "vid1"


def test_consent_recording(tmp_path: Path):
    repo = _repo(tmp_path)
    repo.record_consent(
        action="like", context={"channel": "X"}, asked=True,
        user_answer="allow", model_prediction="ask", p=0.5,
        features={"trust": 0.8},
    )
