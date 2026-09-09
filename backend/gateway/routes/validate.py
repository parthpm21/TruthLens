"""
TruthLens - Media Validation Endpoint
"""

import os
import tempfile
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ...data.dataset_manifest import MediaType
from ...data.validator import PreprocessingValidator, ValidationResult
from ..schemas import ValidationIssueSchema, ValidationResponse

router = APIRouter(prefix="/api/v1/validate", tags=["Validation"])


@router.post("/media", response_model=ValidationResponse)
async def validate_media_file(
    file: UploadFile = File(...),
) -> ValidationResponse:
    """
    Validate uploaded media file for corruption, minimum resolution, and format compliance.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a valid filename.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty.",
        )

    suffix = os.path.splitext(file.filename)[1].lower()
    is_video = suffix in {".mp4", ".mov", ".avi", ".webm", ".mkv"}

    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(content)

        validator = PreprocessingValidator()
        if is_video:
            result: ValidationResult = validator.validate_video_file(tmp_path)
        else:
            result: ValidationResult = validator.validate_image_file(tmp_path)

        return ValidationResponse(
            is_valid=result.is_valid,
            media_path_or_name=file.filename,
            media_type=result.media_type.value,
            file_size_bytes=result.file_size_bytes,
            resolution=result.resolution,
            issues=[
                ValidationIssueSchema(
                    severity=issue.severity.value,
                    code=issue.code,
                    message=issue.message,
                    field_name=issue.field_name,
                    suggested_action=issue.suggested_action,
                )
                for issue in result.issues
            ],
            metadata=result.metadata,
        )

    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
