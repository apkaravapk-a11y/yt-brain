"""yt-brain backend — REST + WebSocket on 127.0.0.1:11811.

Serves the React app (yt-brain-ui) and the Chrome extension. All business
logic delegates to services/ — this file is a thin adapter.
"""
from __future__ import annotations
import asyncio
import json
import os
import subprocess
from datetime import datetime
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
from ..modes.router import current_mode, set_mode, MODES, MODE_TABLE

DB_PATH = Path(os.environ.get("YT_BRAIN_DB", Path.home() / ".yt-brain" / "yt_brain.sqlite"))
UI_DIST = Path(__file__).resolve().parents[4] / "yt-brain-ui" / "dist"

app = FastAPI(title="yt-brain", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                # dev convenience; lock down for prod
    allow_methods=["*"],
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


# ---------- REST ----------

class ModeSetBody(BaseModel):
    name: str


def _ai_status() -> dict[str, Any]:
    """Ping the yt-ai router + Ollama directly. Both optional."""
    backends: list[dict[str, bool | str]] = []
    # yt-ai router
    try:
        import httpx
        r = httpx.get("http://127.0.0.1:11435/v1/status", timeout=0.8)
        avail = r.status_code == 200
    except Exception:
        avail = False
    backends.append({"name": "yt_ai_router", "available": avail})
    # ollama direct
    try:
        import httpx
        r = httpx.get("http://127.0.0.1:11434/api/tags", timeout=0.8)
        avail = r.status_code == 200
    except Exception:
        avail = False
    backends.append({"name": "ollama", "available": avail})
    backends.append({"name": "anthropic_cloud", "available": bool(os.environ.get("ANTHROPIC_API_KEY"))})
    backends.append({"name": "stub", "available": True})
    return {"backends": backends,
            "ai_router": "ok" if backends[0]["available"] else ("stub" if backends[-1]["available"] else "down")}


@app.get("/api/status")
def status() -> dict[str, Any]:
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
    ai = _ai_status()
    return {
        "video_count": repo.count_videos(),
        "mode": mode.name,
        "mode_persona": mode.persona_hint,
        "sentinels": sentinels,
        "backends": ai["backends"],
        "ai_router": ai["ai_router"],
        "db_path": str(DB_PATH),
        "ts": datetime.utcnow().isoformat() + "Z",
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
def ai_status() -> dict[str, Any]:
    return _ai_status()


class IngestTakeoutBody(BaseModel):
    archive: str


@app.post("/api/ingest/takeout")
def ingest_takeout(body: IngestTakeoutBody) -> dict[str, Any]:
    repo = _get_repo()
    up, skip = sync_svc.ingest_takeout(repo, body.archive)
    return {"inserted_or_updated": up, "skipped": skip}


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
        dead: list[WebSocket] = []
        for c in self.clients:
            try:
                await c.send_text(json.dumps(event))
            except Exception:
                dead.append(c)
        for d in dead:
            self.disconnect(d)


hub = LiveHub()


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await hub.connect(ws)
    try:
        # heartbeat
        await ws.send_text(json.dumps({"tag": "connect", "text": "live stream attached"}))
        while True:
            # Echo any client message back as a 'chat' event
            data = await ws.receive_text()
            await hub.broadcast({"tag": "chat", "text": data})
    except WebSocketDisconnect:
        hub.disconnect(ws)


# Background heartbeat — nudge UI every 30s so clients know we're alive
@app.on_event("startup")
async def _heartbeat_loop():
    async def loop():
        n = 0
        while True:
            await asyncio.sleep(30)
            n += 1
            await hub.broadcast({"tag": "heartbeat", "text": f"tick {n}"})
    asyncio.create_task(loop())


# ---------- Static UI mount ----------

if UI_DIST.exists():
    app.mount("/", StaticFiles(directory=str(UI_DIST), html=True), name="ui")
