"""Canonical data shapes shared by every source and the storage layer."""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Literal, Any

SourceName = Literal[
    "youtube_api", "takeout", "mobile_feed",
    "psi_home", "psi_trending", "psi_search", "psi_channel",
    "psi_watch", "psi_subs", "psi_history", "psi_library",
    "yt_dlp", "twitch", "vimeo", "podcast", "twitter",
]


@dataclass
class VideoRecord:
    video_id: str
    title: str = ""
    channel_id: str = ""
    channel_name: str = ""
    duration_sec: int | None = None
    published_at: datetime | None = None
    url: str = ""
    thumbnail_url: str = ""
    source: SourceName = "youtube_api"
    captured_at: datetime = field(default_factory=datetime.utcnow)
    watched_at: datetime | None = None
    transcript_status: Literal["present", "unavailable", "pending"] = "pending"
    transcript_hash: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        for k, v in d.items():
            if isinstance(v, datetime):
                d[k] = v.isoformat()
        return d


@dataclass
class PlaylistRecord:
    playlist_id: str
    title: str
    item_count: int = 0
    owner: str = "self"
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class WebEvent:
    """A page-rank/impression event from Ψ browser harvesters."""
    surface: str
    captured_at: datetime
    video_id: str | None = None
    rank: int | None = None
    text: str = ""
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class Comment:
    video_id: str
    comment_id: str
    author: str
    body: str
    likes: int = 0
    is_pinned: bool = False
    timestamp: datetime | None = None
    parent_comment_id: str | None = None


@dataclass
class HarvestResult:
    surface: str
    captured_at: datetime
    videos: list[VideoRecord] = field(default_factory=list)
    web_events: list[WebEvent] = field(default_factory=list)
    comments: list[Comment] = field(default_factory=list)
    screenshots: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
