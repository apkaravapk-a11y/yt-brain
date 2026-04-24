"""CLI dispatcher — `python -m yt_brain.control.dispatch <capability> [args...]`."""
from __future__ import annotations
import json
import sys

from .registry import default


def main(argv: list[str] | None = None):
    argv = argv if argv is not None else sys.argv[1:]
    reg = default()
    if not argv or argv[0] in ("-h", "--help", "list"):
        print(json.dumps(reg.list(), indent=2))
        return 0
    name = argv[0]
    kv: dict[str, str | int] = {}
    for a in argv[1:]:
        if "=" not in a:
            continue
        k, v = a.split("=", 1)
        try:
            kv[k] = int(v)
        except ValueError:
            kv[k] = v
    try:
        cap = reg.get(name)
        out = cap.fn(**kv)
        print(json.dumps(out, default=str, indent=2))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
