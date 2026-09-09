"""
TruthLens - Media Ingestion & Preprocessing Endpoints
"""

import time
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from ...data.image_preprocessor import (
    ImagePreprocessor,
    NormalizationMode,
    ProcessedImage,
    ResizeMode,
)
from ...data.video_preprocessor import (
    ProcessedVideo,
    SamplingStrategy,
    VideoPreprocessor,
)
from ..schemas import (
    ProcessedImageResponse,
    ProcessedVideoResponse,
    UrlIngestRequest,
    VideoFrameMetaSchema,
)

router = APIRouter(prefix="/api/v1/ingest", tags=["Ingest"])


@router.post("/image", response_model=ProcessedImageResponse)
async def ingest_image(
    file: UploadFile = File(...),
    target_width: int = Form(224),
    target_height: int = Form(224),
    normalization: str = Form("imagenet"),
    resize_mode: str = Form("letterbox"),
    extract_noise_residuals: bool = Form(True),
) -> ProcessedImageResponse:
    """
    Ingest and preprocess an uploaded image:
    Decodes, standardizes resolution, normalizes tensor, and extracts EXIF & noise residuals.
    """
    start_time = time.perf_counter()

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file content is empty.",
        )

    try:
        norm_enum = NormalizationMode(normalization)
        resize_enum = ResizeMode(resize_mode)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid parameter value: {err}",
        )

    preprocessor = ImagePreprocessor(
        target_size=(target_width, target_height),
        normalization=norm_enum,
        resize_mode=resize_enum,
        extract_noise_residuals=extract_noise_residuals,
    )

    try:
        processed: ProcessedImage = preprocessor.process(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image preprocessing failed: {str(e)}",
        )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    noise_mean = (
        float(processed.noise_residual.mean())
        if processed.noise_residual is not None
        else None
    )

    return ProcessedImageResponse(
        success=True,
        media_type="image",
        tensor_shape=list(processed.tensor.shape),
        original_size=processed.original_size,
        target_size=processed.target_size,
        scale_factor=round(processed.scale_factor, 4),
        pad_offsets=processed.pad_offsets,
        exif_present=processed.exif_present,
        exif_data=processed.exif_data,
        noise_residual_present=processed.noise_residual is not None,
        noise_residual_mean=noise_mean,
        processing_time_ms=elapsed_ms,
    )


@router.post("/video", response_model=ProcessedVideoResponse)
async def ingest_video(
    file: UploadFile = File(...),
    target_width: int = Form(224),
    target_height: int = Form(224),
    num_frames: int = Form(16),
    sampling_strategy: str = Form("uniform"),
    target_fps: float = Form(1.0),
    normalization: str = Form("imagenet"),
    resize_mode: str = Form("letterbox"),
) -> ProcessedVideoResponse:
    """
    Ingest and preprocess an uploaded video:
    Samples frames, resizes, normalizes, and packages into a temporal sequence tensor.
    """
    start_time = time.perf_counter()

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded video must have a valid filename.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded video stream is empty.",
        )

    try:
        norm_enum = NormalizationMode(normalization)
        resize_enum = ResizeMode(resize_mode)
        strat_enum = SamplingStrategy(sampling_strategy)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid parameter value: {err}",
        )

    preprocessor = VideoPreprocessor(
        target_size=(target_width, target_height),
        num_frames=num_frames,
        sampling_strategy=strat_enum,
        target_fps=target_fps,
        normalization=norm_enum,
        resize_mode=resize_enum,
    )

    try:
        processed: ProcessedVideo = preprocessor.process(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Video preprocessing failed: {str(e)}",
        )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return ProcessedVideoResponse(
        success=True,
        media_type="video",
        tensor_shape=list(processed.tensor.shape),
        frame_count=processed.frame_count,
        original_fps=processed.original_fps,
        duration_seconds=processed.duration_seconds,
        original_resolution=processed.original_resolution,
        target_resolution=processed.target_resolution,
        frame_metadata=[
            VideoFrameMetaSchema(
                frame_index=m.frame_index,
                timestamp_seconds=m.timestamp_seconds,
                original_size=m.original_size,
                scale_factor=m.scale_factor,
                pad_offsets=m.pad_offsets,
            )
            for m in processed.frame_metadata
        ],
        sampling_strategy=strat_enum.value,
        processing_time_ms=elapsed_ms,
    )


@router.post("/url")
async def ingest_url(request: UrlIngestRequest):
    """
    Simulate stream resolution and metadata ingestion for a remote URL.
    """
    if not request.url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL must start with http:// or https://",
        )

    inferred_type = request.media_type
    if not inferred_type:
        lower = request.url.lower()
        if any(ext in lower for ext in [".jpg", ".jpeg", ".png", ".webp"]):
            inferred_type = "image"
        else:
            inferred_type = "video"

    return {
        "success": True,
        "source_url": request.url,
        "resolved_media_type": inferred_type,
        "target_resolution": [request.target_width, request.target_height],
        "status": "INGESTION_PENDING",
        "message": f"Successfully resolved stream for {inferred_type} ingestion.",
    }
