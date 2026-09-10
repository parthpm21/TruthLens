"""
TruthLens - Forensic Data Quality & Preprocessing Validator
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1 - Part 4)

This module handles:
1. Strict tensor validation: dimensions (B, C, H, W), channel consistency, and numerical value ranges [0.0, 1.0].
2. Corrupt and truncated media detection with graceful rejection.
3. Label-to-verdict manifest consistency checks and mask path verification.
4. Dataset statistical profiling (real vs fake balance, source distribution, resolution spread).
5. Comprehensive batch manifest validation and structured reporting.
"""

from __future__ import annotations

import os
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image

from .dataset_manifest import BenchmarkSample, DatasetManifest, MediaType, Verdict
from .image_preprocessor import ImagePreprocessor, NormalizationMode
from .video_preprocessor import VideoPreprocessor


class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ValidationIssue:
    """Represents an issue found during media, tensor, or dataset validation."""
    severity: ValidationSeverity = ValidationSeverity.ERROR
    code: str = "VALIDATION_ERROR"
    message: str = ""
    field_name: Optional[str] = None
    suggested_action: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity.value,
            "code": self.code,
            "message": self.message,
            "field_name": self.field_name,
            "suggested_action": self.suggested_action,
            "details": self.details,
        }


@dataclass
class ValidationResult:
    """Validation report for an individual media file, tensor, or benchmark sample."""
    is_valid: bool
    media_path: str = ""
    media_type: MediaType = MediaType.IMAGE
    sample_id: Optional[str] = None
    file_size_bytes: int = 0
    resolution: Tuple[int, int] = (0, 0)
    issues: List[ValidationIssue] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def has_errors(self) -> bool:
        """Check if result contains ERROR or CRITICAL severity issues."""
        return any(
            i.severity in (ValidationSeverity.ERROR, ValidationSeverity.CRITICAL)
            for i in self.issues
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "media_path": self.media_path,
            "media_type": self.media_type.value,
            "sample_id": self.sample_id,
            "file_size_bytes": self.file_size_bytes,
            "resolution": list(self.resolution),
            "issues": [i.to_dict() for i in self.issues],
            "metadata": self.metadata,
            "metrics": self.metrics,
        }


@dataclass
class DatasetStatistics:
    """Statistical summary of validated dataset collection."""
    total_samples: int = 0
    valid_samples: int = 0
    invalid_samples: int = 0
    corrupt_samples: int = 0
    authentic_count: int = 0
    manipulated_count: int = 0
    authentic_ratio: float = 0.0
    manipulated_ratio: float = 0.0
    image_count: int = 0
    video_count: int = 0
    total_bytes: int = 0
    mean_resolution: Tuple[float, float] = (0.0, 0.0)
    resolution_spread: Dict[str, Any] = field(default_factory=dict)
    verdict_breakdown: Dict[str, int] = field(default_factory=dict)
    source_distribution: Dict[str, int] = field(default_factory=dict)
    source_breakdown: Dict[str, int] = field(default_factory=dict)
    issue_code_counts: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        return data


@dataclass
class ValidationSummary:
    """Aggregated validation summary across an entire benchmark collection."""
    overall_valid: bool
    total_checked: int
    passed_count: int
    failed_count: int
    statistics: DatasetStatistics
    total_evaluated: int = 0
    results: List[ValidationResult] = field(default_factory=list)
    failed_samples: List[Dict[str, Any]] = field(default_factory=list)

    def __post_init__(self):
        if self.total_evaluated == 0 and self.total_checked > 0:
            self.total_evaluated = self.total_checked

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_valid": self.overall_valid,
            "total_checked": self.total_checked,
            "total_evaluated": self.total_evaluated,
            "passed_count": self.passed_count,
            "failed_count": self.failed_count,
            "statistics": self.statistics.to_dict(),
            "results": [r.to_dict() for r in self.results],
            "failed_samples": self.failed_samples,
        }


