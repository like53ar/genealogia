Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell -Command ""Get-NetTCPConnection -LocalPort 8000, 4600 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue""", 0, True
