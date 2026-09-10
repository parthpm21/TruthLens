"""
TruthLens — FastAPI Preprocessing Gateway
Author: Parth Maheshwari
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router as ingestion_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="TruthLens Preprocessing Gateway",
        description="Ingestion gateway for image/video benchmark preprocessing.",
        version="0.1.0",
    )
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                        allow_methods=["*"], allow_headers=["*"])
    app.include_router(ingestion_router)
    return app


app = create_app()