# yt-brain Ω++ — single-click launcher
# Boots: Ollama (if down), pulls nomic-embed-text on first run, starts FastAPI
# backend on 11811, yt-ai router on 11435, Vite dev server on 5173, waits for
# health, opens browser, auto-opens chrome://extensions on first run only.
# Ctrl-C in the console = clean shutdown of every child process.

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "yt-brain Ω++"
$ProgressPreference = "SilentlyContinue"

$ROOT       = "C:\projects"
$LAUNCH_DIR = "C:\projects\yt-brain-launcher"
$LOG_DIR    = "$LAUNCH_DIR\logs"
$STATE_DIR  = "$LAUNCH_DIR\state"
$FIRST_RUN  = "$STATE_DIR\first-run-complete"
$PIDS_FILE  = "$STATE_DIR\pids.json"

New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $STATE_DIR | Out-Null

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  yt-brain Ω++  " -ForegroundColor Cyan -NoNewline
    Write-Host "— YouTube-native AI" -ForegroundColor DarkGray
    Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Step($icon, $msg, $color = "White") {
    Write-Host "  $icon " -NoNewline -ForegroundColor $color
    Write-Host $msg -ForegroundColor White
}

function Write-Substep($msg) {
    Write-Host "      $msg" -ForegroundColor DarkGray
}

function Test-Port($port) {
    try {
        $r = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
        return $r
    } catch { return $false }
}

function Test-Http($url, $timeout = 2) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeout
        return $r.StatusCode -eq 200
    } catch { return $false }
}

function Wait-ForHealth($url, $maxSec = 30) {
    $start = Get-Date
    while ((Get-Date) - $start -lt [TimeSpan]::FromSeconds($maxSec)) {
        if (Test-Http $url 1) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

# Find the actual process listening on a port — the source of truth.
# Returns the PID + every descendant PID (so stop.ps1 can kill the whole tree).
# IMPORTANT: builds an in-memory parent→children map with ONE WMI call. The
# previous version did a Get-CimInstance per PID and could hang for minutes
# under AV scanning.
function Get-PortOwners($port) {
    $owners = @()
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $conn) { return @() }

    # One WMI call, build parent→children map.
    $procs = Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId -ErrorAction SilentlyContinue
    $childrenOf = @{}
    foreach ($p in $procs) {
        $parentPid = [int]$p.ParentProcessId
        if (-not $childrenOf.ContainsKey($parentPid)) {
            $childrenOf[$parentPid] = @()
        }
        $childrenOf[$parentPid] += [int]$p.ProcessId
    }

    foreach ($c in $conn) {
        $rootPid = [int]$c.OwningProcess
        if (-not $rootPid) { continue }
        $owners += $rootPid
        $stack = [System.Collections.Generic.Stack[int]]::new()
        $stack.Push($rootPid)
        $seen = @{ $rootPid = $true }
        while ($stack.Count -gt 0) {
            $cur = $stack.Pop()
            if ($childrenOf.ContainsKey($cur)) {
                foreach ($k in $childrenOf[$cur]) {
                    if ($seen.ContainsKey($k)) { continue }
                    $seen[$k] = $true
                    $owners += $k
                    $stack.Push($k)
                }
            }
        }
    }
    return ($owners | Select-Object -Unique)
}

function Save-Pids($pids) {
    ($pids | ConvertTo-Json) | Set-Content -Path $PIDS_FILE -Encoding UTF8
}

function Stop-OnExit {
    Write-Host ""
    Write-Host "  Shutting down…" -ForegroundColor Yellow
    if (Test-Path $PIDS_FILE) {
        $pids = Get-Content $PIDS_FILE | ConvertFrom-Json
        foreach ($name in $pids.PSObject.Properties.Name) {
            $procId = $pids.$name
            try {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Substep "stopped $name (pid $procId)"
            } catch {}
        }
        Remove-Item $PIDS_FILE -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  Goodbye." -ForegroundColor DarkGray
    Write-Host ""
}

# Trap Ctrl-C / window-close so we shut everything down cleanly.
# Note: TreatControlCAsInput is only valid in an interactive console host;
# wscript.exe / hidden subshells don't have one — skip it gracefully.
try { [Console]::TreatControlCAsInput = $false } catch {}
$cancelHandler = {
    Stop-OnExit
    [Environment]::Exit(0)
}
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cancelHandler | Out-Null

Write-Banner

# ── 1. Ollama ─────────────────────────────────────────────────────────────
Write-Step "▶" "Ollama"
if (Test-Port 11434) {
    Write-Substep "already running on 11434 ✓"
} else {
    Write-Substep "starting ollama serve…"
    $ollamaPath = "C:\Users\apkar\AppData\Local\Programs\Ollama\ollama.exe"
    if (-not (Test-Path $ollamaPath)) {
        Write-Substep "ollama.exe not found — install from https://ollama.com (skipping)"
    } else {
        Start-Process -FilePath $ollamaPath -ArgumentList "serve" -WindowStyle Hidden | Out-Null
        if (Wait-ForHealth "http://127.0.0.1:11434/api/tags" 15) {
            Write-Substep "ready ✓"
        } else {
            Write-Substep "did not respond — continuing without Ollama"
        }
    }
}

# ── 2. First-run model pull (BACKGROUND so the app boots immediately) ───
if (-not (Test-Path $FIRST_RUN)) {
    Write-Step "▶" "First-run model setup"
    if (Test-Port 11434) {
        $ollamaPath = "C:\Users\apkar\AppData\Local\Programs\Ollama\ollama.exe"
        $models = & $ollamaPath list 2>&1
        if ($models -notmatch "nomic-embed-text") {
            Write-Substep "pulling nomic-embed-text (~274 MB) in the background — UI is up while this runs"
            Start-Process -FilePath $ollamaPath `
                -ArgumentList "pull", "nomic-embed-text" `
                -WindowStyle Hidden `
                -RedirectStandardOutput "$LOG_DIR\model-pull.log" `
                -RedirectStandardError  "$LOG_DIR\model-pull.err"
        } else {
            Write-Substep "nomic-embed-text already present ✓"
        }
    }
    "first-run complete: $(Get-Date -Format o)" | Set-Content $FIRST_RUN
}

# Resolve binaries up front (used by every service block).
$venvPython = "C:\Users\apkar\Desktop\projects\claudecode\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) { $venvPython = "python" }
$npmCmd = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path $npmCmd)) { $npmCmd = "npm" }

