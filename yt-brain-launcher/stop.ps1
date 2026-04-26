# yt-brain Ω++ — stop everything
$STATE_DIR = "C:\projects\yt-brain-launcher\state"
$PIDS_FILE = "$STATE_DIR\pids.json"

Write-Host ""
Write-Host "  yt-brain Ω++ — stopping…" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $PIDS_FILE) {
    $pids = Get-Content $PIDS_FILE | ConvertFrom-Json
    foreach ($name in $pids.PSObject.Properties.Name) {
        $procId = $pids.$name
        try {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ stopped $name (pid $procId)" -ForegroundColor DarkGray
        } catch {
            Write-Host "  ✗ couldn't stop $name (pid $procId)" -ForegroundColor Red
        }
    }
    Remove-Item $PIDS_FILE -Force -ErrorAction SilentlyContinue
}

# Also kill anything still bound to our ports.
foreach ($port in 11811, 11435, 5173) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $procId = $conn.OwningProcess
        try {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ freed port $port (was pid $procId)" -ForegroundColor DarkGray
        } catch {}
    }
}

Write-Host ""
Write-Host "  Done." -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 1
