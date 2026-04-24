"""FastAPI OpenAI-compatible router server on 127.0.0.1:11435."""
from __future__ import annotations
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel

from .router import Router

app = FastAPI(title="yt-ai", version="0.1.0")
_router = Router()


class ChatMsg(BaseModel):
    role: str
    content: str


class ChatReq(BaseModel):
    model: str | None = None
    messages: list[ChatMsg]


class EmbedReq(BaseModel):
    model: str | None = None
    input: list[str] | str


@app.get("/v1/status")
def status() -> dict[str, Any]:
    return {
        "service": "yt-ai",
        "backends": [b.name for b in _router.backends],
        "available": [b.name for b in _router.backends if b.available()],
    }


@app.post("/v1/chat/completions")
def chat(req: ChatReq) -> dict[str, Any]:
    return _router.chat([m.model_dump() for m in req.messages], model=req.model)


@app.post("/v1/embeddings")
def embeddings(req: EmbedReq) -> dict[str, Any]:
    texts = [req.input] if isinstance(req.input, str) else req.input
    return _router.embed(texts, model=req.model)
