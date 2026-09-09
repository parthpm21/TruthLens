"""
TruthLens - Video Ingestion & Temporal Preprocessing Pipeline
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1 - Part 3)

This module handles:
1. Multi-format video decoding and metadata extraction via OpenCV (duration, FPS, resolution, frame count).
2. Configurable frame sampling strategies (Uniform interval sampling, Fixed FPS sampling, All frames).
3. Frame-level preprocessing (letterbox/center-crop resizing and ImageNet/[-1,1] normalization).
4. Temporal tensor assembly into (T, C, H, W) format suitable for 3D-CNNs / Video Transformers.
"""

from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image

from .image_preprocessor import (
    ImagePreprocessor,
    NormalizationMode,
    ProcessedImage,
    ResizeMode,
)


class SamplingStrategy(str, Enum):
    UNIFORM = "uniform"          # Equidistant sampling across video duration (e.g., 16 frames)
    FPS = "fps"                  # Sample at target frame rate (e.g., 1 frame per second)
    ALL = "all"                  # Extract all available frames (up to max_frames limit)
    KEYFRAME_FIRST = "keyframe_first"  # Sample starting from keyframe intervals


@dataclass
class VideoFrameMetadata:
    """Metadata for an individual extracted video frame."""
    frame_index: int
    timestamp_seconds: float
    original_size: Tuple[int, int]
    scale_factor: float
    pad_offsets: Tuple[int, int, int, int]


@dataclass
class ProcessedVideo:
    """Represents preprocessed video tensor and temporal sequence metadata."""
    tensor: np.ndarray  # Shape: (T, C, H, W) in float32
    frame_count: int
    original_fps: float
    duration_seconds: float
    original_resolution: Tuple[int, int]  # (width, height)
    target_resolution: Tuple[int, int]    # (target_w, target_h)
    frame_metadata: List[VideoFrameMetadata] = field(default_factory=list)
    has_audio_track: bool = False
    metadata_tags: Dict[str, Any] = field(default_factory=dict)

    def to_batch(self) -> np.ndarray:
        """Return video tensor with batch dimension (1, T, C, H, W)."""
        return np.expand_dims(self.tensor, axis=0)

    def to_channel_first_temporal(self) -> np.ndarray:
        """Return video tensor in (C, T, H, W) format for PyTorch 3D-CNNs / I3D backbones."""
        return np.transpose(self.tensor, (1, 0, 2, 3))


