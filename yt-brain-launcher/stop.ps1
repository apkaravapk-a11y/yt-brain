# yt-brain Ω++ — stop everything (safe: kills the entire process tree)
$STATE_DIR = "C:\projects\yt-brain-launcher\state"
$PIDS_FILE = "$STATE_DIR\pids.json"

Write-Host ""
Write-Host "  yt-brain Ω++ — stopping…" -ForegroundColor Yellow
Write-Host ""

function Get-Descendants($parentPid, [hashtable]$seen) {
    if ($seen.ContainsKey($parentPid)) { return @() }
    $seen[$parentPid] = $true
    $result = @($parentPid)
    $kids = Get-CimInstance Win32_Process -Filter "ParentProcessId=$parentPid" -ErrorAction SilentlyContinue
    foreach ($k in $kids) {
        $result += Get-Descendants $k.ProcessId $seen
    }
    return $result
}

# 1. Stop everything tracked in pids.json (each value may be int or int[])
$killed = @{}
if (Test-Path $PIDS_FILE) {
    $pids = Get-Content $PIDS_FILE | ConvertFrom-Json
    foreach ($name in $pids.PSObject.Properties.Name) {
        $val = $pids.$name
        $procIds = if ($val -is [array]) { $val } else { @($val) }
        foreach ($procId in $procIds) {
            $seen = @{}
            $tree = Get-Descendants $procId $seen
            foreach ($t in $tree) {
                if ($killed.ContainsKey($t)) { continue }
                try {
                    Stop-Process -Id $t -Force -ErrorAction SilentlyContinue
                    $killed[$t] = $name
                } catch {}
            }
        }
        Write-Host "  ✓ stopped $name (tree: $($tree -join ', '))" -ForegroundColor DarkGray
    }
    Remove-Item $PIDS_FILE -Force -ErrorAction SilentlyContinue
}

# 2. Belt + suspenders — kill anything still bound to our ports.
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

# 3. Vacuum: any straggling node/python whose command-line says it belongs to us.
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -in @("node.exe", "python.exe") -and
    $_.CommandLine -and (
        $_.CommandLine -like "*yt_brain*" -or
        $_.CommandLine -like "*yt_ai*" -or
        $_.CommandLine -like "*yt-brain-ui*"
    )
} | ForEach-Object {
    try {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ vacuumed straggler pid $($_.ProcessId) ($($_.Name))" -ForegroundColor DarkGray
    } catch {}
}

Write-Host ""
Write-Host "  Done." -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 1
