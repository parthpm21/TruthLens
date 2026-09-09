"""
TruthLens - FastAPI Ingestion Gateway Data Schemas
Author: Pratham Yadav & Backend Gateway Team
Sprint 1: Test-framework setup for the ingestion gateway
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Service health indicator")
    service: str = Field(default="TruthLens Ingestion Gateway", description="Service name")
    version: str = Field(default="1.0.0", description="API version")
    engine_status: str = Field(default="ONLINE", description="Neural engine operational status")
    supported_image_formats: List[str]
    supported_video_formats: List[str]


class ImageIngestRequest(BaseModel):
    target_width: int = Field(default=224, ge=32, le=4096)
    target_height: int = Field(default=224, ge=32, le=4096)
    normalization: str = Field(default="imagenet", pattern="^(imagenet|zero_to_one|minus_one_to_one)$")
    resize_mode: str = Field(default="letterbox", pattern="^(letterbox|center_crop|direct)$")
    extract_noise_residuals: bool = True


class ProcessedImageResponse(BaseModel):
    success: bool
    media_type: str = "image"
    tensor_shape: List[int]
    original_size: Tuple[int, int]
    target_size: Tuple[int, int]
    scale_factor: float
    pad_offsets: Tuple[int, int, int, int]
    exif_present: bool
    exif_data: Dict[str, Any]
    noise_residual_present: bool
    noise_residual_mean: Optional[float] = None
    processing_time_ms: float


class VideoIngestRequest(BaseModel):
    target_width: int = Field(default=224, ge=32, le=4096)
    target_height: int = Field(default=224, ge=32, le=4096)
    num_frames: int = Field(default=16, ge=1, le=128)
    sampling_strategy: str = Field(default="uniform", pattern="^(uniform|fps|all|keyframe_first)$")
    target_fps: float = Field(default=1.0, ge=0.1, le=60.0)
    normalization: str = Field(default="imagenet", pattern="^(imagenet|zero_to_one|minus_one_to_one)$")
    resize_mode: str = Field(default="letterbox", pattern="^(letterbox|center_crop|direct)$")


class VideoFrameMetaSchema(BaseModel):
    frame_index: int
    timestamp_seconds: float
    original_size: Tuple[int, int]
    scale_factor: float
    pad_offsets: Tuple[int, int, int, int]


class ProcessedVideoResponse(BaseModel):
    success: bool
    media_type: str = "video"
    tensor_shape: List[int]  # [T, C, H, W]
    frame_count: int
    original_fps: float
    duration_seconds: float
    original_resolution: Tuple[int, int]
    target_resolution: Tuple[int, int]
    frame_metadata: List[VideoFrameMetaSchema]
    sampling_strategy: str
    processing_time_ms: float


class UrlIngestRequest(BaseModel):
    url: str
    media_type: Optional[str] = Field(default=None, pattern="^(image|video)$")
    target_width: int = Field(default=224, ge=32, le=4096)
    target_height: int = Field(default=224, ge=32, le=4096)


class ValidationIssueSchema(BaseModel):
    severity: str
    code: str
    message: str
    field_name: Optional[str] = None
    suggested_action: Optional[str] = None


class ValidationResponse(BaseModel):
    is_valid: bool
    media_path_or_name: str
    media_type: str
    file_size_bytes: int
    resolution: Tuple[int, int]
    issues: List[ValidationIssueSchema]
    metadata: Dict[str, Any]


class ManifestSummaryResponse(BaseModel):
    manifest_name: str
    total_samples: int
    authentic_samples: int
    manipulated_samples: int
    authentic_ratio: float
    manipulated_ratio: float
    image_count: int
    video_count: int
    source_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
