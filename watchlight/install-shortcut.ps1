$ErrorActionPreference = "Stop"

$DESKTOP = [Environment]::GetFolderPath("Desktop")
$START   = [Environment]::GetFolderPath("Programs")
# Generate ICO from the existing PNG icons
$icoPath = "C:\projects\watchlight\Watchlight.ico"

function New-Lnk($path, $target, $arguments, $workdir, $icon, $description) {
    $shell = New-Object -ComObject WScript.Shell
    $sc = $shell.CreateShortcut($path)
    $sc.TargetPath = $target
    $sc.Arguments  = $arguments
    $sc.WorkingDirectory = $workdir
    $sc.IconLocation = $icon
    $sc.Description  = $description
    $sc.WindowStyle  = 1
    $sc.Save()
}

# Locate Chrome / Edge for --app=URL mode
$chromeCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$browser = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw "No Chrome or Edge found for app-mode shortcut." }

$URL = "https://watchlight.vercel.app"
$args = "--app=$URL --window-size=1400,900 --user-data-dir=`"$env:LOCALAPPDATA\Watchlight\BrowserProfile`""

# Use the SVG favicon converted via the PNG (Windows .lnk accepts PNG via icon path with index)
$iconArg = if (Test-Path $icoPath) { $icoPath } else { "C:\projects\watchlight\public\icon-192.png" }

New-Lnk `
    -path "$DESKTOP\Watchlight.lnk" `
    -target $browser `
    -arguments $args `
    -workdir "C:\projects\watchlight" `
    -icon $iconArg `
    -description "Watchlight — your YouTube, with a brain"

New-Lnk `
    -path "$START\Watchlight.lnk" `
    -target $browser `
    -arguments $args `
    -workdir "C:\projects\watchlight" `
    -icon $iconArg `
    -description "Watchlight"

# Remove any leftover yt-brain shortcuts (defensive)
Remove-Item "$DESKTOP\yt-brain*.lnk" -ErrorAction SilentlyContinue
Remove-Item "$START\yt-brain*.lnk"   -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  Installed:" -ForegroundColor Green
Write-Host "    Desktop\Watchlight.lnk    (single click → opens app-mode window)" -ForegroundColor White
Write-Host "    Start Menu\Watchlight.lnk (Win-key → type 'watchlight')" -ForegroundColor White
Write-Host ""
Write-Host "  Browser used: $browser" -ForegroundColor DarkGray
Write-Host "  URL:          $URL" -ForegroundColor DarkGray
Write-Host ""
