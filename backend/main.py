"""Main FastAPI application entry point for Harvey Local Sales Agent.
Strict zero-cost local architecture; no cloud LLMs or paid API services.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import engine, Base, SessionLocal
from backend.models import Company
from backend.sample_data import seed_sample_database

# Import routers
from backend.routes.system import router as system_router
from backend.routes.companies import router as companies_router
from backend.routes.products import router as products_router
from backend.routes.prospects import router as prospects_router
from backend.routes.replies import router as replies_router
from backend.routes.seed import router as seed_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("harvey.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Initializing SQLite database tables...")
    Base.metadata.create_all(bind=engine)

    # Automatically seed sample demonstration data if empty
    db = SessionLocal()
    try:
        sample_count = db.query(Company).filter(Company.is_sample == True).count()
        if sample_count == 0:
            logger.info("Seeding realistic demonstration companies, products, and prospects...")
            seed_sample_database(db=db, force_reset=False)
    finally:
        db.close()

    logger.info("=" * 60)
    logger.info("Harvey Local Sales Agent Backend initialized.")
    logger.info(f"Ollama Local Inference Base URL: {settings.OLLAMA_BASE_URL}")
    logger.info(f"Default Local Model: {settings.OLLAMA_DEFAULT_MODEL}")
    logger.info("Cloud LLM APIs (OpenAI, Anthropic, Gemini): STRICTLY PROHIBITED (Zero Cost)")
    logger.info("=" * 60)
    yield
    logger.info("Harvey Local Sales Agent shutting down.")


app = FastAPI(
    title="Harvey Local Sales Agent",
    description="Autonomous local multi-product AI sales agent running 100% on open-weight models via Ollama. Zero API billing.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(system_router)
app.include_router(companies_router)
app.include_router(products_router)
app.include_router(prospects_router)
app.include_router(replies_router)
app.include_router(seed_router)

# Mount Frontend SPA if built
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    def serve_dashboard_root():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"app": "Harvey Local Sales Agent", "version": "2.0.0"}

    @app.get("/dashboard")
    def serve_dashboard():
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def root_endpoint():
        return {
            "app": "Harvey Local Sales Agent",
            "version": "2.0.0",
            "architecture": "Zero-Cost Local AI (Ollama + Qwen2.5 / Llama 3.2)",
            "docs_url": "/docs",
            "health_url": "/api/system/health",
            "hardware_url": "/api/system/hardware",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
