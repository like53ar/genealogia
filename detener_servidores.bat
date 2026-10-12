@echo off
echo Deteniendo servidores de Arbol Genealogico (puertos 8001 y 4600)...
powershell -Command "Get-NetTCPConnection -LocalPort 8001, 4600 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue"
echo Servidores detenidos correctamente.
