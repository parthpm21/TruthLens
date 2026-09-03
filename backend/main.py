from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import ingestion, curation

app = FastAPI(
    title="Benchmark Assembly & Ingestion API",
    description="FastAPI preprocessing gateway for multi-source benchmark datasets",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion.router, prefix="/api/ingestion", tags=["Ingestion"])
app.include_router(curation.router, prefix="/api/curation", tags=["Curation"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the TruthLens Ingestion & Curation Gateway"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
