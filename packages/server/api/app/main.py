from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from .src.routes.fintoc import router as fintoc_router
from .src.routes.token_gatherer import router as token_gatherer_router
from .src.routes.agent_streaming import router as agent_streaming_router
from .src.routes.movements import router as movements_router

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include database routes
app.include_router(fintoc_router, prefix="/fintoc", tags=["fintoc"])
app.include_router(token_gatherer_router, prefix="/api/fintoc", tags=["token_gatherer"])
app.include_router(agent_streaming_router, tags=["agent"])
app.include_router(movements_router, prefix="/movements", tags=["movements"])

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
