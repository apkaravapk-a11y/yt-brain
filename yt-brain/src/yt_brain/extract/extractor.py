"""Extractor — calls yt-ai (or a pluggable chat callable) to produce a structured ExtractResult.

Tolerant of messy LLM output: finds the first JSON object in the response and
validates against ExtractResult. On failure, returns an ExtractResult with warnings
populated (no silent failure).
"""
from __future__ import annotations
import json
import re
from typing import Callable

from .schema import ExtractResult

_JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}")


def _first_json_object(text: str) -> dict | None:
    m = _JSON_BLOCK_RE.search(text)
    if not m:
        return None
    blob = m.group(0)
    try:
        return json.loads(blob)
    except Exception:
        return None


def extract(
    *,
    video_id: str,
    title: str,
    transcript: str,
    description: str = "",
    chat_callable: Callable[[list[dict]], dict] | None = None,
) -> ExtractResult:
    """Produce an ExtractResult. `chat_callable` takes OpenAI-style messages and
    returns a dict with at least a 'content' str field. Keep this injection-friendly
    so tests never hit the network.
    """
    prompt = (
        "You are a technical-video analyst. Extract named techniques, libraries, "
        "and any code snippets visible or described in this transcript. Return ONLY a "
        "JSON object with keys: techniques (list of {name, description, evidence_quote, confidence}), "
        "libraries (list of {name, version, purpose}), snippets (list of {language, code, reconstructed}), "
        "overall_confidence (0-1), warnings (list of str).\n\n"
        f"TITLE: {title}\nDESCRIPTION: {description[:800]}\n\nTRANSCRIPT:\n{transcript[:12000]}"
    )
    if chat_callable is None:
        return ExtractResult(video_id=video_id, title=title,
                             warnings=["no chat_callable provided; returning empty extract"])
    try:
        resp = chat_callable([{"role": "user", "content": prompt}])
    except Exception as exc:
        return ExtractResult(video_id=video_id, title=title, warnings=[f"chat_callable failed: {exc}"])
    content = (resp.get("content") or "").strip()
    obj = _first_json_object(content)
    if obj is None:
        return ExtractResult(
            video_id=video_id, title=title, model_used=resp.get("model", ""),
            warnings=["no JSON object in model response", content[:400]],
        )
    try:
        obj.setdefault("video_id", video_id)
        obj.setdefault("title", title)
        obj.setdefault("model_used", resp.get("model", ""))
        return ExtractResult.model_validate(obj)
    except Exception as exc:
        return ExtractResult(
            video_id=video_id, title=title, model_used=resp.get("model", ""),
            warnings=[f"schema validation failed: {exc}", content[:400]],
        )
