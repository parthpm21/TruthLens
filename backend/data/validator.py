"""
TruthLens - Forensic Data Quality & Preprocessing Validator
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1 - Part 4)

This module handles:
1. Automated file integrity, dimension, and format header verification.
2. Anomaly detection in benchmark datasets (corrupted files, empty streams, suspicious dimensions).
3. Manifest consistency checks (label-to-verdict consistency, missing masks, imbalanced splits).
4. Generation of diagnostic dataset reports and statistical metrics.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image

from .dataset_manifest import BenchmarkSample, DatasetManifest, MediaType, Verdict


class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ValidationIssue:
    """Represents an issue found during media/dataset validation."""
    severity: ValidationSeverity
    code: str
    message: str
    field_name: Optional[str] = None
    suggested_action: Optional[str] = None


@dataclass
class ValidationResult:
    """Validation report for an individual media file or benchmark sample."""
    is_valid: bool
    media_path: str
    media_type: MediaType
    file_size_bytes: int = 0
    resolution: Tuple[int, int] = (0, 0)
    issues: List[ValidationIssue] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def has_errors(self) -> bool:
        """Check if result contains ERROR or CRITICAL severity issues."""
        return any(
            i.severity in (ValidationSeverity.ERROR, ValidationSeverity.CRITICAL)
            for i in self.issues
        )


@dataclass
class DatasetStatistics:
    """Statistical summary of validated dataset collection."""
    total_samples: int = 0
    valid_samples: int = 0
    invalid_samples: int = 0
    total_bytes: int = 0
    mean_resolution: Tuple[float, float] = (0.0, 0.0)
    verdict_breakdown: Dict[str, int] = field(default_factory=dict)
    source_breakdown: Dict[str, int] = field(default_factory=dict)
    issue_code_counts: Dict[str, int] = field(default_factory=dict)


@dataclass
class ValidationSummary:
    """Aggregated validation summary across an entire benchmark collection."""
    overall_valid: bool
    total_checked: int
    passed_count: int
    failed_count: int
    statistics: DatasetStatistics
    results: List[ValidationResult] = field(default_factory=list)


class PreprocessingValidator:
    """
    Validation engine for media ingestion and dataset benchmark pipelines.
    """

    SUPPORTED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
    SUPPORTED_VIDEO_EXTS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}

    def __init__(
        self,
        min_resolution: Tuple[int, int] = (64, 64),
        max_resolution: Tuple[int, int] = (8192, 8192),
        min_file_bytes: int = 128,
        max_file_bytes: int = 500 * 1024 * 1024,  # 500MB
    ) -> None:
        self.min_resolution = min_resolution
        self.max_resolution = max_resolution
        self.min_file_bytes = min_file_bytes
        self.max_file_bytes = max_file_bytes

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
                )
            )

        if file_size > self.max_file_bytes:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    code="FILE_VERY_LARGE",
                    message=f"File size ({file_size / (1024*1024):.1f} MB) is unusually large.",
                )
            )

        if path_obj.suffix.lower() not in self.SUPPORTED_IMAGE_EXTS:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    code="UNCONVENTIONAL_EXTENSION",
                    message=f"Extension '{path_obj.suffix}' is unconventional for images.",
                )
            )

        # Attempt decoding with PIL
        width, height = 0, 0
        try:
            with Image.open(str(file_path)) as img:
                img.verify()  # Verify integrity
            # Reopen to read dimensions and format (verify closes file)
            with Image.open(str(file_path)) as img:
                width, height = img.size
                format_name = img.format
                mode = img.mode

            if width < self.min_resolution[0] or height < self.min_resolution[1]:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        code="RESOLUTION_TOO_LOW",
                        message=f"Image resolution ({width}x{height}) is below minimum {self.min_resolution}.",
                    )
                )

            if width > self.max_resolution[0] or height > self.max_resolution[1]:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        code="RESOLUTION_VERY_HIGH",
                        message=f"Image resolution ({width}x{height}) exceeds {self.max_resolution}.",
                    )
                )

        except Exception as e:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    code="IMAGE_DECODE_FAILED",
                    message=f"Failed to decode image data: {str(e)}",
                )
            )
            format_name = "unknown"
            mode = "unknown"

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
                )
            )

        width, height = 0, 0
        cap = cv2.VideoCapture(str(file_path))
        try:
            if not cap.isOpened():
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        code="VIDEO_DECODE_FAILED",
                        message="OpenCV could not open video stream.",
                    )
                )
                return ValidationResult(
                    is_valid=False,
                    media_path=str(file_path),
                    media_type=MediaType.VIDEO,
                    file_size_bytes=file_size,
                    issues=issues,
                )

            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = float(cap.get(cv2.CAP_PROP_FPS))

            if total_frames <= 0:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        code="NO_FRAMES_DETECTED",
                        message="Video container contains 0 readable frames.",
                    )
                )

            if fps <= 0:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        code="ZERO_OR_INVALID_FPS",
                        message=f"Invalid video FPS ({fps}).",
                    )
                )

            if width < self.min_resolution[0] or height < self.min_resolution[1]:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        code="RESOLUTION_TOO_LOW",
                        message=f"Video resolution ({width}x{height}) is below minimum {self.min_resolution}.",
                    )
                )

            # Check if at least the first frame is decodable
            ret, frame = cap.read()
            if not ret or frame is None:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        code="FIRST_FRAME_DECODE_ERROR",
                        message="Failed to decode initial frame from video stream.",
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
                "duration_seconds": round(total_frames / fps, 2) if fps > 0 else 0,
            },
        )

    def validate_benchmark_sample(self, sample: BenchmarkSample) -> ValidationResult:
        """Validate sample metadata coherence with ground truth label."""
        if sample.media_type == MediaType.IMAGE:
            res = self.validate_image_file(sample.file_path)
        else:
            res = self.validate_video_file(sample.file_path)

        # Consistency checks
        if sample.label == 0 and sample.verdict != Verdict.AUTHENTIC:
            res.issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="LABEL_VERDICT_MISMATCH",
                    message=f"Sample label is 0 (authentic) but verdict is '{sample.verdict.value}'.",
                )
            )
            res.is_valid = False

        if sample.label == 1 and sample.verdict != Verdict.MANIPULATED:
            res.issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    code="LABEL_VERDICT_MISMATCH",
                    message=f"Sample label is 1 (manipulated) but verdict is '{sample.verdict.value}'.",
                )
            )
            res.is_valid = False

        if sample.ground_truth_mask_path and not os.path.exists(sample.ground_truth_mask_path):
            res.issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    code="MASK_FILE_MISSING",
                    message=f"Ground truth mask does not exist at {sample.ground_truth_mask_path}",
                )
            )

        return res

    def validate_manifest(self, manifest: DatasetManifest) -> ValidationSummary:
        """Validate all benchmark samples in a manifest and compute aggregated summary."""
        results: List[ValidationResult] = []
        passed = 0
        failed = 0
        total_bytes = 0
        widths: List[int] = []
        heights: List[int] = []
        verdict_counts: Dict[str, int] = {}
        source_counts: Dict[str, int] = {}
        issue_counts: Dict[str, int] = {}

        for sample in manifest.samples:
            res = self.validate_benchmark_sample(sample)
            results.append(res)
            if res.is_valid:
                passed += 1
            else:
                failed += 1

            total_bytes += res.file_size_bytes
            if res.resolution[0] > 0:
                widths.append(res.resolution[0])
                heights.append(res.resolution[1])

            v = sample.verdict.value
            verdict_counts[v] = verdict_counts.get(v, 0) + 1

            s = sample.generator_source.value
            source_counts[s] = source_counts.get(s, 0) + 1

            for issue in res.issues:
                issue_counts[issue.code] = issue_counts.get(issue.code, 0) + 1

        mean_w = float(np.mean(widths)) if widths else 0.0
        mean_h = float(np.mean(heights)) if heights else 0.0

        stats = DatasetStatistics(
            total_samples=len(manifest.samples),
            valid_samples=passed,
            invalid_samples=failed,
            total_bytes=total_bytes,
            mean_resolution=(round(mean_w, 1), round(mean_h, 1)),
            verdict_breakdown=verdict_counts,
            source_breakdown=source_counts,
            issue_code_counts=issue_counts,
        )

        return ValidationSummary(
            overall_valid=(failed == 0),
            total_checked=len(manifest.samples),
            passed_count=passed,
            failed_count=failed,
            statistics=stats,
            results=results,
        )
