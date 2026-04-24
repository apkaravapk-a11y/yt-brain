<!--
prompt: Tachikoma swarm — per-agent journals + nightly dreamwalk.
updated: 2026-04-22
writer: Phase 9 scaffold / yt-brain Ω++
-->

# Swarm

Every headless agent (Ψ harvester, extract batch, LoRA trainer, propose worker, etc.)
owns an append-only journal at `journals/<tachi-id>.jsonl`.

Nightly `swarm.dreamwalk` (to be scheduled in Phase 4) reads every journal,
extracts patterns, and writes `swarm_memory.md` — which all agents read at boot.

## Shape of a journal line

```json
{"ts":"2026-04-22T05:00:00Z","actor":"tachi-psi-home-1","event":"harvest.home","surface":"psi_home","videos":20,"errors":[]}
```

## interrogate

`python -m yt_brain.swarm.interrogate <tachi-id> <question>` — ask an agent about its own decisions. Uses its journal as context for a chat call to yt-ai.
