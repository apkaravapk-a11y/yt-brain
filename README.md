# yt-brain Ω++

YouTube-native AI ecosystem — ingests your watch history, indexes transcripts,
harvests live web surfaces, learns your consent predictively, and runs across
chat / dashboard / ambient / phone as one core with four faces.

**🌐 Live: https://yt-brain-ui.vercel.app**
**📦 Repo: https://github.com/apkaravapk-a11y/yt-brain**

> **Status:** foundation complete. 32/32 tests green. Web app deployed to Vercel.
> Backend API + Chrome extension shipping together. Built on Dell Precision 5560
> (Nvidia T1200 4GB, 64GB RAM, Windows 11, no-USB) with risk tolerance 3/10.

## What's inside

| Package | Language | Purpose |
|---|---|---|
| `yt-brain/` | Python 3.12 | Core: storage · consent Π · modes · services · browser Λ · extract · control plane · REST API · WebSocket |
| `yt-ai/` | Python 3.12 | OpenAI-compatible router over Ollama / Anthropic / stub |
| `yt-brain-ui/` | React 19 + TS + Vite + Tailwind + three.js | 10-page dashboard with real 3D galaxy, WebSocket live stream, 6 persona modes |
| `yt-brain-extension/` | Chrome MV3 | Live-tab observer that posts every YouTube page you visit to the backend |
| `yt-brain-tests/` | Python | Master orchestrator + phase runbooks |
| `swarm/` | Python + JSONL | Tachikoma agent journals + nightly dreamwalk |

## 5-minute local bring-up

```bash
# backend (REST + WebSocket on 127.0.0.1:11811)
cd yt-brain && pip install -e ".[dev]" && cd ../yt-ai && pip install -e ".[dev]"
cd ../yt-brain && python -m uvicorn yt_brain.api.server:app --port 11811

# web app (hot-reload on 127.0.0.1:5173)
cd yt-brain-ui && npm install && npm run dev

# open dashboard
start http://127.0.0.1:5173/

# load Chrome extension (unpacked)
# chrome://extensions → Developer mode → Load unpacked → point to yt-brain-extension/
```

## Full-build run

```bash
# every phase gate
python yt-brain-tests/orchestrator.py
```

Expected: **all 6 phases green** (plans consolidation · brainstorm hook · yt-brain pytest
28/28 · yt-ai pytest 4/4 · control plane dispatch · UI build artifact).

## Design

- **Λ Browser control** — Playwright + persistent Chromium profile (lazy-imports; scaffolds when missing).
- **Ψ Web expansion** — 5 harvesters across YouTube home/trending/history/subs/library with token-bucket rate limiting.
- **Π Predictive consent** — LightGBM (hourly) + LoRA (nightly) dual-loop. Hard-never list in code. `d`-window escape hatch with dry-run preview.
- **Ξ Always-on brainstorming** — UserPromptSubmit hook; sentinel-file off-switch.
- **6 modes × 22 sci-fi refs** — Jarvis / Minority / Ops / Samantha / Mentat / Scholar. Each changes persona, thresholds, theme, routing.
- **Kill-switches** — `C:/docs/.{brainstorm-off,consent-pause,browser-halt,notify-off,thermal-pause,halt-all,plan-autosave-off}`.

Full design: `yt-brain/../docs/superpowers/specs/2026-04-22-yt-brain-omega-plus-final-design.md`.

## Repository layout

```
yt-brain-ecosystem/
├── yt-brain/                    Python · core ingest + consent + modes + API
│   ├── src/yt_brain/
│   │   ├── api/server.py        FastAPI: /api/status, /api/videos, /api/consent/decide, /api/mode, /ws/live
│   │   ├── browser/             Λ driver + harvesters + rate limiter
│   │   ├── consent/             Π policy + predictor + windows
│   │   ├── control/             Capability registry + dispatcher
│   │   ├── enrichment/          Chunker
│   │   ├── extract/             B pipeline — LLM extract with tolerant JSON parser
│   │   ├── modes/               Ω 6-mode router
│   │   ├── services/            sync · search · thermal · notify
│   │   ├── sources/             models + Takeout parser
│   │   └── storage/             SQLite repo
│   └── tests/                   28 tests
├── yt-ai/                       Python · Ollama/Anthropic/Stub router
├── yt-brain-ui/                 React+Vite+TS+Tailwind+three.js dashboard (10 pages)
├── yt-brain-extension/          Chrome MV3 — live YouTube observer
├── yt-brain-tests/              Master orchestrator
└── swarm/                       Tachikoma journals
```

## Deploy

- **Web app (static):** `cd yt-brain-ui && npm run build` → `dist/` → any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
- **Backend:** run locally; not currently deployed (security: Λ operates on a logged-in browser profile).
- **Extension:** load unpacked from `yt-brain-extension/` or zip + upload to Chrome Web Store.

## License

Private — personal build. See repo owner.
