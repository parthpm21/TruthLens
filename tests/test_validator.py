"""
TruthLens - Unit Tests for Media & Benchmark Validator
Sprint 1: Defined test cases for data quality & manifest consistency
"""

import os
import tempfile
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
from backend.data.validator import (
    PreprocessingValidator,
    ValidationResult,
    ValidationSeverity,
    ValidationSummary,
)


@pytest.mark.unit
class TestPreprocessingValidator:
    """Test suite for media file integrity, resolution bounds, and manifest consistency."""

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
        # Inconsistent sample: label 0 (authentic) but marked MANIPULATED
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
