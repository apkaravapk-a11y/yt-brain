"""yt-brain backend — REST + WebSocket on 127.0.0.1:11811.

Serves the React app (yt-brain-ui) and the Chrome extension. All business
logic delegates to services/ — this file is a thin adapter.

Perf remediation pass (Batch C):
- C1: /api/status caches the AI-probe result for 30 s and probes concurrently.
- C4: /api/live/visit endpoint wired for the Chrome extension.
- C5: deprecated on_event startup replaced with lifespan context manager.
- C6: datetime.utcnow() replaced with datetime.now(timezone.utc).
- C8: CORS origins driven by YT_BRAIN_CORS_ORIGINS env.
"""
from __future__ import annotations
import asyncio
import contextlib
import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ..storage.db import Repo
from ..services import sync as sync_svc
from ..services import search as search_svc
from ..consent.policy import ConsentPolicy
from ..consent.predictor import HeuristicPredictor
from ..consent.windows import WindowRegistry
from ..modes.router import current_mode, set_mode, MODES
from ..sources.models import VideoRecord

DB_PATH = Path(os.environ.get("YT_BRAIN_DB", Path.home() / ".yt-brain" / "yt_brain.sqlite"))
UI_DIST = Path(__file__).resolve().parents[4] / "yt-brain-ui" / "dist"


@contextlib.asynccontextmanager
async def lifespan(_: FastAPI):
    # One-shot: warm the repo + initial AI-probe so the first real request is fast.
    _get_repo()
    await _refresh_ai_status_cache()
    yield


app = FastAPI(title="yt-brain", version="0.2.0", lifespan=lifespan)

_cors_env = os.environ.get("YT_BRAIN_CORS_ORIGINS", "").strip()
_default_origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://yt-brain-ui.vercel.app",
]
origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or _default_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=False,
)

_repo: Repo | None = None
_policy = ConsentPolicy(predictor=HeuristicPredictor(), windows=WindowRegistry())


def _get_repo() -> Repo:
    global _repo
    if _repo is None:
        _repo = Repo(DB_PATH)
    return _repo


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- AI status cache (C1) ----------

_AI_TTL = 30.0  # seconds
_ai_cache: dict[str, Any] = {"at": 0.0, "data": None}
_ai_lock = asyncio.Lock()


async def _probe_url(client, url: str) -> bool:
    try:
        r = await client.get(url, timeout=0.8)
        return r.status_code == 200
    except Exception:
        return False


async def _refresh_ai_status_cache() -> dict[str, Any]:
    import httpx
    async with httpx.AsyncClient() as client:
        yt_ai, ollama = await asyncio.gather(
            _probe_url(client, "http://127.0.0.1:11435/v1/status"),
            _probe_url(client, "http://127.0.0.1:11434/api/tags"),
        )
    backends = [
        {"name": "yt_ai_router", "available": yt_ai},
        {"name": "ollama", "available": ollama},
        {"name": "anthropic_cloud", "available": bool(os.environ.get("ANTHROPIC_API_KEY"))},
        {"name": "stub", "available": True},
    ]
    data = {
        "backends": backends,
        "ai_router": "ok" if yt_ai else ("stub" if backends[-1]["available"] else "down"),
    }
    _ai_cache["at"] = time.monotonic()
    _ai_cache["data"] = data
    return data


async def _ai_status_cached() -> dict[str, Any]:
    if _ai_cache["data"] is not None and (time.monotonic() - _ai_cache["at"]) < _AI_TTL:
        return _ai_cache["data"]
    async with _ai_lock:
        # Re-check under the lock in case another caller already refreshed.
        if _ai_cache["data"] is not None and (time.monotonic() - _ai_cache["at"]) < _AI_TTL:
            return _ai_cache["data"]
        return await _refresh_ai_status_cache()


# ---------- REST ----------

class ModeSetBody(BaseModel):
    name: str


class IngestTakeoutBody(BaseModel):
    archive: str


class LiveVisitBody(BaseModel):
    url: str
    title: str = ""
    ts: int | float | None = None


