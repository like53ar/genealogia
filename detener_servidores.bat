@echo off
echo Deteniendo servidores de Arbol Genealogico (puertos 8000 y 4600)...
powershell -Command "Get-NetTCPConnection -LocalPort 8000, 4600 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force -ErrorAction SilentlyContinue"
echo Servidores detenidos correctamente.
