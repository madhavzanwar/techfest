#!/usr/bin/env bash
# Poshan-Suraksha Development Runner for Linux / macOS
set -e

echo "=========================================================="
echo "  Starting Poshan-Suraksha Platform (Techfest IIT Bombay)"
echo "=========================================================="

python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
