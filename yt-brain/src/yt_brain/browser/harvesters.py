"""Ψ — web-surface harvesters. One function per YouTube surface.

Each harvester takes a Driver + any surface-specific args, returns a HarvestResult.
Real DOM selectors land during Phase 1.5 execute; scaffold stubs validate the
contract (HarvestResult shape) so downstream tests/adapters can be wired now.
"""
from __future__ import annotations
from datetime import datetime
from typing import Callable

from ..sources.models import HarvestResult, VideoRecord, WebEvent, Comment
from .driver import Driver


Harvester = Callable[[Driver], HarvestResult]


def _empty(surface: str) -> HarvestResult:
    return HarvestResult(surface=surface, captured_at=datetime.utcnow())


def harvest_home(driver: Driver) -> HarvestResult:
    """Harvest the personalized YouTube home feed."""
    res = _empty("psi_home")
    try:
        driver.goto("https://youtube.com/")
        # DOM scraping wired in Phase 1.5 execute — stub keeps contract valid
    except Exception as exc:
        res.errors.append(f"home: {exc}")
    return res


def harvest_trending(driver: Driver) -> HarvestResult:
    res = _empty("psi_trending")
    try:
        driver.goto("https://youtube.com/feed/trending")
    except Exception as exc:
        res.errors.append(f"trending: {exc}")
    return res


def harvest_history(driver: Driver) -> HarvestResult:
    """Live history — the holy grail. Replaces deprecated Data API endpoint."""
    res = _empty("psi_history")
    try:
        driver.goto("https://youtube.com/feed/history")
    except Exception as exc:
        res.errors.append(f"history: {exc}")
    return res


def harvest_subscriptions(driver: Driver) -> HarvestResult:
    res = _empty("psi_subs")
    try:
        driver.goto("https://youtube.com/feed/subscriptions")
    except Exception as exc:
        res.errors.append(f"subs: {exc}")
    return res


def harvest_library(driver: Driver) -> HarvestResult:
    res = _empty("psi_library")
    try:
        driver.goto("https://youtube.com/feed/library")
    except Exception as exc:
        res.errors.append(f"library: {exc}")
    return res


REGISTRY: dict[str, Harvester] = {
    "home": harvest_home,
    "trending": harvest_trending,
    "history": harvest_history,
    "subs": harvest_subscriptions,
    "library": harvest_library,
}
