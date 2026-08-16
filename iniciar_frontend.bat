@echo off
set PATH=C:\Program Files\nodejs;%PATH%
set CI=true
cd /d "%~dp0frontend"
call node_modules\.bin\ng.cmd serve --port 4600 --no-interactive
