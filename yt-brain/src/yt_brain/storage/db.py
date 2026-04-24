"""SQLite repository for videos, web events, comments, consent events, and 3D positions.

One file, WAL-mode, large cache. All writes go through the repository — no direct SQL
from higher layers.
"""
from __future__ import annotations
import sqlite3
from contextlib import contextmanager
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Iterable

from ..sources.models import VideoRecord, WebEvent, Comment


SCHEMA = """
CREATE TABLE IF NOT EXISTS videos (
    video_id       TEXT PRIMARY KEY,
    title          TEXT NOT NULL DEFAULT '',
    channel_id     TEXT NOT NULL DEFAULT '',
    channel_name   TEXT NOT NULL DEFAULT '',
    duration_sec   INTEGER,
    published_at   TEXT,
    url            TEXT NOT NULL DEFAULT '',
    thumbnail_url  TEXT NOT NULL DEFAULT '',
    source         TEXT NOT NULL,
    captured_at    TEXT NOT NULL,
    watched_at     TEXT,
    transcript_status TEXT NOT NULL DEFAULT 'pending',
    transcript_hash TEXT,
    extra_json     TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_source ON videos(source);

CREATE TABLE IF NOT EXISTS transcripts (
    video_id      TEXT PRIMARY KEY REFERENCES videos(video_id) ON DELETE CASCADE,
    text          TEXT NOT NULL,
    segments_json TEXT NOT NULL DEFAULT '[]',
    fetched_at    TEXT NOT NULL,
    hash          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id      TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    ordinal       INTEGER NOT NULL,
    start_sec     REAL,
    end_sec       REAL,
    text          TEXT NOT NULL,
    embedding_dim INTEGER,
    UNIQUE(video_id, ordinal)
);
CREATE INDEX IF NOT EXISTS idx_chunks_video ON chunks(video_id);

CREATE TABLE IF NOT EXISTS web_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    surface     TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    video_id    TEXT,
    rank        INTEGER,
    text        TEXT NOT NULL DEFAULT '',
    meta_json   TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_web_events_surface ON web_events(surface, captured_at);
CREATE INDEX IF NOT EXISTS idx_web_events_video ON web_events(video_id);

CREATE TABLE IF NOT EXISTS comments (
    video_id          TEXT NOT NULL,
    comment_id        TEXT NOT NULL,
    author            TEXT NOT NULL DEFAULT '',
    body              TEXT NOT NULL DEFAULT '',
    likes             INTEGER NOT NULL DEFAULT 0,
    is_pinned         INTEGER NOT NULL DEFAULT 0,
    timestamp         TEXT,
    parent_comment_id TEXT,
    PRIMARY KEY(video_id, comment_id)
);
CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);

CREATE TABLE IF NOT EXISTS consent_events (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    ts                TEXT NOT NULL,
    action            TEXT NOT NULL,
    context_json      TEXT NOT NULL DEFAULT '{}',
    asked             INTEGER NOT NULL,
    user_answer       TEXT,            -- allow | deny | defer | NULL
    model_prediction  TEXT,            -- allow | deny | ask
    p                 REAL,
    features_json     TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS videos_3d (
    video_id         TEXT PRIMARY KEY REFERENCES videos(video_id) ON DELETE CASCADE,
    x                REAL NOT NULL,
    y                REAL NOT NULL,
    z                REAL NOT NULL,
    color_hex        TEXT NOT NULL DEFAULT '#888888',
    size             REAL NOT NULL DEFAULT 1.0,
    opacity          REAL NOT NULL DEFAULT 1.0,
    last_projected_at TEXT NOT NULL,
    umap_version     TEXT NOT NULL DEFAULT 'v1'
);

CREATE TABLE IF NOT EXISTS schema_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


class Repo:
    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA cache_size=-32000000")  # 32 GB (negative = KB)
        return conn

    @contextmanager
    def tx(self):
        conn = self._connect()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_schema(self):
        with self.tx() as conn:
            conn.executescript(SCHEMA)
            conn.execute(
                "INSERT OR IGNORE INTO schema_meta(key, value) VALUES('version', '1')"
            )

    # --- videos ---
    def upsert_video(self, v: VideoRecord) -> bool:
        """Return True if inserted/updated with meaningful change; False if unchanged."""
        import json as _json
        with self.tx() as conn:
            cur = conn.execute(
                """
                INSERT INTO videos(video_id, title, channel_id, channel_name, duration_sec,
                                   published_at, url, thumbnail_url, source, captured_at,
                                   watched_at, transcript_status, transcript_hash, extra_json)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT(video_id) DO UPDATE SET
                    title          = CASE WHEN excluded.title != '' THEN excluded.title ELSE videos.title END,
                    channel_id     = CASE WHEN excluded.channel_id != '' THEN excluded.channel_id ELSE videos.channel_id END,
                    channel_name   = CASE WHEN excluded.channel_name != '' THEN excluded.channel_name ELSE videos.channel_name END,
                    duration_sec   = COALESCE(excluded.duration_sec, videos.duration_sec),
                    published_at   = COALESCE(excluded.published_at, videos.published_at),
                    url            = CASE WHEN excluded.url != '' THEN excluded.url ELSE videos.url END,
                    thumbnail_url  = CASE WHEN excluded.thumbnail_url != '' THEN excluded.thumbnail_url ELSE videos.thumbnail_url END,
                    watched_at     = COALESCE(excluded.watched_at, videos.watched_at)
                """,
                (
                    v.video_id, v.title, v.channel_id, v.channel_name, v.duration_sec,
                    _iso(v.published_at), v.url, v.thumbnail_url, v.source,
                    _iso(v.captured_at) or datetime.utcnow().isoformat(),
                    _iso(v.watched_at),
                    v.transcript_status, v.transcript_hash,
                    _json.dumps(v.extra or {}),
                ),
            )
            return cur.rowcount > 0

    def get_video(self, video_id: str) -> dict | None:
        with self.tx() as conn:
            row = conn.execute("SELECT * FROM videos WHERE video_id=?", (video_id,)).fetchone()
            return dict(row) if row else None

    def count_videos(self) -> int:
        with self.tx() as conn:
            return conn.execute("SELECT COUNT(*) FROM videos").fetchone()[0]

    def iter_videos(self) -> Iterable[dict]:
        with self.tx() as conn:
            for row in conn.execute("SELECT * FROM videos"):
                yield dict(row)

    # --- transcripts ---
    def put_transcript(self, video_id: str, text: str, segments_json: str, h: str):
        with self.tx() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO transcripts(video_id, text, segments_json, fetched_at, hash)
                   VALUES(?,?,?,?,?)""",
                (video_id, text, segments_json, datetime.utcnow().isoformat(), h),
            )
            conn.execute(
                "UPDATE videos SET transcript_status='present', transcript_hash=? WHERE video_id=?",
                (h, video_id),
            )

    # --- web events ---
    def put_web_events(self, events: list[WebEvent]):
        import json as _json
        if not events:
            return
        with self.tx() as conn:
            conn.executemany(
                """INSERT INTO web_events(surface, captured_at, video_id, rank, text, meta_json)
                   VALUES(?,?,?,?,?,?)""",
                [
                    (e.surface, _iso(e.captured_at), e.video_id, e.rank, e.text, _json.dumps(e.meta))
                    for e in events
                ],
            )

    # --- comments ---
    def put_comments(self, comments: list[Comment]):
        if not comments:
            return
        with self.tx() as conn:
            conn.executemany(
                """INSERT OR REPLACE INTO comments
                   (video_id, comment_id, author, body, likes, is_pinned, timestamp, parent_comment_id)
                   VALUES(?,?,?,?,?,?,?,?)""",
                [
                    (c.video_id, c.comment_id, c.author, c.body, c.likes,
                     1 if c.is_pinned else 0, _iso(c.timestamp), c.parent_comment_id)
                    for c in comments
                ],
            )

    # --- consent ---
    def record_consent(self, *, action: str, context: dict, asked: bool,
                       user_answer: str | None, model_prediction: str | None,
                       p: float | None, features: dict):
        import json as _json
        with self.tx() as conn:
            conn.execute(
                """INSERT INTO consent_events
                   (ts, action, context_json, asked, user_answer, model_prediction, p, features_json)
                   VALUES(?,?,?,?,?,?,?,?)""",
                (
                    datetime.utcnow().isoformat(), action, _json.dumps(context),
                    1 if asked else 0, user_answer, model_prediction, p,
                    _json.dumps(features),
                ),
            )
