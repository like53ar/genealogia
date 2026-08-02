$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ProjectDir = "C:\Users\fabar\OneDrive\Escritorio\Genealogia"

$NameStart = [char]0xC1 + "rbol Geneal" + [char]0xF3 + "gico.lnk"
$NameStop = "Detener " + [char]0xC1 + "rbol Geneal" + [char]0xF3 + "gico.lnk"

# 1. Acceso Directo de Inicio Silencioso
$VbsPath = Join-Path $ProjectDir "iniciar_servidores_silencioso.vbs"
$IconPath = Join-Path $ProjectDir "frontend\public\favicon.ico"

$WScriptShell = New-Object -ComObject WScript.Shell
$ShortcutPath = Join-Path $DesktopPath $NameStart
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$VbsPath`""
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description = "Iniciar servidores de Árbol Genealógico en segundo plano"
$Shortcut.IconLocation = "$IconPath, 0"
$Shortcut.Save()

Write-Host "Acceso directo creado: $ShortcutPath"

# 2. Acceso Directo para Detener Servidores
$VbsStopPath = Join-Path $ProjectDir "detener_servidores_silencioso.vbs"
$ShortcutStopPath = Join-Path $DesktopPath $NameStop
$ShortcutStop = $WScriptShell.CreateShortcut($ShortcutStopPath)
$ShortcutStop.TargetPath = "wscript.exe"
$ShortcutStop.Arguments = "`"$VbsStopPath`""
$ShortcutStop.WorkingDirectory = $ProjectDir
$ShortcutStop.Description = "Detener servidores de Árbol Genealógico"
$ShortcutStop.IconLocation = "%SystemRoot%\System32\shell32.dll, 27"
$ShortcutStop.Save()

Write-Host "Acceso directo para detener creado: $ShortcutStopPath"
