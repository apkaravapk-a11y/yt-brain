"""Session-scoped consent windows — the d-escape-hatch from Q2.

Non-persistent by design: code refuses to serialize windows beyond process lifetime.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from threading import RLock


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Window:
    action: str
    expires_at: datetime
    max_count: int | None
    used: int = 0
    opened_at: datetime = field(default_factory=_utc_now)

    def is_open(self) -> bool:
        if _utc_now() >= self.expires_at:
            return False
        if self.max_count is not None and self.used >= self.max_count:
            return False
        return True


class WindowRegistry:
    def __init__(self):
        self._lock = RLock()
        self._by_action: dict[str, Window] = {}

    def open(self, action: str, duration: timedelta, max_count: int | None = None) -> Window:
        with self._lock:
            w = Window(action=action,
                       expires_at=_utc_now() + duration,
                       max_count=max_count)
            self._by_action[action] = w
            return w

    def close(self, action: str):
        with self._lock:
            self._by_action.pop(action, None)

    def is_open_for(self, action: str) -> bool:
        with self._lock:
            w = self._by_action.get(action)
            if not w:
                return False
            if not w.is_open():
                self._by_action.pop(action, None)
                return False
            return True

    def consume(self, action: str) -> bool:
        with self._lock:
            w = self._by_action.get(action)
            if not w or not w.is_open():
                return False
            w.used += 1
            return True

    def list_open(self) -> list[Window]:
        with self._lock:
            return [w for w in self._by_action.values() if w.is_open()]

    # Explicitly refuse serialization
    def __getstate__(self):
        raise RuntimeError("ConsentWindow state is non-persistent by design")
    def __reduce__(self):
        raise RuntimeError("ConsentWindow state is non-persistent by design")
