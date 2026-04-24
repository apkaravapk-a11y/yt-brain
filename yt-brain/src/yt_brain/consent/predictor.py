"""LightGBM predictor wrapper with a safe no-model fallback.

During Phase 1.5 scaffold, a `HeuristicPredictor` is used; Phase 8.5 swaps in
`LightGBMPredictor` once training data accumulates.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path


class HeuristicPredictor:
    """Deterministic predictor for bootstrap. Returns midpoint ('ask') for everything
    it hasn't seen, slight lean toward the user's stated preferences otherwise."""

    def __init__(self):
        # Tiny baseline: user's durable wide-floor preference biases all writes toward 'ask'
        self._priors = {
            "like": 0.55,
            "save_to_playlist": 0.55,
        }

    def predict(self, action: str, context: dict) -> tuple[float, dict]:
        p = self._priors.get(action, 0.5)
        return p, {"baseline": "heuristic", "prior": p}


@dataclass
class LightGBMPredictor:
    model_path: Path

    def predict(self, action: str, context: dict) -> tuple[float, dict]:
        # Placeholder wired up in Phase 8.5 once lightgbm install + feature extractor land.
        raise NotImplementedError("Wire in Phase 8.5 after data accumulates.")
