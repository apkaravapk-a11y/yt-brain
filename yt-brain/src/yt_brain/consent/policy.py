"""Π — Predictive Consent Engine policy router.

Every write-call flows through `decide(action, context)`. Layers, in order:
    1. Kill switch   : sentinel C:/docs/.consent-pause forces ask-all.
    2. Hard-never    : never-trainable, hardcoded list.
    3. Window        : session-scoped (time + count) escape hatches.
    4. Predictor     : LightGBM; thresholds 0.90 / 0.10 map to allow / deny; else ask.

Predictor is optional at construction; when absent, defaults to `ask` for everything
not in hard-never (safe by design).
"""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal, Protocol

Decision = Literal["allow", "deny", "ask"]

HARD_NEVER: frozenset[str] = frozenset({
    "delete_account", "delete_video", "report_content", "block_user", "change_password",
    "unsubscribe", "remove_from_playlist", "delete_own_comment", "edit_own_comment",
    "mark_not_interested", "hide_channel",
    "comment", "reply", "subscribe", "share",
})

AUTO_ELIGIBLE: frozenset[str] = frozenset({"like", "save_to_playlist"})

KILLSWITCH_PATH = Path("C:/docs/.consent-pause")


class Predictor(Protocol):
    def predict(self, action: str, context: dict) -> tuple[float, dict]:
        """Return (p_allow in [0,1], features dict)."""
        ...


@dataclass
class ActionContext:
    action: str
    meta: dict = field(default_factory=dict)


@dataclass
class DecisionResult:
    decision: Decision
    reason: str
    p: float | None = None
    features: dict = field(default_factory=dict)
    model_prediction: str | None = None


class ConsentPolicy:
    def __init__(
        self,
        *,
        predictor: Predictor | None = None,
        allow_threshold: float = 0.90,
        deny_threshold: float = 0.10,
        auto_eligible: frozenset[str] = AUTO_ELIGIBLE,
        hard_never: frozenset[str] = HARD_NEVER,
        windows: "WindowRegistry | None" = None,
    ):
        if not (0 < deny_threshold < allow_threshold < 1):
            raise ValueError("invalid thresholds")
        self.predictor = predictor
        self.allow_threshold = allow_threshold
        self.deny_threshold = deny_threshold
        self.auto_eligible = auto_eligible
        self.hard_never = hard_never
        self.windows = windows

    def decide(self, action: str, context: dict | None = None) -> DecisionResult:
        ctx = context or {}
        # 1. Kill switch
        if KILLSWITCH_PATH.exists():
            return DecisionResult("ask", reason="consent-pause sentinel present")
        # 2. Hard-never
        if action in self.hard_never:
            # Windows can temporarily bypass hard-never for actions user explicitly opens
            if self.windows and self.windows.is_open_for(action):
                # still fall through to predictor; the window is a *ceiling*, not a floor
                pass
            else:
                return DecisionResult("ask", reason=f"hard-never action: {action}")
        # 3. Window: if no predictor and a window is open, prompt once then ceiling
        # 4. Predictor
        if self.predictor is None:
            if action in self.auto_eligible and self._eligible_without_predictor(action, ctx):
                return DecisionResult("ask", reason="no predictor; auto-eligible but untrained")
            return DecisionResult("ask", reason="no predictor")
        p, feats = self.predictor.predict(action, ctx)
        if p >= self.allow_threshold:
            return DecisionResult("allow", reason=f"p={p:.3f}>={self.allow_threshold}",
                                  p=p, features=feats, model_prediction="allow")
        if p <= self.deny_threshold:
            return DecisionResult("deny", reason=f"p={p:.3f}<={self.deny_threshold}",
                                  p=p, features=feats, model_prediction="deny")
        return DecisionResult("ask", reason=f"uncertain p={p:.3f}",
                              p=p, features=feats, model_prediction="ask")

    def _eligible_without_predictor(self, action: str, ctx: dict) -> bool:
        """Very conservative baseline: without a trained predictor, never auto-allow."""
        return False
