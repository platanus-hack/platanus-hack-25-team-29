from fastapi import FastAPI
from .src.routes.supabase_connection import router as supabase_connection_router
from .src.routes.fintoc import router as fintoc_router
from .src.routes.token_gatherer import router as token_gatherer_router

app = FastAPI()

# Include database routes
app.include_router(supabase_connection_router, prefix="/supabase_connection", tags=["supabase_connection"])
app.include_router(fintoc_router, prefix="/fintoc", tags=["fintoc"])
app.include_router(token_gatherer_router, prefix="/token_gatherer", tags=["token_gatherer"])

@app.get("/")
def read_root():
    return {"Hello": "World"}