class PreprocessingValidator:
    """
    Forensic validation engine for verifying tensor shapes, value ranges,
    media file integrity, and dataset distributions.
    """

    SUPPORTED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    SUPPORTED_VIDEO_EXTS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}

    def __init__(
        self,
        target_size: Tuple[int, int] = (224, 224),
        min_resolution: Tuple[int, int] = (64, 64),
        max_resolution: Tuple[int, int] = (8192, 8192),
        min_file_bytes: int = 128,
        max_file_bytes: int = 500 * 1024 * 1024,  # 500MB
        expected_channels: int = 3,
        default_normalization: NormalizationMode = NormalizationMode.IMAGENET,
    ) -> None:
        self.target_size = target_size
        self.min_resolution = min_resolution
        self.max_resolution = max_resolution
        self.min_file_bytes = min_file_bytes
        self.max_file_bytes = max_file_bytes
        self.expected_channels = expected_channels
        self.default_normalization = default_normalization
        self._image_preprocessor: Optional[ImagePreprocessor] = None
        self._video_preprocessor: Optional[VideoPreprocessor] = None

    def validate_tensor(
        self,
        tensor: np.ndarray,
        expected_shape: Optional[Tuple[int, ...]] = None,
        norm_mode: Optional[NormalizationMode] = None,
    ) -> ValidationResult:
        """
        Validate tensor shape, channel dimension, and numerical boundaries [0.0, 1.0] / [-1.0, 1.0].
        Supports 3D (C, H, W) and 4D (B, C, H, W) or (T, C, H, W) tensors.
        """
        issues: List[ValidationIssue] = []
        metrics: Dict[str, Any] = {}

        if not isinstance(tensor, np.ndarray):
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    code="INVALID_TENSOR_TYPE",
                    message=f"Expected numpy.ndarray, got {type(tensor).__name__}",
                    field_name="tensor",
                )
            )
            return ValidationResult(is_valid=False, issues=issues, metrics=metrics)

        # 1. Dimension and Rank checks
        ndim = tensor.ndim
        metrics["ndim"] = ndim
        metrics["shape"] = list(tensor.shape)
        metrics["dtype"] = str(tensor.dtype)

        if ndim not in (3, 4):
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="INVALID_TENSOR_RANK",
                    message=f"Expected 3D (C, H, W) or 4D (B/T, C, H, W) tensor, got {ndim}D shape {tensor.shape}",
                    field_name="tensor.shape",
                )
            )
            return ValidationResult(is_valid=False, issues=issues, metrics=metrics)

        # Extract channel dimension
        channels = tensor.shape[0] if ndim == 3 else tensor.shape[1]
        if channels != self.expected_channels:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="CHANNEL_MISMATCH",
                    message=f"Expected {self.expected_channels} channels (RGB), found {channels}",
                    field_name="tensor.channels",
                )
            )

        # 2. Check for NaN and Inf
        has_nan = bool(np.isnan(tensor).any())
        has_inf = bool(np.isinf(tensor).any())
        if has_nan:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    code="TENSOR_CONTAINS_NAN",
                    message="Tensor contains NaN (Not a Number) values.",
                    field_name="tensor.values",
                )
            )
        if has_inf:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    code="TENSOR_CONTAINS_INF",
                    message="Tensor contains infinite (Inf) values.",
                    field_name="tensor.values",
                )
            )

        if not has_nan and not has_inf and tensor.size > 0:
            min_val = float(np.min(tensor))
            max_val = float(np.max(tensor))
            mean_val = float(np.mean(tensor))
            std_val = float(np.std(tensor))

            metrics["min_val"] = round(min_val, 4)
            metrics["max_val"] = round(max_val, 4)
            metrics["mean_val"] = round(mean_val, 4)
            metrics["std_val"] = round(std_val, 4)

            # 3. Value Range Checks based on Normalization Mode
            mode = norm_mode or self.default_normalization
            if mode == NormalizationMode.ZERO_TO_ONE:
                if min_val < -1e-4 or max_val > 1.0 + 1e-4:
                    issues.append(
                        ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            code="OUT_OF_BOUNDS_ZERO_TO_ONE",
                            message=f"Values outside [0.0, 1.0] range: min={min_val:.4f}, max={max_val:.4f}",
                            field_name="tensor.values",
                        )
                    )
            elif mode == NormalizationMode.MINUS_ONE_TO_ONE:
                if min_val < -1.0 - 1e-4 or max_val > 1.0 + 1e-4:
                    issues.append(
                        ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            code="OUT_OF_BOUNDS_MINUS_ONE_TO_ONE",
                            message=f"Values outside [-1.0, 1.0] range: min={min_val:.4f}, max={max_val:.4f}",
                            field_name="tensor.values",
                        )
                    )
            elif mode == NormalizationMode.IMAGENET:
                # ImageNet normalized range is typically ~[-2.5, 2.7]
                if min_val < -5.0 or max_val > 5.0:
                    issues.append(
                        ValidationIssue(
                            severity=ValidationSeverity.WARNING,
                            code="SUSPICIOUS_IMAGENET_RANGE",
                            message=f"ImageNet normalized values exceed typical spread: min={min_val:.4f}, max={max_val:.4f}",
                            field_name="tensor.values",
                        )
                    )

        # 4. Expected Shape Match
        if expected_shape and tensor.shape != expected_shape:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="SHAPE_MISMATCH",
                    message=f"Tensor shape {tensor.shape} does not match expected {expected_shape}",
                    field_name="tensor.shape",
                )
            )

        is_valid = not any(
            i.severity in (ValidationSeverity.ERROR, ValidationSeverity.CRITICAL)
            for i in issues
        )

        return ValidationResult(
            is_valid=is_valid,
            issues=issues,
            metrics=metrics,
            metadata={"normalization_mode": (norm_mode or self.default_normalization).value},
        )

    def validate_image_file(self, file_path: Union[str, Path]) -> ValidationResult:
        """Validate an image file for integrity, dimensions, and readability."""
        path_obj = Path(file_path)
        issues: List[ValidationIssue] = []

        if not path_obj.exists():
            return ValidationResult(
                is_valid=False,
                media_path=str(file_path),
                media_type=MediaType.IMAGE,
                issues=[
                    ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        code="FILE_NOT_FOUND",
                        message=f"File does not exist at {file_path}",
                        field_name="file_path",
                        suggested_action="Verify media path existence before ingestion",
                    )
                ],
            )

        file_size = path_obj.stat().st_size
        if file_size < self.min_file_bytes:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="FILE_TOO_SMALL",
                    message=f"File size ({file_size} bytes) is below minimum threshold ({self.min_file_bytes} bytes).",
                    field_name="file_size",
                )
            )

        if file_size > self.max_file_bytes:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    code="FILE_VERY_LARGE",
                    message=f"File size ({file_size / (1024*1024):.1f} MB) is unusually large.",
                    field_name="file_size",
                )
            )

        if path_obj.suffix.lower() not in self.SUPPORTED_IMAGE_EXTS:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    code="UNCONVENTIONAL_EXTENSION",
                    message=f"Extension '{path_obj.suffix}' is unconventional for images.",
                    field_name="file_extension",
                )
            )

        # Attempt decoding with PIL
        width, height = 0, 0
        format_name = "unknown"
        mode = "unknown"
        try:
            with Image.open(str(file_path)) as img:
                img.verify()  # Verify byte integrity
            with Image.open(str(file_path)) as img:
                width, height = img.size
                format_name = str(img.format)
                mode = str(img.mode)

            if width < self.min_resolution[0] or height < self.min_resolution[1]:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        code="RESOLUTION_TOO_LOW",
                        message=f"Image resolution ({width}x{height}) is below minimum {self.min_resolution}.",
                        field_name="resolution",
                    )
                )

            if width > self.max_resolution[0] or height > self.max_resolution[1]:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        code="RESOLUTION_VERY_HIGH",
                        message=f"Image resolution ({width}x{height}) exceeds {self.max_resolution}.",
                        field_name="resolution",
                    )
                )

        except Exception as e:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    code="IMAGE_DECODE_FAILED",
                    message=f"Failed to decode image data: {str(e)}",
                    field_name="image_data",
                )
            )

        is_valid = not any(
            i.severity in (ValidationSeverity.ERROR, ValidationSeverity.CRITICAL)
            for i in issues
        )

        return ValidationResult(
            is_valid=is_valid,
            media_path=str(file_path),
            media_type=MediaType.IMAGE,
            file_size_bytes=file_size,
            resolution=(width, height),
            issues=issues,
            metadata={"format": format_name, "color_mode": mode},
        )

    def validate_video_file(self, file_path: Union[str, Path]) -> ValidationResult:
        """Validate a video file for stream integrity, FPS, and frame availability."""
        path_obj = Path(file_path)
        issues: List[ValidationIssue] = []

        if not path_obj.exists():
            return ValidationResult(
                is_valid=False,
                media_path=str(file_path),
                media_type=MediaType.VIDEO,
                issues=[
                    ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        code="FILE_NOT_FOUND",
                        message=f"Video file does not exist at {file_path}",
                        field_name="file_path",
                        suggested_action="Verify video file path before processing",
                    )
                ],
            )

        file_size = path_obj.stat().st_size
        if file_size < self.min_file_bytes:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="FILE_TOO_SMALL",
                    message=f"Video file size ({file_size} bytes) is below minimum threshold.",
                    field_name="file_size",
                )
            )

        width, height = 0, 0
        total_frames = 0
        fps = 0.0
        cap = cv2.VideoCapture(str(file_path))
        try:
            if not cap.isOpened():
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        code="VIDEO_DECODE_FAILED",
                        message="OpenCV could not open video stream.",
                        field_name="video_stream",
                    )
                )
                return ValidationResult(
                    is_valid=False,
                    media_path=str(file_path),
                    media_type=MediaType.VIDEO,
                    file_size_bytes=file_size,
                    issues=issues,
                )

            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)

            if total_frames <= 0:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        code="NO_FRAMES_DETECTED",
                        message="Video container contains 0 readable frames.",
                        field_name="frame_count",
                    )
                )

            if fps <= 0:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        code="ZERO_OR_INVALID_FPS",
                        message=f"Invalid video FPS ({fps}).",
                        field_name="fps",
                    )
                )

            if width < self.min_resolution[0] or height < self.min_resolution[1]:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        code="RESOLUTION_TOO_LOW",
                        message=f"Video resolution ({width}x{height}) is below minimum {self.min_resolution}.",
                        field_name="resolution",
                    )
                )

            # Check if initial frame can be decoded
            ret, frame = cap.read()
            if not ret or frame is None:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        code="FIRST_FRAME_DECODE_ERROR",
                        message="Failed to decode initial frame from video stream.",
                        field_name="initial_frame",
                    )
                )

        finally:
            cap.release()

        is_valid = not any(
            i.severity in (ValidationSeverity.ERROR, ValidationSeverity.CRITICAL)
            for i in issues
        )

        return ValidationResult(
            is_valid=is_valid,
            media_path=str(file_path),
            media_type=MediaType.VIDEO,
            file_size_bytes=file_size,
            resolution=(width, height),
            issues=issues,
            metadata={
                "total_frames": total_frames,
                "fps": fps,
                "duration_seconds": round(total_frames / fps, 2) if fps > 0 else 0.0,
            },
        )

    def validate_benchmark_sample(
        self,
        sample: BenchmarkSample,
        run_preprocessing: bool = False,
    ) -> ValidationResult:
        """Validate sample metadata coherence with ground truth label and optional preprocessing."""
        if sample.media_type == MediaType.IMAGE:
            res = self.validate_image_file(sample.file_path)
        else:
            res = self.validate_video_file(sample.file_path)

        res.sample_id = sample.id

        # Consistency checks
        if sample.label == 0 and sample.verdict != Verdict.AUTHENTIC:
            res.issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="LABEL_VERDICT_MISMATCH",
                    message=f"Sample label is 0 (authentic) but verdict is '{sample.verdict.value}'.",
                    field_name="label",
                )
            )
            res.is_valid = False

        if sample.label == 1 and sample.verdict != Verdict.MANIPULATED:
            res.issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="LABEL_VERDICT_MISMATCH",
                    message=f"Sample label is 1 (manipulated) but verdict is '{sample.verdict.value}'.",
                    field_name="label",
                )
            )
            res.is_valid = False

        if sample.ground_truth_mask_path and not os.path.exists(sample.ground_truth_mask_path):
            res.issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    code="MASK_FILE_MISSING",
                    message=f"Ground truth mask does not exist at {sample.ground_truth_mask_path}",
                    field_name="ground_truth_mask_path",
                )
            )

        # Optional Preprocessor Execution & Tensor Validation
        if run_preprocessing and res.is_valid and os.path.exists(sample.file_path):
            try:
                if sample.media_type == MediaType.IMAGE:
                    if self._image_preprocessor is None:
                        self._image_preprocessor = ImagePreprocessor(
                            target_size=self.target_size,
                            normalization=self.default_normalization,
                        )
                    processed = self._image_preprocessor.process(sample.file_path)
                    tensor_res = self.validate_tensor(processed.tensor, norm_mode=self.default_normalization)
                    if not tensor_res.is_valid:
                        res.issues.extend(tensor_res.issues)
                        res.is_valid = False
                elif sample.media_type == MediaType.VIDEO:
                    if self._video_preprocessor is None:
                        self._video_preprocessor = VideoPreprocessor(
                            target_size=self.target_size,
                            normalization=self.default_normalization,
                        )
                    processed_v = self._video_preprocessor.process(sample.file_path)
                    tensor_res = self.validate_tensor(processed_v.tensor, norm_mode=self.default_normalization)
                    if not tensor_res.is_valid:
                        res.issues.extend(tensor_res.issues)
                        res.is_valid = False
            except Exception as e:
                res.issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        code="PREPROCESSING_FAILURE",
                        message=f"Preprocessing error: {str(e)}",
                        field_name="preprocessing",
                    )
                )
                res.is_valid = False

        return res

    def validate_sample(
        self,
        sample: BenchmarkSample,
        run_preprocessing: bool = False,
    ) -> ValidationResult:
        """Alias for validate_benchmark_sample."""
        return self.validate_benchmark_sample(sample, run_preprocessing=run_preprocessing)

    def generate_statistical_summary(self, samples: List[BenchmarkSample]) -> DatasetStatistics:
        """Calculate statistical summaries across a sample list."""
        total = len(samples)
        if total == 0:
            return DatasetStatistics()

        auth = sum(1 for s in samples if s.label == 0)
        manip = sum(1 for s in samples if s.label == 1)
        img_count = sum(1 for s in samples if s.media_type == MediaType.IMAGE)
        vid_count = sum(1 for s in samples if s.media_type == MediaType.VIDEO)

        sources: Dict[str, int] = {}
        verdicts: Dict[str, int] = {}
        widths: List[int] = []
        heights: List[int] = []

        for s in samples:
            src = s.generator_source.value
            sources[src] = sources.get(src, 0) + 1
            verd = s.verdict.value
            verdicts[verd] = verdicts.get(verd, 0) + 1
            if s.resolution and s.resolution[0] > 0 and s.resolution[1] > 0:
                widths.append(s.resolution[0])
                heights.append(s.resolution[1])

        res_spread: Dict[str, Any] = {
            "min_resolution": (min(widths), min(heights)) if widths else (0, 0),
            "max_resolution": (max(widths), max(heights)) if widths else (0, 0),
            "avg_resolution": (
                round(float(np.mean(widths)), 1) if widths else 0.0,
                round(float(np.mean(heights)), 1) if heights else 0.0,
            ),
        }

        mean_w = float(np.mean(widths)) if widths else 0.0
        mean_h = float(np.mean(heights)) if heights else 0.0

        return DatasetStatistics(
            total_samples=total,
            valid_samples=total,
            invalid_samples=0,
            corrupt_samples=0,
            authentic_count=auth,
            manipulated_count=manip,
            authentic_ratio=round(auth / total, 4) if total > 0 else 0.0,
            manipulated_ratio=round(manip / total, 4) if total > 0 else 0.0,
            image_count=img_count,
            video_count=vid_count,
            mean_resolution=(round(mean_w, 1), round(mean_h, 1)),
            resolution_spread=res_spread,
            verdict_breakdown=verdicts,
            source_distribution=sources,
            source_breakdown=sources,
        )

    def validate_manifest(
        self,
        manifest: DatasetManifest,
        run_preprocessing: bool = False,
    ) -> ValidationSummary:
        """
        Validate an entire DatasetManifest in batch, catching corrupt files and building
        statistical summary metrics.
        """
        passed_samples: List[BenchmarkSample] = []
        failed_records: List[Dict[str, Any]] = []
        results: List[ValidationResult] = []
        total_bytes = 0
        issue_counts: Dict[str, int] = {}

        for sample in manifest.samples:
            res = self.validate_benchmark_sample(sample, run_preprocessing=run_preprocessing)
            results.append(res)
            total_bytes += res.file_size_bytes

            for issue in res.issues:
                issue_counts[issue.code] = issue_counts.get(issue.code, 0) + 1

            if res.is_valid:
                passed_samples.append(sample)
            else:
                failed_records.append(res.to_dict())

        stats = self.generate_statistical_summary(passed_samples)
        stats.total_samples = len(manifest.samples)
        stats.valid_samples = len(passed_samples)
        stats.invalid_samples = len(failed_records)
        stats.corrupt_samples = len(failed_records)
        stats.total_bytes = total_bytes
        stats.issue_code_counts = issue_counts

        return ValidationSummary(
            overall_valid=(len(failed_records) == 0),
            total_checked=len(manifest.samples),
            total_evaluated=len(manifest.samples),
            passed_count=len(passed_samples),
            failed_count=len(failed_records),
            statistics=stats,
            results=results,
            failed_samples=failed_records,
        )
