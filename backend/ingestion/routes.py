from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["ingestion"])


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "truthlens-preprocessing-gateway"}


import tempfile
from pathlib import Path
from fastapi import UploadFile, File
from .preprocessing import preprocess_image_file

@router.post("/preprocess/image")
async def preprocess_image(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=Path(file.filename).suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    tensor = preprocess_image_file(tmp_path)
    Path(tmp_path).unlink(missing_ok=True)
    return {"filename": file.filename, "shape": list(tensor.shape),
            "mean": float(tensor.mean()), "std": float(tensor.std())}