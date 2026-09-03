from fastapi import APIRouter
import os

router = APIRouter()

UPLOAD_DIR = "backend/data/uploads"

@router.get("/datasets")
async def list_datasets():
    if not os.path.exists(UPLOAD_DIR):
        return {"datasets": []}
    
    files = os.listdir(UPLOAD_DIR)
    return {"datasets": files, "count": len(files)}

@router.get("/datasets/{filename}")
async def get_dataset_info(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        return {"error": "Dataset not found"}
        
    size = os.path.getsize(file_path)
    return {
        "filename": filename,
        "size_bytes": size,
        "path": file_path
    }
