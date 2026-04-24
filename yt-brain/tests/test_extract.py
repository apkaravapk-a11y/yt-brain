from yt_brain.extract.extractor import extract


def _fake_chat(valid: bool = True):
    if valid:
        content = """
        Here is the extract:
        {
          "techniques": [
            {"name": "Hybrid retrieval", "description": "BM25 + dense combined",
             "evidence_quote": "we combine BM25 with a dense retriever", "confidence": 0.82}
          ],
          "libraries": [{"name": "llama-index", "version": null, "purpose": "RAG toolkit"}],
          "snippets": [{"language": "python", "code": "index = VectorStoreIndex.from_documents(docs)", "reconstructed": true}],
          "overall_confidence": 0.78,
          "warnings": []
        }
        Thanks!
        """
    else:
        content = "I don't know."
    def _fn(messages):
        return {"content": content, "model": "stub"}
    return _fn


def test_extract_valid_json_from_messy_output():
    res = extract(
        video_id="v1", title="Retrieval Explained", transcript="... transcript ...",
        chat_callable=_fake_chat(valid=True),
    )
    assert res.video_id == "v1"
    assert len(res.techniques) == 1
    assert res.techniques[0].name == "Hybrid retrieval"
    assert res.libraries[0].name == "llama-index"
    assert res.overall_confidence == 0.78
    assert res.warnings == []


def test_extract_no_json_yields_warning():
    res = extract(
        video_id="v2", title="X", transcript="...", chat_callable=_fake_chat(valid=False),
    )
    assert res.video_id == "v2"
    assert res.techniques == []
    assert any("no JSON object" in w for w in res.warnings)


def test_extract_no_callable_returns_empty_with_warning():
    res = extract(video_id="v3", title="Y", transcript="...")
    assert res.warnings[0].startswith("no chat_callable")
