# yt-brain Ω++ launcher

One-click app-style launcher for the whole yt-brain stack.

## What it does

Double-click **`yt-brain`** on your Desktop and:

1. Health-checks Ollama; starts it if down.
2. **First run only:** pulls `nomic-embed-text` (~274 MB) in the background so the UI stays responsive.
3. Boots the FastAPI backend on `127.0.0.1:11811`.
4. Boots the yt-ai router on `127.0.0.1:11435`.
5. Boots the React/Vite UI on `127.0.0.1:5173`.
6. Waits for all three to be healthy, then opens your browser.
7. **First run only:** opens `chrome://extensions` so you can load-unpacked the
   yt-brain extension once.
8. **First run only:** kicks off Playwright + Chromium install in the background
   so the Live Co-Pilot can drive a real browser later.

All processes are tracked by PID in `state/pids.json`. Output streams land in
`logs/`. Click **`yt-brain stop`** on your Desktop to kill everything cleanly.

## Files

| File | Purpose |
|---|---|
| `yt-brain.vbs` | Silent launcher — VBScript so there's no console flash on double-click |
| `yt-brain.bat` | Visible-console launcher — same thing but you see the boot log |
| `yt-brain-stop.bat` | Clean shutdown |
| `start.ps1` | The actual boot script |
| `stop.ps1` | The actual shutdown script |
| `install-shortcut.ps1` | Creates the Desktop + Start Menu `.lnk` shortcuts with the custom icon |
| `yt-brain.ico` | Multi-resolution app icon (16/32/48/64/128/256) |
| `state/` | First-run flags + tracked PIDs (gitignored) |
| `logs/` | Per-service stdout + stderr (gitignored) |

## Install / re-install shortcuts

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File install-shortcut.ps1
```

Idempotent. Re-run any time after editing the icon.

## URLs once it's up

- UI: <http://127.0.0.1:5173/>
- Backend API: <http://127.0.0.1:11811/api/status>
- yt-ai router: <http://127.0.0.1:11435/v1/status>

## Kill switches still work

Even when the launcher is running, the global sentinels still apply:

```powershell
echo x > C:/docs/.consent-pause   # forces Π to ask-everything
echo x > C:/docs/.browser-halt    # refuses to start Λ
echo x > C:/docs/.notify-off      # suppresses pushes
```