class VideoPreprocessor:
    """
    Forensic-grade temporal video preprocessing engine.
    """

    def __init__(
        self,
        target_size: Tuple[int, int] = (224, 224),
        num_frames: int = 16,
        sampling_strategy: SamplingStrategy = SamplingStrategy.UNIFORM,
        target_fps: Optional[float] = 1.0,
        max_frames: int = 64,
        normalization: NormalizationMode = NormalizationMode.IMAGENET,
        resize_mode: ResizeMode = ResizeMode.LETTERBOX,
    ) -> None:
        self.target_size = target_size
        self.num_frames = num_frames
        self.sampling_strategy = sampling_strategy
        self.target_fps = target_fps
        self.max_frames = max_frames
        self.normalization = normalization
        self.resize_mode = resize_mode

        # Internal image preprocessor for per-frame transformation
        self.image_preprocessor = ImagePreprocessor(
            target_size=target_size,
            normalization=normalization,
            resize_mode=resize_mode,
            extract_noise_residuals=False,
        )

    def _determine_frame_indices(
        self, total_frames: int, video_fps: float, duration: float
    ) -> List[int]:
        """Compute target frame indices to sample based on chosen SamplingStrategy."""
        if total_frames <= 0:
            return []

        if self.sampling_strategy == SamplingStrategy.UNIFORM:
            # Equidistantly space num_frames across the duration
            count = min(self.num_frames, total_frames)
            if count == 1:
                return [total_frames // 2]
            return [int(idx) for idx in np.linspace(0, total_frames - 1, count)]

        elif self.sampling_strategy == SamplingStrategy.FPS:
            target_fps = self.target_fps or 1.0
            step = max(1, int(round(video_fps / target_fps))) if video_fps > 0 else 1
            indices = list(range(0, total_frames, step))
            if len(indices) > self.max_frames:
                indices = indices[: self.max_frames]
            return indices

        elif self.sampling_strategy == SamplingStrategy.ALL:
            return list(range(min(total_frames, self.max_frames)))

        elif self.sampling_strategy == SamplingStrategy.KEYFRAME_FIRST:
            count = min(self.num_frames, total_frames)
            indices = [int(i * (total_frames / count)) for i in range(count)]
            return indices

        return list(range(min(total_frames, self.num_frames)))

    def process(
        self,
        input_source: Union[str, Path, bytes],
    ) -> ProcessedVideo:
        """
        Extract and preprocess frames from a video file path or byte buffer.
        """
        temp_file_created = False
        video_path = ""

        if isinstance(input_source, bytes):
            # Write bytes to temporary file for OpenCV VideoCapture
            fd, tmp_path = tempfile.mkstemp(suffix=".mp4")
            with os.fdopen(fd, "wb") as f:
                f.write(input_source)
            video_path = tmp_path
            temp_file_created = True
        elif isinstance(input_source, (str, Path)):
            video_path = str(input_source)
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found at: {video_path}")
        else:
            raise TypeError(f"Unsupported video input type: {type(input_source)}")

        cap = cv2.VideoCapture(video_path)
        try:
            if not cap.isOpened():
                raise ValueError(f"Failed to open video file: {video_path}")

            orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = float(cap.get(cv2.CAP_PROP_FPS))
            if fps <= 0:
                fps = 25.0  # fallback default

            duration = total_frames / fps if fps > 0 else 0.0

            frame_indices = self._determine_frame_indices(total_frames, fps, duration)
            if not frame_indices:
                raise ValueError("No frames could be indexed from the input video.")

            extracted_tensors: List[np.ndarray] = []
            frame_metadata_list: List[VideoFrameMetadata] = []

            # Set of indices to extract
            target_set = set(frame_indices)
            current_frame = 0

            # Read sequentially or seek
            while cap.isOpened() and len(extracted_tensors) < len(frame_indices):
                ret, frame_bgr = cap.read()
                if not ret:
                    break

                if current_frame in target_set:
                    # Convert BGR (OpenCV) to RGB (PIL)
                    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(frame_rgb)

                    processed: ProcessedImage = self.image_preprocessor.process(pil_img)
                    extracted_tensors.append(processed.tensor)

                    timestamp = current_frame / fps if fps > 0 else 0.0
                    frame_metadata_list.append(
                        VideoFrameMetadata(
                            frame_index=current_frame,
                            timestamp_seconds=round(timestamp, 3),
                            original_size=(orig_w, orig_h),
                            scale_factor=processed.scale_factor,
                            pad_offsets=processed.pad_offsets,
                        )
                    )

                current_frame += 1

            if not extracted_tensors:
                raise ValueError("Failed to decode video frames.")

            # Stack frames into (T, C, H, W)
            video_tensor = np.stack(extracted_tensors, axis=0).astype(np.float32)

            return ProcessedVideo(
                tensor=video_tensor,
                frame_count=len(extracted_tensors),
                original_fps=fps,
                duration_seconds=round(duration, 3),
                original_resolution=(orig_w, orig_h),
                target_resolution=self.target_size,
                frame_metadata=frame_metadata_list,
                has_audio_track=False,
                metadata_tags={
                    "total_stream_frames": total_frames,
                    "sampled_indices": [m.frame_index for m in frame_metadata_list],
                    "sampling_strategy": self.sampling_strategy.value,
                },
            )

        finally:
            cap.release()
            if temp_file_created and os.path.exists(video_path):
                try:
                    os.remove(video_path)
                except Exception:
                    pass
