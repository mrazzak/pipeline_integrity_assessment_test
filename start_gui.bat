@echo off
setlocal
set "ROOT=%~dp0"
set "PYTHON_EXE=C:\Users\razza\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
set "PYTHONPATH=%ROOT%src"
start "CEPA Crossing GUI Server" /min "%PYTHON_EXE%" -m cepa_crossing.gui_server
timeout /t 1 /nobreak >nul
start "" http://127.0.0.1:8765/
