"""ExtractSchema — the JSON contract between extract → propose → apply."""
from __future__ import annotations
from pydantic import BaseModel, Field


class Technique(BaseModel):
    name: str
    description: str
    evidence_quote: str = ""
    confidence: float = Field(ge=0.0, le=1.0)


class Library(BaseModel):
    name: str
    version: str | None = None
    purpose: str = ""


class Snippet(BaseModel):
    language: str
    code: str
    reconstructed: bool = Field(default=True,
        description="True if reconstructed from speech, False if transcribed verbatim from screen")


class ExtractResult(BaseModel):
    video_id: str
    title: str = ""
    model_used: str = ""
    techniques: list[Technique] = Field(default_factory=list)
    libraries: list[Library] = Field(default_factory=list)
    snippets: list[Snippet] = Field(default_factory=list)
    overall_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    warnings: list[str] = Field(default_factory=list)
