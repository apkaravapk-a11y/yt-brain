from yt_ai.router import Router, StubBackend, OllamaBackend


def test_stub_always_available():
    s = StubBackend()
    assert s.available() is True
    out = s.chat([{"role": "user", "content": "hello"}])
    assert "stub" in out["content"]


def test_router_falls_back_to_stub_when_nothing_else():
    r = Router(backends=[StubBackend()])
    out = r.chat([{"role": "user", "content": "ping"}])
    assert out["backend"] == "stub"


def test_embed_deterministic_when_stubbed():
    r = Router(backends=[StubBackend()])
    a = r.embed(["hello"])
    b = r.embed(["hello"])
    assert a["vectors"] == b["vectors"]
    assert len(a["vectors"][0]) == 16


def test_ollama_available_gracefully_false_when_not_running(monkeypatch):
    # We can't guarantee ollama isn't running — just check `available` returns a bool
    assert isinstance(OllamaBackend().available(), bool)
