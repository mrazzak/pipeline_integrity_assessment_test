@echo off
setlocal
set "ROOT=%~dp0"
set "PYTHON_EXE=C:\Users\razza\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
set "PYTHONPATH=%ROOT%src"
set "PIPELINE_ASSESSMENT_NO_LOGIN=1"
set "PIPELINE_ASSESSMENT_LOCAL_USER=local-user"
set "PIPELINE_ASSESSMENT_PORT=8766"
start "Pipeline Assessment - No Login" /min "%PYTHON_EXE%" -m cepa_crossing.gui_server
timeout /t 1 /nobreak >nul
start "" http://127.0.0.1:8766/
