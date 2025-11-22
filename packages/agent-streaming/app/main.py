from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

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
    """Health check endpoint for Cloud Run"""
    health = {
        "status": "healthy",
        "anthropic_key_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "database_url_configured": bool(os.getenv("DATABASE_URL"))
    }
    return health
