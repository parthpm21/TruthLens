from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["ingestion"])


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "truthlens-preprocessing-gateway"}