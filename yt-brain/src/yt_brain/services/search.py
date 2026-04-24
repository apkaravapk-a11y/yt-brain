"""Plain-text search over titles + channels. Vector search plugs in later.

Batch C3: replaced the Python-side O(N) filter with a bounded SQL LIKE query.
"""
from __future__ import annotations
import json
from ..storage.db import Repo


def search_titles(repo: Repo, query: str, limit: int = 20) -> list[dict]:
    q = query.strip()
    if not q:
        return []
    needle = f"%{q.lower()}%"
    with repo.tx() as conn:
        rows = conn.execute(
            """
            SELECT * FROM videos
            WHERE LOWER(title) LIKE ? OR LOWER(channel_name) LIKE ?
            ORDER BY COALESCE(watched_at, captured_at) DESC
            LIMIT ?
            """,
            (needle, needle, int(limit)),
        ).fetchall()
    out: list[dict] = []
    for r in rows:
        d = dict(r)
        if d.get("extra_json"):
            try:
                d["extra"] = json.loads(d.pop("extra_json"))
            except Exception:
                d.pop("extra_json", None)
        out.append(d)
    return out
