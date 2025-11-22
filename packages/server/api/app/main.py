from fastapi import FastAPI
from .src.routes.supabase_connection import router as supabase_connection_router
from .src.routes.fintoc import router as fintoc_router

app = FastAPI()

# Include database routes
app.include_router(supabase_connection_router, prefix="/supabase_connection", tags=["supabase_connection"])
app.include_router(fintoc_router, prefix="/fintoc", tags=["fintoc"])

@app.get("/")
def read_root():
    return {"Hello": "World"}