"""Plain-text search over titles + transcripts. Vector search plugs in Phase 6."""
from __future__ import annotations
from ..storage.db import Repo


def search_titles(repo: Repo, query: str, limit: int = 20) -> list[dict]:
    q = query.strip().lower()
    if not q:
        return []
    hits: list[dict] = []
    for v in repo.iter_videos():
        hay = " ".join([v.get("title", ""), v.get("channel_name", "")]).lower()
        if q in hay:
            hits.append(v)
            if len(hits) >= limit:
                break
    return hits
