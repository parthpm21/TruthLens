"""
TruthLens - Unit Tests for Video Preprocessor Pipeline
Sprint 1: Defined test cases for image/video preprocessing & timestamp alignment
"""

import os
import numpy as np
import pytest

from backend.data.video_preprocessor import (
    ProcessedVideo,
    SamplingStrategy,
    VideoFrameMetadata,
    VideoPreprocessor,
)


@pytest.mark.unit
class TestVideoPreprocessor:
    """Test suite for temporal video decoding, sampling strategies, and tensor conversion."""

    def test_process_video_from_path(self, sample_synthetic_video_path: str):
        preprocessor = VideoPreprocessor(
            target_size=(112, 112),
            num_frames=8,
            sampling_strategy=SamplingStrategy.UNIFORM,
        )
        processed: ProcessedVideo = preprocessor.process(sample_synthetic_video_path)

        assert processed.frame_count == 8
        assert processed.tensor.shape == (8, 3, 112, 112)
        assert processed.original_fps == 24.0
        assert processed.duration_seconds > 0.0
        assert len(processed.frame_metadata) == 8

        # Check timestamp ordering
        timestamps = [m.timestamp_seconds for m in processed.frame_metadata]
        assert timestamps == sorted(timestamps)

    def test_process_video_from_bytes(self, sample_synthetic_video_bytes: bytes):
        preprocessor = VideoPreprocessor(
            target_size=(128, 128),
            num_frames=4,
            sampling_strategy=SamplingStrategy.UNIFORM,
        )
        processed: ProcessedVideo = preprocessor.process(sample_synthetic_video_bytes)

        assert processed.frame_count == 4
        assert processed.tensor.shape == (4, 3, 128, 128)

    def test_fps_sampling_strategy(self, sample_synthetic_video_path: str):
        preprocessor = VideoPreprocessor(
            target_size=(112, 112),
            sampling_strategy=SamplingStrategy.FPS,
            target_fps=12.0,  # Half the 24fps -> ~12 frames
        )
        processed: ProcessedVideo = preprocessor.process(sample_synthetic_video_path)

        assert processed.frame_count >= 1
        assert processed.tensor.shape[1:] == (3, 112, 112)

    def test_keyframe_sampling_strategy(self, sample_synthetic_video_path: str):
        preprocessor = VideoPreprocessor(
            target_size=(112, 112),
            num_frames=4,
            sampling_strategy=SamplingStrategy.KEYFRAME,
            keyframe_threshold=0.05,
        )
        processed: ProcessedVideo = preprocessor.process(sample_synthetic_video_path)
        assert processed.frame_count >= 1
        assert processed.tensor.shape[1:] == (3, 112, 112)

    def test_all_frames_sampling_strategy(self, sample_synthetic_video_path: str):
        preprocessor = VideoPreprocessor(
            target_size=(64, 64),
            sampling_strategy=SamplingStrategy.ALL,
            max_frames=10,
        )
        processed: ProcessedVideo = preprocessor.process(sample_synthetic_video_path)
        assert processed.frame_count == 10
        assert processed.tensor.shape == (10, 3, 64, 64)

    def test_to_batch_and_channel_first_temporal(self, sample_synthetic_video_path: str):
        preprocessor = VideoPreprocessor(
            target_size=(64, 64),
            num_frames=4,
        )
        processed: ProcessedVideo = preprocessor.process(sample_synthetic_video_path)

        # Batch expansion: (1, T, C, H, W)
        batch = processed.to_batch()
        assert batch.shape == (1, 4, 3, 64, 64)

        # 3D CNN representation: (C, T, H, W)
        c_first = processed.to_channel_first_temporal()
        assert c_first.shape == (3, 4, 64, 64)

    def test_to_analysis_frames_timestamp_alignment(self, sample_synthetic_video_path: str):
        preprocessor = VideoPreprocessor(
            target_size=(64, 64),
            num_frames=4,
        )
        processed: ProcessedVideo = preprocessor.process(sample_synthetic_video_path)
        analysis_frames = processed.to_analysis_frames(default_trust_score=92.5)

        assert len(analysis_frames) == 4
        for frame in analysis_frames:
            assert "timestamp" in frame
            assert "timestampSeconds" in frame
            assert "trustScore" in frame
            assert frame["trustScore"] == 92.5
            assert "frameIndex" in frame

    def test_nonexistent_file_raises_filenotfound(self):
        preprocessor = VideoPreprocessor()
        with pytest.raises(FileNotFoundError):
            preprocessor.process("nonexistent_fake_video.mp4")

    def test_invalid_type_raises_typeerror(self):
        preprocessor = VideoPreprocessor()
        with pytest.raises(TypeError):
            preprocessor.process(12345)  # type: ignore
