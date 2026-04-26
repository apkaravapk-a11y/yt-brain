# yt-brain Ω++ — system tray app (no install, ships with Windows)
# Right-click menu: Open / Restart / Stop / Logs / Quit tray
# Single-click the icon: opens the UI in your browser.

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Continue"

$LAUNCH_DIR = "C:\projects\yt-brain-launcher"
$ICON_PATH  = "$LAUNCH_DIR\yt-brain.ico"
$START_VBS  = "$LAUNCH_DIR\yt-brain.vbs"
$STOP_BAT   = "$LAUNCH_DIR\yt-brain-stop.bat"
$LOG_DIR    = "$LAUNCH_DIR\logs"
$UI_URL     = "http://127.0.0.1:5173/"
$HEALTH_URL = "http://127.0.0.1:11811/api/health"

function Test-Health {
    try {
        $r = Invoke-WebRequest -Uri $HEALTH_URL -UseBasicParsing -TimeoutSec 1
        return $r.StatusCode -eq 200
    } catch { return $false }
}

# Icon
$icon = New-Object System.Drawing.Icon($ICON_PATH)

# Tray
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = $icon
$tray.Text = "yt-brain Ω++"
$tray.Visible = $true

# Single-click → open the UI
$tray.add_Click({
    if ($_.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        Start-Process $UI_URL
    }
})

# Build menu
$menu = New-Object System.Windows.Forms.ContextMenuStrip

$miOpen = $menu.Items.Add("Open yt-brain")
$miOpen.Image = $null
$miOpen.add_Click({ Start-Process $UI_URL })

$menu.Items.Add("-") | Out-Null

$miStart = $menu.Items.Add("Start everything")
$miStart.add_Click({ Start-Process "wscript.exe" -ArgumentList "`"$START_VBS`"" })

$miRestart = $menu.Items.Add("Restart")
$miRestart.add_Click({
    Start-Process -FilePath $STOP_BAT -WindowStyle Hidden -Wait
    Start-Sleep -Seconds 1
    Start-Process "wscript.exe" -ArgumentList "`"$START_VBS`""
})

$miStop = $menu.Items.Add("Stop everything")
$miStop.add_Click({ Start-Process -FilePath $STOP_BAT -WindowStyle Hidden })

$menu.Items.Add("-") | Out-Null

$miLogs = $menu.Items.Add("Open logs folder")
$miLogs.add_Click({ Start-Process explorer.exe -ArgumentList $LOG_DIR })

$miStatus = $menu.Items.Add("Check status")
$miStatus.add_Click({
    $up = Test-Health
    $msg = if ($up) { "yt-brain backend is UP at $HEALTH_URL" } else { "yt-brain backend is DOWN — click Start everything" }
    [System.Windows.Forms.MessageBox]::Show($msg, "yt-brain status") | Out-Null
})

$menu.Items.Add("-") | Out-Null

$miQuit = $menu.Items.Add("Quit tray (services keep running)")
$miQuit.add_Click({
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$tray.ContextMenuStrip = $menu

# Periodic status update — change icon tooltip every 10s
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 10000
$timer.add_Tick({
    $tray.Text = if (Test-Health) { "yt-brain Ω++ — running" } else { "yt-brain Ω++ — stopped" }
})
$timer.Start()

# Show a balloon on first launch
$tray.BalloonTipIcon  = [System.Windows.Forms.ToolTipIcon]::Info
$tray.BalloonTipTitle = "yt-brain Ω++"
$tray.BalloonTipText  = "Tray app running. Click the icon to open. Right-click for menu."
$tray.ShowBalloonTip(3000)

# Pump the message loop
[System.Windows.Forms.Application]::Run()
