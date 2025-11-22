from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text
import os
import logging

logger = logging.getLogger(__name__)
load_dotenv()

from .routes.agent_streaming import router as agent_router

app = FastAPI(
    title="Claude Agent Streaming API",
    description="Minimal server for Claude Agent SDK streaming",
    version="1.0.0"
)

# CORS configuration - adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.on_event("startup")
async def startup_event():
    """Pre-warm database connection on startup."""
    try:
        logger.info("Pre-warming database connection...")
        from .db import get_engine
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection established successfully")
    except Exception as e:
        logger.error(f"Failed to establish database connection: {e}")

# Include only agent streaming routes
app.include_router(agent_router, tags=["agent"])

@app.get("/")
def read_root():
    return {
        "service": "Claude Agent Streaming API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health = {
        "status": "healthy",
        "anthropic_key_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "database_url_configured": bool(os.getenv("DATABASE_URL"))
    }

    # Test database connection
    try:
        from .db import get_engine
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health["database_connected"] = True
    except Exception as e:
        health["database_connected"] = False
        health["database_error"] = str(e)

    return health
