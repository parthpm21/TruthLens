"""
TruthLens - Unit Tests for Media & Benchmark Validator
Sprint 1: Defined test cases for data quality, tensor verification & manifest consistency
"""

import os
import tempfile
import numpy as np
import pytest
from PIL import Image

from backend.data.dataset_manifest import (
    BenchmarkSample,
    DatasetManifest,
    GeneratorSource,
    ManipulationCategory,
    MediaType,
    Verdict,
)
from backend.data.image_preprocessor import NormalizationMode
from backend.data.validator import (
    DatasetStatistics,
    PreprocessingValidator,
    ValidationResult,
    ValidationSeverity,
    ValidationSummary,
)


@pytest.mark.unit
class TestPreprocessingValidator:
    """Test suite for media file integrity, tensor validation, resolution bounds, and manifest consistency."""

    def test_validate_valid_image(self, sample_rgb_image: Image.Image):
        fd, tmp_img = tempfile.mkstemp(suffix=".png")
        os.close(fd)
        try:
            sample_rgb_image.save(tmp_img)
            validator = PreprocessingValidator()
            res: ValidationResult = validator.validate_image_file(tmp_img)
            assert res.is_valid is True
            assert res.resolution == (300, 200)
            assert res.file_size_bytes > 0
            assert len(res.issues) == 0
        finally:
            if os.path.exists(tmp_img):
                os.remove(tmp_img)

    def test_validate_nonexistent_image(self):
        validator = PreprocessingValidator()
        res = validator.validate_image_file("nonexistent_img.jpg")
        assert res.is_valid is False
        assert any(i.code == "FILE_NOT_FOUND" for i in res.issues)

    def test_validate_corrupted_image(self):
        fd, tmp_corrupt = tempfile.mkstemp(suffix=".jpg")
        with os.fdopen(fd, "wb") as f:
            f.write(b"NOT_A_REAL_JPEG_JUST_GARBAGE_BYTES_1234567890")

        try:
            validator = PreprocessingValidator()
            res = validator.validate_image_file(tmp_corrupt)
            assert res.is_valid is False
            assert any(i.code == "IMAGE_DECODE_FAILED" for i in res.issues)
        finally:
            if os.path.exists(tmp_corrupt):
                os.remove(tmp_corrupt)

    def test_validate_low_resolution_image(self):
        fd, tmp_tiny = tempfile.mkstemp(suffix=".png")
        os.close(fd)
        try:
            tiny_img = Image.new("RGB", (32, 32), color=(255, 0, 0))
            tiny_img.save(tmp_tiny)

            validator = PreprocessingValidator(min_resolution=(64, 64))
            res = validator.validate_image_file(tmp_tiny)
            assert res.is_valid is False
            assert any(i.code == "RESOLUTION_TOO_LOW" for i in res.issues)
        finally:
            if os.path.exists(tmp_tiny):
                os.remove(tmp_tiny)

    def test_validate_valid_video(self, sample_synthetic_video_path: str):
        validator = PreprocessingValidator()
        res = validator.validate_video_file(sample_synthetic_video_path)
        assert res.is_valid is True
        assert res.resolution == (320, 240)
        assert res.metadata["total_frames"] == 24

    def test_validate_manifest_consistency(self):
        manifest = DatasetManifest(name="Consistency-Test")
        inconsistent_sample = BenchmarkSample(
            id="INCON_01",
            file_path="fake_path.jpg",
            media_type=MediaType.IMAGE,
            verdict=Verdict.MANIPULATED,
            manipulation_category=ManipulationCategory.FACE_SWAP,
            generator_source=GeneratorSource.FF_DEEPFAKES,
            label=0,  # Label 0 contradicts manipulated verdict
        )
        manifest.add_sample(inconsistent_sample)

        validator = PreprocessingValidator()
        summary: ValidationSummary = validator.validate_manifest(manifest)
        assert summary.overall_valid is False
        assert summary.failed_count == 1
        assert any(i.code == "LABEL_VERDICT_MISMATCH" for i in summary.results[0].issues)

    def test_validate_tensor_valid(self):
        validator = PreprocessingValidator()
        # 3D tensor: (3, 224, 224) with values in [0.0, 1.0]
        tensor = np.random.uniform(0.0, 1.0, (3, 224, 224)).astype(np.float32)
        res = validator.validate_tensor(tensor, norm_mode=NormalizationMode.ZERO_TO_ONE)
        assert res.is_valid is True
        assert res.metrics["ndim"] == 3
        assert res.metrics["min_val"] >= 0.0
        assert res.metrics["max_val"] <= 1.0

        # 4D batched tensor: (2, 3, 224, 224)
        batched = np.random.uniform(0.0, 1.0, (2, 3, 224, 224)).astype(np.float32)
        res_batch = validator.validate_tensor(batched, norm_mode=NormalizationMode.ZERO_TO_ONE)
        assert res_batch.is_valid is True
        assert res_batch.metrics["ndim"] == 4

    def test_validate_tensor_invalid_rank_and_channel(self):
        validator = PreprocessingValidator()
        # 2D tensor is invalid rank
        res_2d = validator.validate_tensor(np.zeros((224, 224)))
        assert res_2d.is_valid is False
        assert any(i.code == "INVALID_TENSOR_RANK" for i in res_2d.issues)

        # 1-channel grayscale tensor where 3 is expected
        res_c1 = validator.validate_tensor(np.zeros((1, 224, 224)))
        assert res_c1.is_valid is False
        assert any(i.code == "CHANNEL_MISMATCH" for i in res_c1.issues)

    def test_validate_tensor_nan_and_inf(self):
        validator = PreprocessingValidator()
        arr = np.ones((3, 64, 64), dtype=np.float32)
        arr[0, 0, 0] = np.nan
        res = validator.validate_tensor(arr)
        assert res.is_valid is False
        assert any(i.code == "TENSOR_CONTAINS_NAN" for i in res.issues)

        arr[0, 0, 0] = np.inf
        res_inf = validator.validate_tensor(arr)
        assert res_inf.is_valid is False
        assert any(i.code == "TENSOR_CONTAINS_INF" for i in res_inf.issues)

    def test_validate_tensor_range_bounds(self):
        validator = PreprocessingValidator()
        # Out of bounds for [0.0, 1.0]
        out_of_bounds = np.ones((3, 32, 32), dtype=np.float32) * 2.5
        res = validator.validate_tensor(out_of_bounds, norm_mode=NormalizationMode.ZERO_TO_ONE)
        assert res.is_valid is False
        assert any(i.code == "OUT_OF_BOUNDS_ZERO_TO_ONE" for i in res.issues)

    def test_statistical_summary_real_vs_fake_balance(self):
        samples = [
            BenchmarkSample(
                id="S1",
                file_path="s1.jpg",
                media_type=MediaType.IMAGE,
                verdict=Verdict.AUTHENTIC,
                manipulation_category=ManipulationCategory.NONE,
                generator_source=GeneratorSource.REAL_CAMERA,
                label=0,
                resolution=(1920, 1080),
            ),
            BenchmarkSample(
                id="S2",
                file_path="s2.jpg",
                media_type=MediaType.IMAGE,
                verdict=Verdict.MANIPULATED,
                manipulation_category=ManipulationCategory.GENERATIVE_DIFFUSION,
                generator_source=GeneratorSource.MIDJOURNEY,
                label=1,
                resolution=(1024, 1024),
            ),
        ]
        validator = PreprocessingValidator()
        stats: DatasetStatistics = validator.generate_statistical_summary(samples)
        assert stats.total_samples == 2
        assert stats.authentic_count == 1
        assert stats.manipulated_count == 1
        assert stats.authentic_ratio == 0.5
        assert stats.manipulated_ratio == 0.5
        assert stats.resolution_spread["min_resolution"] == (1024, 1024)
        assert stats.resolution_spread["max_resolution"] == (1920, 1080)
