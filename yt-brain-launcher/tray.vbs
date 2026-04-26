' yt-brain tray app — silent boot, no console.
Set sh = CreateObject("WScript.Shell")
script = "C:\projects\yt-brain-launcher\tray.ps1"
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & script & """", 0, False
