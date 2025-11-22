from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .src.routes.supabase_connection import router as supabase_connection_router
from .src.routes.fintoc import router as fintoc_router
from .src.routes.token_gatherer import router as token_gatherer_router

app = FastAPI()

# Add CORS middleware - this must come BEFORE the routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins - for production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include database routes
app.include_router(supabase_connection_router, prefix="/supabase_connection", tags=["supabase_connection"])
app.include_router(fintoc_router, prefix="/fintoc", tags=["fintoc"])
app.include_router(token_gatherer_router, prefix="/token_gatherer", tags=["token_gatherer"])

@app.get("/")
def read_root():
    return {"Hello": "World"}