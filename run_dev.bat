@echo off
REM Poshan-Suraksha Development Runner for Windows
echo ==========================================================
echo   Starting Poshan-Suraksha Platform (Techfest IIT Bombay)
echo ==========================================================
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
