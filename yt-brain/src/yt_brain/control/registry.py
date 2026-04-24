"""Capability registry — single source of truth for what the system can do.

Every adapter (CLI, MCP, REST, WS, phone, voice) reads from this registry so they
stay in sync. Registering twice overwrites (last writer wins) so tests can swap
implementations.
"""
from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

REGISTRY_PATH = Path("C:/projects/yt-brain/data/registry.json")


@dataclass
class Capability:
    name: str                         # e.g. "video.search"
    summary: str
    params: dict[str, str]            # {param_name: type_hint_str}
    fn: Callable[..., Any]
    auth_required: bool = False       # e.g. true for anything that writes externally


class Registry:
    def __init__(self):
        self._by_name: dict[str, Capability] = {}

    def register(self, cap: Capability):
        self._by_name[cap.name] = cap

    def get(self, name: str) -> Capability:
        if name not in self._by_name:
            raise KeyError(f"unknown capability: {name}. known: {sorted(self._by_name)}")
        return self._by_name[name]

    def list(self) -> list[dict]:
        return [
            {"name": c.name, "summary": c.summary, "params": c.params, "auth_required": c.auth_required}
            for c in sorted(self._by_name.values(), key=lambda x: x.name)
        ]

    def dump_json(self, path: Path | None = None):
        p = path or REGISTRY_PATH
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(self.list(), indent=2), encoding="utf-8")
        return p


_default: Registry | None = None


def default() -> Registry:
    global _default
    if _default is None:
        _default = Registry()
        _register_all(_default)
    return _default


def _register_all(reg: Registry):
    """Wire capabilities into the default registry. Thin — each capability delegates
    to services/ or other modules. This is the only place that knows every capability."""
    from ..storage.db import Repo
    from ..services import sync as sync_svc
    from ..services import search as search_svc
    from ..consent.policy import ConsentPolicy
    from ..consent.predictor import HeuristicPredictor
    from ..consent.windows import WindowRegistry
    from ..modes.router import current_mode, set_mode, MODES

    _repo: Repo | None = None
    def _get_repo() -> Repo:
        nonlocal _repo
        if _repo is None:
            _repo = Repo(Path.home() / ".yt-brain" / "yt_brain.sqlite")
        return _repo

    reg.register(Capability(
        name="video.search", summary="Search titles+channels",
        params={"query": "str", "limit": "int"},
        fn=lambda query, limit=20: search_svc.search_titles(_get_repo(), query, limit=limit),
    ))
    reg.register(Capability(
        name="video.ingest_takeout", summary="Ingest Takeout zip/folder",
        params={"archive": "str"},
        fn=lambda archive: sync_svc.ingest_takeout(_get_repo(), archive),
    ))
    reg.register(Capability(
        name="video.count", summary="Return current video count",
        params={},
        fn=lambda: _get_repo().count_videos(),
    ))
    reg.register(Capability(
        name="consent.decide", summary="Run Π policy decision",
        params={"action": "str"},
        fn=lambda action: ConsentPolicy(predictor=HeuristicPredictor(), windows=WindowRegistry()).decide(action).__dict__,
    ))
    reg.register(Capability(
        name="mode.current", summary="Return current mode",
        params={},
        fn=lambda: current_mode().__dict__,
    ))
    reg.register(Capability(
        name="mode.set", summary="Set the current mode",
        params={"name": "str"},
        fn=lambda name: set_mode(name).__dict__,
    ))
    reg.register(Capability(
        name="mode.list", summary="List available modes",
        params={},
        fn=lambda: list(MODES),
    ))
