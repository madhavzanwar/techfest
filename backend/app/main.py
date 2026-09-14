"""
Main FastAPI Application Entry Point for Poshan-Suraksha Platform.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.routes import router as api_router
from backend.app.data_engine.state import db_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Pre-populate synthetic cohort & triage engine
    print(f"==================================================")
    print(f"Starting {settings.PROJECT_NAME} (v{settings.PROJECT_VERSION})")
    print(f"Focus: {settings.THEME}")
    print(f"Target District: {settings.DISTRICT_NAME}, {settings.STATE_NAME}")
    print(f"==================================================")
    db_store.initialize(count=3500)
    yield
    print("[*] Shutting down Poshan-Suraksha Platform.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Data Governance & Early-Warning Decision-Support System for Maternal & Early Childhood Nutrition.",
    lifespan=lifespan
)

# Enable CORS for local React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API endpoints under /api
app.include_router(api_router, prefix="/api")

# Serve frontend build if dist directory exists
from pathlib import Path
from fastapi.staticfiles import StaticFiles

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "platform": settings.PROJECT_NAME,
            "competition": "Techfest, IIT Bombay (2026-27) — The India @ 71/100 Challenge",
            "theme": settings.THEME,
            "api_docs": "/docs",
            "endpoints": {
                "health": "/api/health",
                "overview": "/api/overview",
                "children": "/api/children",
                "escalations": "/api/escalations",
                "interoperability": "/api/interoperability/stats",
                "audit_logs": "/api/audit-logs"
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
