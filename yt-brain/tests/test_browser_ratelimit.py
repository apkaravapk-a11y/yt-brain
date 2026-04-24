import time

from yt_brain.browser.rate_limit import TokenBucket
from yt_brain.browser.driver import session_info
from yt_brain.browser.harvesters import REGISTRY, harvest_home


def test_rate_limiter_bursts_then_paces(monkeypatch):
    bucket = TokenBucket(rate_hz=100.0, burst=3, jitter_frac=0.0)  # fast + no jitter for test
    t0 = time.monotonic()
    # first 3 acquisitions should be ~instant
    for _ in range(3):
        assert bucket.acquire() >= 0.0
    # the 4th forces a wait
    assert bucket.acquire() > 0.0
    assert time.monotonic() - t0 < 0.5  # still fast


def test_session_info_reports_flags():
    info = session_info()
    assert isinstance(info.playwright_available, bool)
    assert info.profile_path.endswith("yt-brain-chrome")


def test_harvester_registry_has_expected_surfaces():
    assert set(REGISTRY.keys()) >= {"home", "trending", "history", "subs", "library"}
