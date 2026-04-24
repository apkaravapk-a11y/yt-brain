"""Model router — picks a backend per role + falls back gracefully.

Role → [backends in preference order]. Each backend either produces a response
or raises `BackendUnavailable`; the router tries the next until exhaustion.
"""
from __future__ import annotations
import os
from dataclasses import dataclass
from typing import Any, Protocol


class BackendUnavailable(Exception):
    pass


class Backend(Protocol):
    name: str
    def chat(self, messages: list[dict], model: str | None = None, **kw) -> dict: ...
    def embed(self, texts: list[str], model: str | None = None) -> list[list[float]]: ...
    def available(self) -> bool: ...


@dataclass
class OllamaBackend:
    name: str = "ollama"
    host: str = "http://127.0.0.1:11434"
    default_chat: str = "qwen2.5:7b-instruct-q4_K_M"
    default_embed: str = "nomic-embed-text"

    def available(self) -> bool:
        import httpx
        try:
            httpx.get(f"{self.host}/api/tags", timeout=0.8)
            return True
        except Exception:
            return False

    def chat(self, messages, model=None, **kw):
        import httpx
        m = model or self.default_chat
        try:
            r = httpx.post(
                f"{self.host}/api/chat",
                json={"model": m, "messages": messages, "stream": False},
                timeout=120.0,
            )
            r.raise_for_status()
            data = r.json()
            return {"backend": self.name, "model": m,
                    "content": data.get("message", {}).get("content", ""),
                    "raw": data}
        except Exception as exc:
            raise BackendUnavailable(str(exc))

    def embed(self, texts, model=None):
        import httpx
        m = model or self.default_embed
        out: list[list[float]] = []
        for t in texts:
            try:
                r = httpx.post(f"{self.host}/api/embeddings",
                               json={"model": m, "prompt": t}, timeout=60.0)
                r.raise_for_status()
                out.append(r.json().get("embedding", []))
            except Exception as exc:
                raise BackendUnavailable(str(exc))
        return out


@dataclass
class AnthropicCloudBackend:
    name: str = "anthropic_cloud"
    api_key_env: str = "ANTHROPIC_API_KEY"
    default_chat: str = "claude-haiku-4-5-20251001"

    def available(self) -> bool:
        return bool(os.environ.get(self.api_key_env))

    def chat(self, messages, model=None, **kw):
        import httpx
        key = os.environ.get(self.api_key_env)
        if not key:
            raise BackendUnavailable("no ANTHROPIC_API_KEY")
        m = model or self.default_chat
        try:
            system_parts = [mm["content"] for mm in messages if mm.get("role") == "system"]
            convo = [mm for mm in messages if mm.get("role") != "system"]
            r = httpx.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={"model": m, "max_tokens": 2048, "system": "\n".join(system_parts), "messages": convo},
                timeout=60.0,
            )
            r.raise_for_status()
            data = r.json()
            content = ""
            for block in data.get("content", []):
                if block.get("type") == "text":
                    content += block.get("text", "")
            return {"backend": self.name, "model": m, "content": content, "raw": data}
        except Exception as exc:
            raise BackendUnavailable(str(exc))

    def embed(self, texts, model=None):
        raise BackendUnavailable("anthropic does not provide embeddings via this backend")


class StubBackend:
    """Safe local stub — returns deterministic content. Used when nothing else works."""
    name = "stub"

    def available(self) -> bool:
        return True

    def chat(self, messages, model=None, **kw):
        last = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
        return {"backend": self.name, "model": "stub",
                "content": f"[stub response to] {last[:200]}"}

    def embed(self, texts, model=None):
        # deterministic low-dim hash-based embedding so tests can run offline
        import hashlib, math
        out = []
        for t in texts:
            h = hashlib.sha256(t.encode("utf-8")).digest()
            # 16-dim floats in [-1, 1]
            vec = [((h[i] / 255.0) * 2.0 - 1.0) for i in range(16)]
            n = math.sqrt(sum(v * v for v in vec)) or 1.0
            out.append([v / n for v in vec])
        return out


class Router:
    def __init__(self, backends: list[Backend] | None = None):
        self.backends = backends or [OllamaBackend(), AnthropicCloudBackend(), StubBackend()]

    def _pick(self) -> list[Backend]:
        return [b for b in self.backends if b.available()]

    def chat(self, messages: list[dict], *, model: str | None = None) -> dict[str, Any]:
        errors: list[str] = []
        for b in self._pick():
            try:
                return b.chat(messages, model=model)
            except BackendUnavailable as exc:
                errors.append(f"{b.name}: {exc}")
        # exhausted — fallback to stub explicitly
        return StubBackend().chat(messages) | {"fallback_errors": errors}

    def embed(self, texts: list[str], *, model: str | None = None) -> dict[str, Any]:
        errors: list[str] = []
        for b in self._pick():
            try:
                vecs = b.embed(texts, model=model)
                return {"backend": b.name, "vectors": vecs}
            except BackendUnavailable as exc:
                errors.append(f"{b.name}: {exc}")
        return {"backend": "stub", "vectors": StubBackend().embed(texts),
                "fallback_errors": errors}
