"""
TruthLens - Health & System Status Endpoint
"""

from fastapi import APIRouter
from ..schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health_status() -> HealthResponse:
    """Return health status and supported codecs of the TruthLens Ingestion Gateway."""
    return HealthResponse(
        status="healthy",
        service="TruthLens Ingestion Gateway",
        version="1.0.0",
        engine_status="ONLINE",
        supported_image_formats=["JPEG", "PNG", "WEBP", "BMP", "TIFF"],
        supported_video_formats=["MP4", "MOV", "AVI", "WEBM", "MKV"],
    )
