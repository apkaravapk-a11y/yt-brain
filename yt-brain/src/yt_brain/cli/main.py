"""yt-brain CLI — Click-based entry point."""
from __future__ import annotations
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import click

from ..storage.db import Repo
from ..services import sync as sync_svc
from ..services import search as search_svc
from ..services.notify import default_hub, Event
from ..consent.policy import ConsentPolicy, HARD_NEVER
from ..consent.predictor import HeuristicPredictor
from ..consent.windows import WindowRegistry
from ..modes.router import current_mode, set_mode, MODES

DEFAULT_DB = Path.home() / ".yt-brain" / "yt_brain.sqlite"
RESULTS_LOG = Path("C:/docs/results.md")


def _log(entry: dict):
    RESULTS_LOG.parent.mkdir(parents=True, exist_ok=True)
    line = f"- [{datetime.utcnow().isoformat()}Z] yt-brain {json.dumps(entry)}"
    with RESULTS_LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


@click.group()
@click.option("--db", type=click.Path(), default=str(DEFAULT_DB), show_default=True)
@click.pass_context
def cli(ctx: click.Context, db: str):
    """yt-brain — YouTube-native AI."""
    ctx.ensure_object(dict)
    ctx.obj["db"] = Path(db)


@cli.command()
@click.pass_context
def status(ctx):
    """Show current state: db size, video count, current mode, sentinels."""
    db_path = ctx.obj["db"]
    if not db_path.exists():
        click.echo(f"db: not yet initialized at {db_path}")
        return
    repo = Repo(db_path)
    mode = current_mode()
    sentinels = {
        name: Path(p).exists()
        for name, p in [
            ("brainstorm-off", "C:/docs/.brainstorm-off"),
            ("consent-pause", "C:/docs/.consent-pause"),
            ("browser-halt",  "C:/docs/.browser-halt"),
            ("notify-off",    "C:/docs/.notify-off"),
            ("halt-all",      "C:/docs/.halt-all"),
            ("thermal-pause", "C:/docs/.thermal-pause"),
        ]
    }
    click.echo(json.dumps({
        "db_path": str(db_path),
        "video_count": repo.count_videos(),
        "mode": mode.name,
        "mode_persona": mode.persona_hint,
        "sentinels": sentinels,
    }, indent=2))


@cli.command("ingest-takeout")
@click.argument("archive", type=click.Path(exists=True))
@click.pass_context
def ingest_takeout_cmd(ctx, archive):
    """Ingest a Google Takeout zip or extracted folder."""
    repo = Repo(ctx.obj["db"])
    inserted, skipped = sync_svc.ingest_takeout(repo, archive)
    _log({"cmd": "ingest-takeout", "archive": archive, "inserted": inserted, "skipped": skipped})
    click.echo(f"ingest-takeout: inserted/updated={inserted} skipped={skipped}")


@cli.command()
@click.argument("query")
@click.option("--limit", default=20, show_default=True)
@click.pass_context
def search(ctx, query, limit):
    """Search titles + channel names. (Vector search plugs in Phase 6.)"""
    repo = Repo(ctx.obj["db"])
    hits = search_svc.search_titles(repo, query, limit=limit)
    _log({"cmd": "search", "query": query, "hits": len(hits)})
    for h in hits:
        click.echo(f"{h['video_id']}  {h['title'][:60]:60}  {h['channel_name']}")


@cli.group()
def consent():
    """Π — consent engine."""


@consent.command("status")
def consent_status():
    policy = ConsentPolicy(predictor=HeuristicPredictor(), windows=WindowRegistry())
    click.echo(json.dumps({
        "hard_never_count": len(HARD_NEVER),
        "allow_threshold": policy.allow_threshold,
        "deny_threshold": policy.deny_threshold,
    }, indent=2))


@consent.command("decide")
@click.argument("action")
def consent_decide(action):
    policy = ConsentPolicy(predictor=HeuristicPredictor(), windows=WindowRegistry())
    r = policy.decide(action)
    click.echo(json.dumps({
        "decision": r.decision, "reason": r.reason, "p": r.p,
    }, indent=2))


@cli.command()
@click.argument("name", required=False)
def mode(name):
    """Show or set the current mode (jarvis/minority/ops/samantha/mentat/scholar)."""
    if name:
        m = set_mode(name)
        click.echo(f"mode -> {m.name} ({m.persona_hint})")
    else:
        m = current_mode()
        click.echo(f"current mode: {m.name} ({m.persona_hint})")
        click.echo(f"available: {', '.join(MODES)}")


@cli.command("notify-test")
@click.option("--title", default="yt-brain")
@click.option("--body", default="hello from Ω++")
def notify_test(title, body):
    hub = default_hub()
    results = hub.push(Event(kind="info", title=title, body=body))
    click.echo(json.dumps(results, indent=2))


if __name__ == "__main__":
    cli(obj={})
