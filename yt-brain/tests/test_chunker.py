from yt_brain.enrichment.chunker import chunk_text, chunk_transcript_segments


def test_chunk_text_empty():
    assert chunk_text("") == []


def test_chunk_text_respects_target_and_overlap():
    words = " ".join(f"w{i}" for i in range(1000))
    chunks = chunk_text(words, target_words=100, overlap_words=20)
    assert len(chunks) >= 10
    for i in range(len(chunks) - 1):
        # last 20 words of chunk i overlap first 20 words of chunk i+1
        a = chunks[i].text.split()
        b = chunks[i + 1].text.split()
        assert a[-20:] == b[:20], f"overlap mismatch at {i}"


def test_chunk_text_validates_overlap():
    import pytest
    with pytest.raises(ValueError):
        chunk_text("a b c", target_words=10, overlap_words=10)


def test_chunk_transcript_segments_preserves_timestamps():
    segs = [{"start": 0.0, "text": "hello world"}, {"start": 5.0, "text": "second segment here"}]
    chunks = chunk_transcript_segments(segs, target_words=3, overlap_words=1)
    assert chunks[0].start_sec == 0.0
    assert chunks[-1].end_sec == 5.0
