"""
Unified Cross-Platform Runner for Poshan-Suraksha Platform.
Starts the FastAPI backend and provides quick access to the system.
Works seamlessly on Windows, macOS, and Linux.
"""
import sys
import os
import subprocess
import webbrowser
import time

def main():
    print("=" * 60)
    print("  POSHAN-SURAKSHA: Nutrition Early-Warning & Decision-Support")
    print("  Techfest, IIT Bombay (2026-27) — The India @ 71/100 Challenge")
    print("=" * 60)
    print("[*] Starting backend server (FastAPI + Uvicorn) on http://127.0.0.1:8000 ...")
    print("[*] Dashboard UI will be available directly at: http://127.0.0.1:8000")
    print("[*] Interactive Swagger API Docs at: http://127.0.0.1:8000/docs")
    print("[*] Press Ctrl+C to stop.")
    print("=" * 60)
    
    import uvicorn
    from backend.app.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    main()
