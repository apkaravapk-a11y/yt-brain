"""Token-aware chunker that keeps chunks under a target word budget with overlap.

We avoid a hard tokenizer dependency by using word count as a stable proxy.
Default budget: ~512 tokens ≈ 380 words (conservative); overlap ≈ 48 words (~64 tokens).
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass(frozen=True)
class Chunk:
    text: str
    start_word_idx: int
    end_word_idx: int
    video_id: str | None = None
    start_sec: float | None = None
    end_sec: float | None = None


def chunk_text(
    text: str,
    *,
    target_words: int = 380,
    overlap_words: int = 48,
    video_id: str | None = None,
) -> list[Chunk]:
    if target_words <= 0:
        raise ValueError("target_words must be > 0")
    if overlap_words < 0 or overlap_words >= target_words:
        raise ValueError("overlap_words must be in [0, target_words)")

    words = text.split()
    if not words:
        return []

    chunks: list[Chunk] = []
    step = target_words - overlap_words
    i = 0
    while i < len(words):
        j = min(i + target_words, len(words))
        chunks.append(Chunk(
            text=" ".join(words[i:j]),
            start_word_idx=i,
            end_word_idx=j,
            video_id=video_id,
        ))
        if j >= len(words):
            break
        i += step
    return chunks


def chunk_transcript_segments(
    segments: list[dict],
    *,
    target_words: int = 380,
    overlap_words: int = 48,
    video_id: str | None = None,
) -> list[Chunk]:
    """Chunk transcript segments while preserving second-offsets for deep-link URLs."""
    if not segments:
        return []
    flat_words: list[tuple[str, float]] = []
    for seg in segments:
        start = float(seg.get("start", 0.0))
        text = (seg.get("text", "") or "").strip()
        for w in text.split():
            flat_words.append((w, start))

    if not flat_words:
        return []

    chunks: list[Chunk] = []
    step = target_words - overlap_words
    i = 0
    while i < len(flat_words):
        j = min(i + target_words, len(flat_words))
        words = [w for w, _ in flat_words[i:j]]
        chunks.append(Chunk(
            text=" ".join(words),
            start_word_idx=i,
            end_word_idx=j,
            video_id=video_id,
            start_sec=flat_words[i][1],
            end_sec=flat_words[j - 1][1],
        ))
        if j >= len(flat_words):
            break
        i += step
    return chunks