# Inline boot pattern (no scriptblock indirection — variables resolve correctly).
$pids = @{}

# ── 3. Backend (11811) ──
Write-Step "▶" "yt-brain backend"
if (Test-Port 11811) {
    Write-Substep "already running on 11811 ✓ — adopting"
} else {
    Write-Substep "booting on http://127.0.0.1:11811…"
    Start-Process -FilePath $venvPython `
        -ArgumentList "-m", "uvicorn", "yt_brain.api.server:app", "--host", "127.0.0.1", "--port", "11811" `
        -WorkingDirectory "$ROOT\yt-brain" `
        -WindowStyle Hidden `
        -RedirectStandardOutput "$LOG_DIR\backend.log" `
        -RedirectStandardError  "$LOG_DIR\backend.err" | Out-Null
    if (-not (Wait-ForHealth "http://127.0.0.1:11811/api/health" 30)) {
        Write-Substep "WARN: backend slow — check $LOG_DIR\backend.err"
    }
}
$pids["backend"] = Get-PortOwners 11811
Write-Substep "ready ✓ (tracked pids: $($pids['backend'] -join ', '))"

# ── 4. yt-ai (11435) ──
Write-Step "▶" "yt-ai router"
if (Test-Port 11435) {
    Write-Substep "already running on 11435 ✓ — adopting"
} else {
    Write-Substep "booting on http://127.0.0.1:11435…"
    Start-Process -FilePath $venvPython `
        -ArgumentList "-m", "uvicorn", "yt_ai.server:app", "--host", "127.0.0.1", "--port", "11435" `
        -WorkingDirectory "$ROOT\yt-ai" `
        -WindowStyle Hidden `
        -RedirectStandardOutput "$LOG_DIR\yt-ai.log" `
        -RedirectStandardError  "$LOG_DIR\yt-ai.err" | Out-Null
    if (-not (Wait-ForHealth "http://127.0.0.1:11435/v1/status" 20)) {
        Write-Substep "WARN: yt-ai slow — check $LOG_DIR\yt-ai.err"
    }
}
$pids["yt-ai"] = Get-PortOwners 11435
Write-Substep "ready ✓ (tracked pids: $($pids['yt-ai'] -join ', '))"

