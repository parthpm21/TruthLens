"""
TruthLens - Preprocessing Output Validation & Dataset Integrity Engine
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1 - Part 4)

This module provides:
1. Strict tensor validation: dimensions (B, C, H, W), channel consistency, and numerical ranges.
2. Corrupt/truncated media detection and graceful rejection without halting pipelines.
3. Dataset statistical profiling: real vs. fake balance, generator source distribution, resolution spread.
4. Comprehensive batch manifest validation and structured JSON reporting.
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

from .dataset_manifest import (
    BenchmarkSample,
    DatasetManifest,
    MediaType,
    Verdict,
)
from .image_preprocessor import ImagePreprocessor, NormalizationMode
from .video_preprocessor import VideoPreprocessor


class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


@dataclass
class ValidationIssue:
    """Individual validation failure or warning record."""
    field: str
    message: str
    severity: ValidationSeverity = ValidationSeverity.ERROR
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ValidationResult:
    """Validation outcome for an individual media file, tensor, or benchmark sample."""
    is_valid: bool
    sample_id: Optional[str] = None
    issues: List[ValidationIssue] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "sample_id": self.sample_id,
            "issues": [asdict(i) for i in self.issues],
            "metrics": self.metrics,
        }


@dataclass
class DatasetStatistics:
    """Comprehensive statistical metrics for a benchmark dataset collection."""
    total_samples: int = 0
    valid_samples: int = 0
    corrupt_samples: int = 0
    authentic_count: int = 0
    manipulated_count: int = 0
    authentic_ratio: float = 0.0
    manipulated_ratio: float = 0.0
    image_count: int = 0
    video_count: int = 0
    source_distribution: Dict[str, int] = field(default_factory=dict)
    resolution_spread: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ValidationSummary:
    """Consolidated summary report for batch manifest validation."""
    total_evaluated: int
    passed_count: int
    failed_count: int
    statistics: DatasetStatistics
    failed_samples: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_evaluated": self.total_evaluated,
            "passed_count": self.passed_count,
            "failed_count": self.failed_count,
            "statistics": self.statistics.to_dict(),
            "failed_samples": self.failed_samples,
        }


class PreprocessingValidator:
    """
    Forensic validation engine for verifying tensor shapes, value ranges,
    media file integrity, and dataset distributions.
    """

    def __init__(
        self,
        target_size: Tuple[int, int] = (224, 224),
        expected_channels: int = 3,
        default_normalization: NormalizationMode = NormalizationMode.IMAGENET,
    ) -> None:
        self.target_size = target_size
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
        Validate tensor shape, channel dimension, and numerical boundaries.
        Supports 3D (C, H, W) and 4D (B, C, H, W) tensors.
        """
        issues: List[ValidationIssue] = []
        metrics: Dict[str, Any] = {}

        if not isinstance(tensor, np.ndarray):
            issues.append(
                ValidationIssue("tensor_type", f"Expected np.ndarray, got {type(tensor).__name__}")
            )
            return ValidationResult(is_valid=False, issues=issues)

        # 1. Dimension and Rank checks
        ndim = tensor.ndim
        metrics["ndim"] = ndim
        metrics["shape"] = list(tensor.shape)

        if ndim == 3:
            c, h, w = tensor.shape
        elif ndim == 4:
            b, c, h, w = tensor.shape
            metrics["batch_size"] = b
        else:
            issues.append(
                ValidationIssue("ndim", f"Expected 3D (C,H,W) or 4D (B,C,H,W) tensor, got {ndim}D")
            )
            return ValidationResult(is_valid=False, issues=issues, metrics=metrics)

        # 2. Channel check
        if c != self.expected_channels:
            issues.append(
                ValidationIssue("channels", f"Expected {self.expected_channels} channels, got {c}")
            )

        # 3. Target resolution check
        target_w, target_h = self.target_size
        if (w, h) != (target_w, target_h):
            issues.append(
                ValidationIssue("resolution", f"Expected spatial shape {(target_h, target_w)}, got {(h, w)}")
            )

        # 4. Optional exact shape match
        if expected_shape and tensor.shape != expected_shape:
            issues.append(
                ValidationIssue("shape_mismatch", f"Expected shape {expected_shape}, got {tensor.shape}")
            )

        # 5. Numerical integrity checks (NaN / Inf)
        if np.isnan(tensor).any():
            issues.append(ValidationIssue("numerical_nan", "Tensor contains NaN values"))
        if np.isinf(tensor).any():
            issues.append(ValidationIssue("numerical_inf", "Tensor contains Inf values"))

        # 6. Value range validation
        t_min = float(np.min(tensor))
        t_max = float(np.max(tensor))
        metrics["min_val"] = round(t_min, 4)
        metrics["max_val"] = round(t_max, 4)

        mode = norm_mode or self.default_normalization
        if mode == NormalizationMode.ZERO_TO_ONE:
            if t_min < -0.01 or t_max > 1.01:
                issues.append(
                    ValidationIssue(
                        "value_range",
                        f"ZERO_TO_ONE range violated: min={t_min:.3f}, max={t_max:.3f}",
                    )
                )
        elif mode == NormalizationMode.MINUS_ONE_TO_ONE:
            if t_min < -1.01 or t_max > 1.01:
                issues.append(
                    ValidationIssue(
                        "value_range",
                        f"MINUS_ONE_TO_ONE range violated: min={t_min:.3f}, max={t_max:.3f}",
                    )
                )
        elif mode == NormalizationMode.IMAGENET:
            # ImageNet normalized tensors typically fall within [-3.0, 3.5]
            if t_min < -3.5 or t_max > 3.5:
                issues.append(
                    ValidationIssue(
                        "value_range",
                        f"IMAGENET range out of expected bounds [-3.5, 3.5]: min={t_min:.3f}, max={t_max:.3f}",
                        severity=ValidationSeverity.WARNING,
                    )
                )

        is_valid = not any(i.severity == ValidationSeverity.ERROR for i in issues)
        return ValidationResult(is_valid=is_valid, issues=issues, metrics=metrics)

    def validate_media_file(
        self,
        file_path: Union[str, Path],
        media_type: MediaType = MediaType.IMAGE,
    ) -> ValidationResult:
        """
        Verify that a media file exists, has non-zero size, and can be cleanly decoded.
        """
        path_obj = Path(file_path)
        issues: List[ValidationIssue] = []
        metrics: Dict[str, Any] = {"file_path": str(file_path)}

        # 1. Existence and size checks
        if not path_obj.exists():
            issues.append(ValidationIssue("file_exists", f"File does not exist: {path_obj}"))
            return ValidationResult(is_valid=False, issues=issues, metrics=metrics)

        file_size = path_obj.stat().st_size
        metrics["file_size_bytes"] = file_size
        if file_size == 0:
            issues.append(ValidationIssue("file_size", "File is empty (0 bytes)"))
            return ValidationResult(is_valid=False, issues=issues, metrics=metrics)

        # 2. Decode verification
        if media_type == MediaType.IMAGE:
            try:
                with Image.open(path_obj) as img:
                    img.verify()
                with Image.open(path_obj) as img:
                    metrics["width"], metrics["height"] = img.size
                    metrics["format"] = img.format
            except Exception as e:
                issues.append(
                    ValidationIssue("image_decode", f"Corrupt image file failed decoding: {str(e)}")
                )
        elif media_type == MediaType.VIDEO:
            cap = cv2.VideoCapture(str(path_obj))
            if not cap.isOpened():
                issues.append(ValidationIssue("video_decode", f"Cannot open video stream: {path_obj}"))
            else:
                try:
                    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
                    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
                    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
                    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)

                    metrics["total_frames"] = total_frames
                    metrics["fps"] = fps
                    metrics["width"], metrics["height"] = w, h

                    if total_frames == 0 or w == 0 or h == 0:
                        issues.append(
                            ValidationIssue("video_stream", "Video stream contains 0 frames or invalid dimensions")
                        )
                    else:
                        ret, frame = cap.read()
                        if not ret or frame is None:
                            issues.append(ValidationIssue("video_read", "Failed to read initial frame from video"))
                finally:
                    cap.release()

        is_valid = not any(i.severity == ValidationSeverity.ERROR for i in issues)
        return ValidationResult(is_valid=is_valid, issues=issues, metrics=metrics)

    def validate_sample(
        self,
        sample: BenchmarkSample,
        run_preprocessing: bool = False,
    ) -> ValidationResult:
        """
        Validate metadata schema consistency, file availability, and optional preprocessing.
        """
        issues: List[ValidationIssue] = []
        metrics: Dict[str, Any] = {}

        # 1. Label and Verdict consistency
        if sample.verdict == Verdict.AUTHENTIC and sample.label != 0:
            issues.append(
                ValidationIssue("label_verdict", f"Label {sample.label} inconsistent with Verdict {sample.verdict.value}")
            )
        elif sample.verdict == Verdict.MANIPULATED and sample.label != 1:
            issues.append(
                ValidationIssue("label_verdict", f"Label {sample.label} inconsistent with Verdict {sample.verdict.value}")
            )

        # 2. File integrity
        file_res = self.validate_media_file(sample.file_path, sample.media_type)
        if not file_res.is_valid:
            issues.extend(file_res.issues)

        # 3. Optional preprocessor execution
        if run_preprocessing and file_res.is_valid:
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
                        issues.extend(tensor_res.issues)
                elif sample.media_type == MediaType.VIDEO:
                    if self._video_preprocessor is None:
                        self._video_preprocessor = VideoPreprocessor(
                            target_size=self.target_size,
                            normalization=self.default_normalization,
                        )
                    processed_v = self._video_preprocessor.process(sample.file_path)
                    tensor_res = self.validate_tensor(processed_v.tensor_batch, norm_mode=self.default_normalization)
                    if not tensor_res.is_valid:
                        issues.extend(tensor_res.issues)
            except Exception as e:
                issues.append(
                    ValidationIssue("preprocessing_failure", f"Preprocessing error: {str(e)}")
                )

        is_valid = not any(i.severity == ValidationSeverity.ERROR for i in issues)
        return ValidationResult(
            is_valid=is_valid,
            sample_id=sample.id,
            issues=issues,
            metrics=metrics,
        )

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
        widths: List[int] = []
        heights: List[int] = []

        for s in samples:
            src = s.generator_source.value
            sources[src] = sources.get(src, 0) + 1
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

        return DatasetStatistics(
            total_samples=total,
            valid_samples=total,
            corrupt_samples=0,
            authentic_count=auth,
            manipulated_count=manip,
            authentic_ratio=round(auth / total, 4),
            manipulated_ratio=round(manip / total, 4),
            image_count=img_count,
            video_count=vid_count,
            source_distribution=sources,
            resolution_spread=res_spread,
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

        for sample in manifest.samples:
            res = self.validate_sample(sample, run_preprocessing=run_preprocessing)
            if res.is_valid:
                passed_samples.append(sample)
            else:
                failed_records.append(res.to_dict())

        stats = self.generate_statistical_summary(passed_samples)
        stats.total_samples = len(manifest.samples)
        stats.valid_samples = len(passed_samples)
        stats.corrupt_samples = len(failed_records)

        return ValidationSummary(
            total_evaluated=len(manifest.samples),
            passed_count=len(passed_samples),
            failed_count=len(failed_records),
            statistics=stats,
            failed_samples=failed_records,
        )
