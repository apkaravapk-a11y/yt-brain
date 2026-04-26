# Creates "yt-brain" and "yt-brain stop" shortcuts on the Desktop with the
# custom icon. Idempotent — overwrites if they already exist.

$ErrorActionPreference = "Stop"

$LAUNCH_DIR = "C:\projects\yt-brain-launcher"
$ICON       = "$LAUNCH_DIR\yt-brain.ico"
$DESKTOP    = [Environment]::GetFolderPath("Desktop")

function New-Lnk($path, $target, $arguments, $workdir, $icon, $description) {
    $shell = New-Object -ComObject WScript.Shell
    $sc = $shell.CreateShortcut($path)
    $sc.TargetPath = $target
    $sc.Arguments  = $arguments
    $sc.WorkingDirectory = $workdir
    $sc.IconLocation = $icon
    $sc.Description  = $description
    $sc.WindowStyle  = 7   # 7 = minimized
    $sc.Save()
}

# Main launcher: silent VBS → no console flash, just app-style boot.
New-Lnk `
    -path "$DESKTOP\yt-brain.lnk" `
    -target "wscript.exe" `
    -arguments "`"$LAUNCH_DIR\yt-brain.vbs`"" `
    -workdir $LAUNCH_DIR `
    -icon $ICON `
    -description "yt-brain Ω++ — single click to launch everything"

# Stop shortcut for when you want to kill it.
New-Lnk `
    -path "$DESKTOP\yt-brain stop.lnk" `
    -target "$LAUNCH_DIR\yt-brain-stop.bat" `
    -arguments "" `
    -workdir $LAUNCH_DIR `
    -icon $ICON `
    -description "yt-brain Ω++ — stop all services"

# Tray app — lives in the system tray, right-click for menu.
New-Lnk `
    -path "$DESKTOP\yt-brain tray.lnk" `
    -target "wscript.exe" `
    -arguments "`"$LAUNCH_DIR\tray.vbs`"" `
    -workdir $LAUNCH_DIR `
    -icon $ICON `
    -description "yt-brain Ω++ — system tray app (right-click for menu)"

# Also drop both into the Start Menu so Win-key search finds them.
$START = [Environment]::GetFolderPath("Programs")
New-Lnk `
    -path "$START\yt-brain.lnk" `
    -target "wscript.exe" `
    -arguments "`"$LAUNCH_DIR\yt-brain.vbs`"" `
    -workdir $LAUNCH_DIR `
    -icon $ICON `
    -description "yt-brain Ω++"

Write-Host ""
Write-Host "  ✓ shortcuts installed:" -ForegroundColor Green
Write-Host "    Desktop\yt-brain.lnk        (one click to launch)" -ForegroundColor White
Write-Host "    Desktop\yt-brain stop.lnk   (one click to stop)" -ForegroundColor White
Write-Host "    Start Menu\yt-brain.lnk     (Win-key search 'yt-brain')" -ForegroundColor White
Write-Host ""
