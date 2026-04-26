' yt-brain Ω++ launcher — silent boot, no console flash.
' Double-clicking the .lnk that points here will:
'   1. spawn powershell to run start.ps1 minimized + windowless
'   2. immediately return — no terminal flash on screen
' Logs land at C:\projects\yt-brain-launcher\logs\

Set sh = CreateObject("WScript.Shell")
script = "C:\projects\yt-brain-launcher\start.ps1"
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & script & """"
' 0 = hidden, False = don't wait
sh.Run cmd, 0, False
