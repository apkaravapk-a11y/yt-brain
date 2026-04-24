"""Token-bucket rate limiter with jitter — defaults to 0.3 Hz for risk-3/10."""
from __future__ import annotations
import random
import time
from dataclasses import dataclass


@dataclass
class TokenBucket:
    rate_hz: float = 0.3             # tokens per second
    burst: int = 3                    # max accumulated tokens
    jitter_frac: float = 0.5          # 0 → deterministic; 0.5 → ±50%
    _tokens: float = 0.0
    _last: float = 0.0

    def __post_init__(self):
        self._tokens = float(self.burst)
        self._last = time.monotonic()

    def _refill(self):
        now = time.monotonic()
        dt = now - self._last
        self._last = now
        self._tokens = min(self.burst, self._tokens + dt * self.rate_hz)

    def acquire(self, n: int = 1) -> float:
        """Block until n tokens available; return seconds waited."""
        if n <= 0:
            return 0.0
        waited = 0.0
        while True:
            self._refill()
            if self._tokens >= n:
                self._tokens -= n
                # jitter on top of acquisition — adds human variance even on hits
                if self.jitter_frac > 0:
                    base = 1.0 / max(self.rate_hz, 1e-6)
                    jitter = base * self.jitter_frac * (2 * random.random() - 1)
                    if jitter > 0:
                        time.sleep(jitter)
                        waited += jitter
                return waited
            # need to wait for next token
            deficit = n - self._tokens
            sleep_for = deficit / max(self.rate_hz, 1e-6)
            time.sleep(sleep_for)
            waited += sleep_for
