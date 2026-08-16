# Script para iniciar backend y frontend en segundo plano y abrir el navegador
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# 1. Iniciar Backend (FastAPI + Uvicorn) en puerto 8000
$backendConn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if (-not $backendConn) {
    $backendBat = Join-Path $ScriptDir "iniciar_backend.bat"
    Start-Process -FilePath $backendBat -WindowStyle Hidden
}

# 2. Iniciar Frontend (Angular) en puerto 4600
$frontendConn = Get-NetTCPConnection -LocalPort 4600 -ErrorAction SilentlyContinue
if (-not $frontendConn) {
    $frontendBat = Join-Path $ScriptDir "iniciar_frontend.bat"
    Start-Process -FilePath $frontendBat -WindowStyle Hidden
}

# 3. Esperar hasta que el frontend (puerto 4600) esté escuchando (máximo 60 segundos)
$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    $ready = Get-NetTCPConnection -LocalPort 4600 -State Listen -ErrorAction SilentlyContinue
    if ($ready) {
        break
    }
}

# 4. Abrir navegador web con la aplicación
Start-Process "http://localhost:4600"
