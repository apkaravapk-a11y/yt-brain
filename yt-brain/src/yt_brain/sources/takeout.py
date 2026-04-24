"""Parse Google Takeout YouTube history.

Supports both watch-history.json (preferred) and watch-history.html (fallback).
"""
from __future__ import annotations
import json
import re
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Iterator

from .models import VideoRecord

_VIDEO_URL_RE = re.compile(r"youtube\.com/watch\?v=([A-Za-z0-9_-]{11})")
_CHANNEL_URL_RE = re.compile(r"youtube\.com/(channel/[A-Za-z0-9_-]+|@[A-Za-z0-9_.-]+)")


def _maybe_open_zip(path: Path) -> tuple[Path | zipfile.Path, bool]:
    if path.suffix.lower() == ".zip":
        zf = zipfile.ZipFile(path)
        return zipfile.Path(zf), True
    return path, False


def _iter_candidate_files(root) -> Iterator:
    if isinstance(root, zipfile.Path):
        stack = [root]
        while stack:
            cur = stack.pop()
            if cur.is_dir():
                stack.extend(cur.iterdir())
            else:
                name = cur.name.lower()
                if name in ("watch-history.json", "watch-history.html"):
                    yield cur
    else:
        for f in root.rglob("watch-history.*"):
            if f.suffix.lower() in (".json", ".html"):
                yield f


def _parse_json(fp) -> Iterator[VideoRecord]:
    if hasattr(fp, "open"):
        data = json.loads(fp.read_text(encoding="utf-8"))
    else:
        data = json.loads(Path(fp).read_text(encoding="utf-8"))
    for entry in data:
        url = entry.get("titleUrl", "") or ""
        m = _VIDEO_URL_RE.search(url)
        if not m:
            continue
        vid = m.group(1)
        title = (entry.get("title", "") or "").removeprefix("Watched ").strip()
        subtitles = entry.get("subtitles", []) or []
        channel_name = subtitles[0].get("name", "") if subtitles else ""
        ts_str = entry.get("time")
        try:
            watched_at = datetime.fromisoformat(ts_str.replace("Z", "+00:00")) if ts_str else None
        except Exception:
            watched_at = None
        yield VideoRecord(
            video_id=vid,
            title=title,
            channel_name=channel_name,
            url=f"https://youtu.be/{vid}",
            source="takeout",
            watched_at=watched_at,
        )


def _parse_html(fp) -> Iterator[VideoRecord]:
    """Best-effort regex parse of the HTML export."""
    text = fp.read_text(encoding="utf-8") if hasattr(fp, "read_text") else Path(fp).read_text(encoding="utf-8")
    seen: set[str] = set()
    for m in _VIDEO_URL_RE.finditer(text):
        vid = m.group(1)
        if vid in seen:
            continue
        seen.add(vid)
        yield VideoRecord(
            video_id=vid,
            url=f"https://youtu.be/{vid}",
            source="takeout",
        )


def parse_takeout(archive: str | Path) -> Iterator[VideoRecord]:
    """Yield VideoRecord for each entry in a Takeout export (zip or extracted folder)."""
    p = Path(archive)
    if not p.exists():
        raise FileNotFoundError(f"Takeout path not found: {archive}")

    root, _is_zip = _maybe_open_zip(p)
    got_any = False
    for cand in _iter_candidate_files(root):
        got_any = True
        name = (cand.name if hasattr(cand, "name") else cand.name).lower()
        if name.endswith(".json"):
            yield from _parse_json(cand)
        else:
            yield from _parse_html(cand)
    if not got_any:
        raise ValueError(f"No watch-history.* file found under {archive}")
