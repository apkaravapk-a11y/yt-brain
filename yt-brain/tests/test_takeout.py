import json
from pathlib import Path

from yt_brain.sources.takeout import parse_takeout


def test_parse_takeout_json(tmp_path: Path):
    data = [
        {
            "header": "YouTube",
            "title": "Watched Introduction to RAG",
            "titleUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "subtitles": [{"name": "Some Channel", "url": "https://youtube.com/@ch"}],
            "time": "2026-04-20T12:34:56.000Z",
        },
        {
            "header": "YouTube",
            "title": "Watched Another Video",
            "titleUrl": "https://www.youtube.com/watch?v=abcdefghijk",
            "subtitles": [],
            "time": "2026-04-21T10:00:00.000Z",
        },
    ]
    takeout = tmp_path / "Takeout" / "YouTube and YouTube Music" / "history"
    takeout.mkdir(parents=True)
    (takeout / "watch-history.json").write_text(json.dumps(data), encoding="utf-8")

    records = list(parse_takeout(tmp_path))
    assert len(records) == 2
    assert records[0].video_id == "dQw4w9WgXcQ"
    assert records[0].channel_name == "Some Channel"
    assert records[0].source == "takeout"
    assert records[0].watched_at is not None
    assert records[1].video_id == "abcdefghijk"


def test_parse_takeout_html_fallback(tmp_path: Path):
    html = """<html><body>
    <a href="https://www.youtube.com/watch?v=zzzzzzzzzzz">V1</a>
    <a href="https://www.youtube.com/watch?v=yyyyyyyyyyy">V2</a>
    <a href="https://www.youtube.com/watch?v=zzzzzzzzzzz">V1-dup</a>
    </body></html>"""
    takeout = tmp_path / "YouTube and YouTube Music" / "history"
    takeout.mkdir(parents=True)
    (takeout / "watch-history.html").write_text(html, encoding="utf-8")

    records = list(parse_takeout(tmp_path))
    ids = {r.video_id for r in records}
    assert ids == {"zzzzzzzzzzz", "yyyyyyyyyyy"}
