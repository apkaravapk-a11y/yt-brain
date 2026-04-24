from yt_brain.control.registry import default


def test_registry_has_core_caps():
    reg = default()
    names = {c["name"] for c in reg.list()}
    required = {"video.search", "video.ingest_takeout", "video.count",
                "consent.decide", "mode.current", "mode.set", "mode.list"}
    assert required.issubset(names)


def test_registry_dispatch_mode_list():
    reg = default()
    out = reg.get("mode.list").fn()
    assert set(out) == {"jarvis", "minority", "ops", "samantha", "mentat", "scholar"}
