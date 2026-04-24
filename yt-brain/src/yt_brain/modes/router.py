"""Mode router — one active at a time. Influences persona, notify verbosity,
Π thresholds, visual theme, default tool routing.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

ModeName = Literal["jarvis", "minority", "ops", "samantha", "mentat", "scholar"]
MODES: tuple[ModeName, ...] = ("jarvis", "minority", "ops", "samantha", "mentat", "scholar")

CURRENT_MODE_FILE = Path("C:/docs/.current-mode")
DEFAULT_MODE: ModeName = "jarvis"


@dataclass(frozen=True)
class ModeConfig:
    name: ModeName
    persona_hint: str
    notify_verbosity: Literal["silent", "terse", "normal", "proactive"]
    consent_allow_threshold: float
    consent_deny_threshold: float
    visual_theme: str
    voice_on: bool
    mentat_lock: bool            # refuse generative responses, only transcript citations
    sci_fi_refs: tuple[int, ...]


MODE_TABLE: dict[ModeName, ModeConfig] = {
    "jarvis": ModeConfig(
        name="jarvis", persona_hint="ambient second-brain, proactive, witty-dry",
        notify_verbosity="proactive",
        consent_allow_threshold=0.90, consent_deny_threshold=0.10,
        visual_theme="hud-minimal", voice_on=True, mentat_lock=False,
        sci_fi_refs=(1, 5, 8, 18),
    ),
    "minority": ModeConfig(
        name="minority", persona_hint="spatial navigator, gesture-first",
        notify_verbosity="terse",
        consent_allow_threshold=0.92, consent_deny_threshold=0.08,
        visual_theme="galaxy-fullscreen", voice_on=False, mentat_lock=False,
        sci_fi_refs=(2, 10, 22),
    ),
    "ops": ModeConfig(
        name="ops", persona_hint="mission control, dense dashboards, no chatter",
        notify_verbosity="silent",
        consent_allow_threshold=0.95, consent_deny_threshold=0.05,
        visual_theme="lcars", voice_on=False, mentat_lock=False,
        sci_fi_refs=(3, 15, 19),
    ),
    "samantha": ModeConfig(
        name="samantha", persona_hint="warm voice companion, relational, phone-first",
        notify_verbosity="normal",
        consent_allow_threshold=0.90, consent_deny_threshold=0.10,
        visual_theme="phone-widget", voice_on=True, mentat_lock=False,
        sci_fi_refs=(4, 7, 13),
    ),
    "mentat": ModeConfig(
        name="mentat", persona_hint="accuracy-first, citations-only, no synthesis",
        notify_verbosity="terse",
        consent_allow_threshold=0.98, consent_deny_threshold=0.02,
        visual_theme="text-dense", voice_on=False, mentat_lock=True,
        sci_fi_refs=(17, 20),
    ),
    "scholar": ModeConfig(
        name="scholar", persona_hint="cross-referenced lectures, long-horizon",
        notify_verbosity="normal",
        consent_allow_threshold=0.90, consent_deny_threshold=0.10,
        visual_theme="reading", voice_on=False, mentat_lock=False,
        sci_fi_refs=(12, 16, 21),
    ),
}


def current_mode() -> ModeConfig:
    try:
        name = CURRENT_MODE_FILE.read_text(encoding="utf-8").strip().lower()
    except FileNotFoundError:
        name = DEFAULT_MODE
    if name not in MODE_TABLE:
        name = DEFAULT_MODE
    return MODE_TABLE[name]  # type: ignore[index]


def set_mode(name: str) -> ModeConfig:
    n = name.strip().lower()
    if n not in MODE_TABLE:
        raise ValueError(f"unknown mode: {name}. valid: {', '.join(MODES)}")
    CURRENT_MODE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CURRENT_MODE_FILE.write_text(n, encoding="utf-8")
    return MODE_TABLE[n]  # type: ignore[index]