# ── 5. UI (5173) ──
Write-Step "▶" "yt-brain UI"
if (Test-Port 5173) {
    Write-Substep "already running on 5173 ✓ — adopting"
} else {
    Write-Substep "booting Vite on http://127.0.0.1:5173…"
    Start-Process -FilePath $npmCmd `
        -ArgumentList "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173" `
        -WorkingDirectory "$ROOT\yt-brain-ui" `
        -WindowStyle Hidden `
        -RedirectStandardOutput "$LOG_DIR\ui.log" `
        -RedirectStandardError  "$LOG_DIR\ui.err" | Out-Null
    if (-not (Wait-ForHealth "http://127.0.0.1:5173/" 30)) {
        Write-Substep "WARN: UI slow — check $LOG_DIR\ui.err"
    }
}
$pids["ui"] = Get-PortOwners 5173
Write-Substep "ready ✓ (tracked pids: $($pids['ui'] -join ', '))"

Save-Pids $pids

# ── 6. Open browser to UI ────────────────────────────────────────────────
Write-Step "▶" "Opening browser"
Start-Process "http://127.0.0.1:5173/" | Out-Null
Write-Substep "http://127.0.0.1:5173/"

# ── 7. Chrome extension first-run helper ─────────────────────────────────
$EXT_FIRST = "$STATE_DIR\extension-loaded"
if (-not (Test-Path $EXT_FIRST)) {
    Write-Step "▶" "Chrome extension"
    Write-Substep "first-run: opening chrome://extensions so you can load unpacked"
    Write-Substep "  pick: $ROOT\yt-brain-extension"
    Start-Process "chrome.exe" -ArgumentList "chrome://extensions/" -ErrorAction SilentlyContinue | Out-Null
    "extension prompt shown: $(Get-Date -Format o)" | Set-Content $EXT_FIRST
}

# ── 8. Optional: Playwright background install for live Λ browser control ──
$PW_FIRST = "$STATE_DIR\playwright-installed"
if (-not (Test-Path $PW_FIRST)) {
    $venvPython = "C:\Users\apkar\Desktop\projects\claudecode\.venv\Scripts\python.exe"
    if (-not (Test-Path $venvPython)) { $venvPython = "python" }
    $null = & $venvPython -c "import playwright" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Step "▶" "Playwright (Λ browser control) — optional, background install"
        Write-Substep "downloading playwright + chromium (~500 MB) so the Live Co-Pilot can drive a real browser"
        Write-Substep "this happens once, in the background; UI is fully usable now"
        Start-Process -FilePath $venvPython `
            -ArgumentList "-m", "pip", "install", "--quiet", "playwright" `
            -WindowStyle Hidden `
            -RedirectStandardOutput "$LOG_DIR\playwright-pip.log" `
            -RedirectStandardError  "$LOG_DIR\playwright-pip.err" `
            -Wait
        Start-Process -FilePath $venvPython `
            -ArgumentList "-m", "playwright", "install", "chromium" `
            -WindowStyle Hidden `
            -RedirectStandardOutput "$LOG_DIR\playwright-chromium.log" `
            -RedirectStandardError  "$LOG_DIR\playwright-chromium.err"
        "playwright install kicked off: $(Get-Date -Format o)" | Set-Content $PW_FIRST
    } else {
        "playwright already installed: $(Get-Date -Format o)" | Set-Content $PW_FIRST
    }
}

Write-Host ""
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Everything is up. Close this window or press Ctrl-C to stop." -ForegroundColor Green
Write-Host ""
Write-Host "    UI       : http://127.0.0.1:5173/" -ForegroundColor White
Write-Host "    Backend  : http://127.0.0.1:11811/api/status" -ForegroundColor DarkGray
Write-Host "    yt-ai    : http://127.0.0.1:11435/v1/status" -ForegroundColor DarkGray
Write-Host "    Logs     : $LOG_DIR" -ForegroundColor DarkGray
Write-Host ""

# Block until user closes — the registered Exiting handler does the cleanup.
try {
    while ($true) {
        Start-Sleep -Seconds 5
        # Any of our pids died? Surface it.
        if (Test-Path $PIDS_FILE) {
            $live = Get-Content $PIDS_FILE | ConvertFrom-Json
            foreach ($n in $live.PSObject.Properties.Name) {
                $procId = $live.$n
                $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if (-not $p) {
                    Write-Host "  ⚠ $n died — see $LOG_DIR\$n.err" -ForegroundColor Yellow
                }
            }
        }
    }
} finally {
    Stop-OnExit
}