@app.get("/api/status")
async def status() -> dict[str, Any]:
    repo = _get_repo()
    mode = current_mode()
    sentinels = {
        name: Path(p).exists()
        for name, p in [
            ("brainstorm-off", "C:/docs/.brainstorm-off"),
            ("consent-pause", "C:/docs/.consent-pause"),
            ("browser-halt", "C:/docs/.browser-halt"),
            ("notify-off", "C:/docs/.notify-off"),
            ("halt-all", "C:/docs/.halt-all"),
            ("thermal-pause", "C:/docs/.thermal-pause"),
        ]
    }
    ai = await _ai_status_cached()
    return {
        "video_count": repo.count_videos(),
        "mode": mode.name,
        "mode_persona": mode.persona_hint,
        "sentinels": sentinels,
        "backends": ai["backends"],
        "ai_router": ai["ai_router"],
        "db_path": str(DB_PATH),
        "ts": _now_iso(),
    }


@app.get("/api/videos")
def videos(q: str | None = None, limit: int = 60) -> list[dict[str, Any]]:
    repo = _get_repo()
    if q:
        return search_svc.search_titles(repo, q, limit=limit)
    return list(repo.iter_videos())[:limit]


@app.get("/api/consent/decide")
def consent_decide(action: str) -> dict[str, Any]:
    r = _policy.decide(action)
    return {"decision": r.decision, "reason": r.reason, "p": r.p}


@app.get("/api/mode")
def mode_get() -> dict[str, Any]:
    return current_mode().__dict__


@app.post("/api/mode")
def mode_post(body: ModeSetBody) -> dict[str, Any]:
    return set_mode(body.name).__dict__


@app.get("/api/mode/list")
def mode_list() -> list[str]:
    return list(MODES)


@app.get("/api/ai/status")
async def ai_status() -> dict[str, Any]:
    return await _ai_status_cached()


@app.post("/api/ingest/takeout")
def ingest_takeout(body: IngestTakeoutBody) -> dict[str, Any]:
    repo = _get_repo()
    up, skip = sync_svc.ingest_takeout(repo, body.archive)
    return {"inserted_or_updated": up, "skipped": skip}


# C4: live visit from the Chrome extension.
_VIDEO_URL_RE = re.compile(r"[?&]v=([A-Za-z0-9_-]{11})")


@app.post("/api/live/visit")
async def live_visit(body: LiveVisitBody) -> dict[str, Any]:
    m = _VIDEO_URL_RE.search(body.url or "")
    if not m:
        return {"ok": False, "reason": "no video id in url"}
    vid = m.group(1)
    title = (body.title or "").replace(" - YouTube", "").strip()
    repo = _get_repo()
    repo.upsert_video(VideoRecord(
        video_id=vid, title=title, url=body.url,
        source="live_visit", watched_at=datetime.now(timezone.utc),
    ))
    await hub.broadcast({
        "tag": "live.visit",
        "text": f"{vid} — {title[:80]}",
    })
    return {"ok": True, "video_id": vid}


# ---------- WebSocket live stream ----------

class LiveHub:
    def __init__(self):
        self.clients: set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.clients.add(ws)

    def disconnect(self, ws: WebSocket):
        self.clients.discard(ws)

    async def broadcast(self, event: dict[str, Any]):
        if not self.clients:
            return
        payload = json.dumps(event)
        dead: list[WebSocket] = []
        for c in self.clients:
            try:
                await c.send_text(payload)
            except Exception:
                dead.append(c)
        for d in dead:
            self.disconnect(d)


hub = LiveHub()


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await hub.connect(ws)
    try:
        await ws.send_text(json.dumps({"tag": "connect", "text": "live stream attached"}))
        while True:
            data = await ws.receive_text()
            await hub.broadcast({"tag": "chat", "text": data})
    except WebSocketDisconnect:
        hub.disconnect(ws)


# ---------- Static UI mount ----------

if UI_DIST.exists():
    app.mount("/", StaticFiles(directory=str(UI_DIST), html=True), name="ui")
