"""Sync orchestrator. Pulls from enabled sources, normalizes to VideoRecord, upserts.

The YouTube API source is lazy-loaded — its dependencies (google-auth, etc.) are only
required for the actual `sync` operation, not for tests of Takeout ingest or search.
"""
from __future__ import annotations
from collections.abc import Iterable

from ..sources.models import VideoRecord
from ..storage.db import Repo


def ingest_videos(repo: Repo, records: Iterable[VideoRecord]) -> tuple[int, int]:
    """Upsert a stream of records. Returns (inserted_or_updated, skipped)."""
    up = skip = 0
    for v in records:
        if not v.video_id:
            skip += 1
            continue
        if repo.upsert_video(v):
            up += 1
        else:
            skip += 1
    return up, skip


def ingest_takeout(repo: Repo, archive: str) -> tuple[int, int]:
    from ..sources.takeout import parse_takeout
    return ingest_videos(repo, parse_takeout(archive))
