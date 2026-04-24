"""yt-ai CLI — up/down/status/bench."""
from __future__ import annotations
import json
import subprocess

import click

from .router import Router


@click.group()
def cli():
    """yt-ai — local AI runtime router."""


@cli.command()
def status():
    r = Router()
    click.echo(json.dumps({
        "backends": [b.name for b in r.backends],
        "available": [b.name for b in r.backends if b.available()],
    }, indent=2))


@cli.command()
@click.option("--host", default="127.0.0.1")
@click.option("--port", default=11435, type=int)
def up(host: str, port: int):
    """Start the server in the foreground (Ctrl-C to stop)."""
    subprocess.run(["uvicorn", "yt_ai.server:app", "--host", host, "--port", str(port)])


@cli.command()
@click.option("--prompt", default="Say hi in one short sentence.")
def bench(prompt: str):
    """One-shot chat against the router — reports backend + latency."""
    import time
    r = Router()
    t0 = time.monotonic()
    out = r.chat([{"role": "user", "content": prompt}])
    dt = (time.monotonic() - t0) * 1000.0
    click.echo(json.dumps({"latency_ms": round(dt, 1), **{k: out[k] for k in ("backend", "model", "content")}}, indent=2))


if __name__ == "__main__":
    cli()
