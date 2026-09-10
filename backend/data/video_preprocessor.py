"""
TruthLens - Video Ingestion & Temporal Preprocessing Pipeline
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1 - Part 3)

This module handles:
1. Multi-format video decoding and metadata extraction via OpenCV/Decord (duration, FPS, resolution, frame count).
2. Configurable frame sampling strategies (Uniform interval sampling, Fixed FPS, Keyframe histogram diff, All frames).
3. Timestamp alignment matching AnalysisResult.videoFrames specifications.
4. Frame-level preprocessing (letterbox/center-crop resizing and ImageNet/[-1,1] normalization).
5. Temporal tensor batching into (T, C, H, W) and (B, T, C, H, W) formats for 3D-CNNs & Video Transformers.
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
    UNIFORM = "uniform"                # Equidistant sampling across video duration (e.g., 16 frames)
    FPS = "fps"                        # Sample at target frame rate (e.g., 1 frame per second)
    ALL = "all"                        # Extract all available frames (up to max_frames limit)
    KEYFRAME = "keyframe"              # Scene-change detection via inter-frame color histogram peaks
    KEYFRAME_FIRST = "keyframe_first"  # Sample starting from keyframe intervals


@dataclass
class VideoFrameMetadata:
    """Metadata for an individual extracted video frame with timestamp alignment."""
    frame_index: int
    timestamp_seconds: float
    original_size: Tuple[int, int] = (0, 0)
    scale_factor: float = 1.0
    pad_offsets: Tuple[int, int, int, int] = (0, 0, 0, 0)
    is_keyframe: bool = False
    diff_score: float = 0.0

    def to_analysis_dict(self, default_trust_score: float = 95.0) -> Dict[str, Any]:
        """Convert frame metadata to the AnalysisResult.videoFrames schema."""
        mins = int(self.timestamp_seconds // 60)
        secs = int(self.timestamp_seconds % 60)
        return {
            "timestamp": f"{mins:02d}:{secs:02d}",
            "timestampSeconds": round(self.timestamp_seconds, 3),
            "trustScore": default_trust_score,
            "isKeyframe": self.is_keyframe,
            "frameIndex": self.frame_index,
            "scaleFactor": round(self.scale_factor, 4),
            "diffScore": round(self.diff_score, 4),
        }


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
    codec: str = "unknown"

    @property
    def tensor_batch(self) -> np.ndarray:
        """Alias for tensor (N, C, H, W) / (T, C, H, W)."""
        return self.tensor

    @property
    def frames_metadata(self) -> List[VideoFrameMetadata]:
        """Alias for frame_metadata."""
        return self.frame_metadata

    @property
    def num_extracted_frames(self) -> int:
        """Number of extracted frames in the tensor batch."""
        return len(self.frame_metadata)

    def to_batch(self) -> np.ndarray:
        """Return video tensor with batch dimension (1, T, C, H, W)."""
        return np.expand_dims(self.tensor, axis=0)

    def to_channel_first_temporal(self) -> np.ndarray:
        """Return video tensor in (C, T, H, W) format for PyTorch 3D-CNNs / I3D backbones."""
        return np.transpose(self.tensor, (1, 0, 2, 3))

    def to_analysis_frames(self, default_trust_score: float = 95.0) -> List[Dict[str, Any]]:
        """Return list matching AnalysisResult.videoFrames specification."""
        return [meta.to_analysis_dict(default_trust_score) for meta in self.frame_metadata]


class VideoPreprocessor:
    """
    Forensic-grade temporal video preprocessing and frame extraction engine.
    Supports OpenCV decoding with optional Decord acceleration.
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
        keyframe_threshold: float = 0.25,
    ) -> None:
        self.target_size = target_size
        self.num_frames = num_frames
        self.sampling_strategy = sampling_strategy
        self.target_fps = target_fps
        self.max_frames = max_frames
        self.normalization = normalization
        self.resize_mode = resize_mode
        self.keyframe_threshold = keyframe_threshold

        # Internal image preprocessor for per-frame transformation
        self.image_preprocessor = ImagePreprocessor(
            target_size=target_size,
            normalization=normalization,
            resize_mode=resize_mode,
            extract_noise_residuals=False,
        )

    def extract_video_info(self, video_path: Union[str, Path]) -> Dict[str, Any]:
        """Extract core video stream metadata using OpenCV."""
        path_str = str(video_path)
        if not os.path.isfile(path_str):
            raise FileNotFoundError(f"Video file not found: {path_str}")

        cap = cv2.VideoCapture(path_str)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video stream: {path_str}")

        try:
            fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
            fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC) or 0)
            codec = "".join([chr((fourcc_int >> 8 * i) & 0xFF) for i in range(4)]).strip() or "unknown"
            duration = (total_frames / fps) if fps > 0 else 0.0

            return {
                "fps": fps,
                "total_frames": total_frames,
                "duration_seconds": round(duration, 3),
                "resolution": (width, height),
                "codec": codec,
            }
        finally:
            cap.release()

    def _determine_frame_indices(
        self, total_frames: int, video_fps: float, duration: float
    ) -> List[int]:
        """Compute target frame indices to sample based on chosen SamplingStrategy."""
        if total_frames <= 0:
            return []

        if self.sampling_strategy == SamplingStrategy.UNIFORM:
            count = min(self.num_frames, total_frames)
            if count <= 1:
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
            if count <= 1:
                return [0]
            indices = [int(i * (total_frames / count)) for i in range(count)]
            return indices

        return list(range(min(total_frames, self.num_frames)))

    def _extract_keyframes(
        self, cap: cv2.VideoCapture, total_frames: int, fps: float
    ) -> Tuple[List[np.ndarray], List[VideoFrameMetadata]]:
        """Extract keyframes using inter-frame color histogram difference peaks."""
        frames: List[np.ndarray] = []
        metadata: List[VideoFrameMetadata] = []
        prev_hist: Optional[np.ndarray] = None
        idx = 0

        while cap.isOpened() and len(frames) < self.num_frames:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            # Calculate HSV histogram for scene-change / keyframe detection
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            hist = cv2.calcHist([hsv], [0, 1], None, [18, 25], [0, 180, 0, 256])
            hist = cv2.normalize(hist, hist).flatten()

            diff = 1.0
            if prev_hist is not None:
                diff = float(cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA))

            # Select frame if scene change exceeds threshold or first frame
            if prev_hist is None or diff >= self.keyframe_threshold:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(rgb_frame)
                timestamp = idx / fps if fps > 0 else 0.0
                metadata.append(
                    VideoFrameMetadata(
                        frame_index=idx,
                        timestamp_seconds=round(timestamp, 3),
                        is_keyframe=True,
                        diff_score=round(diff, 4),
                    )
                )

            prev_hist = hist
            idx += 1

        return frames, metadata

    def extract_frames(
        self, video_path: Union[str, Path]
    ) -> Tuple[List[np.ndarray], List[VideoFrameMetadata], Dict[str, Any]]:
        """
        Extract video frames and build aligned timestamp metadata.
        """
        info = self.extract_video_info(video_path)
        fps = info["fps"]
        total_frames = info["total_frames"]

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise ValueError(f"Failed to read video: {video_path}")

        frames: List[np.ndarray] = []
        metadata: List[VideoFrameMetadata] = []

        try:
            if self.sampling_strategy == SamplingStrategy.KEYFRAME:
                frames, metadata = self._extract_keyframes(cap, total_frames, fps)
            else:
                target_indices = set(self._determine_frame_indices(total_frames, fps, info["duration_seconds"]))
                current_idx = 0

                while cap.isOpened() and len(frames) < len(target_indices):
                    ret, frame_bgr = cap.read()
                    if not ret or frame_bgr is None:
                        break

                    if current_idx in target_indices:
                        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                        frames.append(rgb_frame)
                        timestamp = current_idx / fps if fps > 0 else 0.0
                        metadata.append(
                            VideoFrameMetadata(
                                frame_index=current_idx,
                                timestamp_seconds=round(timestamp, 3),
                                is_keyframe=False,
                            )
                        )
                    current_idx += 1
        finally:
            cap.release()

        if not frames:
            raise ValueError(f"No frames could be extracted from video: {video_path}")

        return frames, metadata, info

    def process(
        self,
        input_source: Union[str, Path, bytes],
    ) -> ProcessedVideo:
        """
        Extract and preprocess frames from a video file path or byte buffer into batched tensors.
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

        try:
            info = self.extract_video_info(video_path)
            fps = info["fps"]
            total_frames = info["total_frames"]
            orig_w, orig_h = info["resolution"]
            duration = info["duration_seconds"]

            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Failed to open video file: {video_path}")

            extracted_tensors: List[np.ndarray] = []
            frame_metadata_list: List[VideoFrameMetadata] = []

            try:
                if self.sampling_strategy == SamplingStrategy.KEYFRAME:
                    raw_frames, frame_metadata_list = self._extract_keyframes(cap, total_frames, fps)
                    for frame_rgb, meta in zip(raw_frames, frame_metadata_list):
                        pil_img = Image.fromarray(frame_rgb)
                        processed: ProcessedImage = self.image_preprocessor.process(pil_img)
                        extracted_tensors.append(processed.tensor)
                        meta.original_size = (orig_w, orig_h)
                        meta.scale_factor = processed.scale_factor
                        meta.pad_offsets = processed.pad_offsets
                else:
                    frame_indices = self._determine_frame_indices(total_frames, fps, duration)
                    if not frame_indices:
                        raise ValueError("No frames could be indexed from the input video.")

                    target_set = set(frame_indices)
                    current_frame = 0

                    while cap.isOpened() and len(extracted_tensors) < len(frame_indices):
                        ret, frame_bgr = cap.read()
                        if not ret:
                            break

                        if current_frame in target_set:
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
                                    is_keyframe=False,
                                )
                            )

                        current_frame += 1
            finally:
                cap.release()

            if not extracted_tensors:
                raise ValueError("Failed to decode video frames.")

            # Stack frames into (T, C, H, W) float32
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
                codec=info.get("codec", "unknown"),
            )

        finally:
            if temp_file_created and os.path.exists(video_path):
                try:
                    os.remove(video_path)
                except Exception:
                    pass
