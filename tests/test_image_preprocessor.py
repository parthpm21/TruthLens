"""
TruthLens - Unit Tests for Image Preprocessor Pipeline
Sprint 1: Defined test cases for image/video preprocessing
"""

import numpy as np
import pytest
from PIL import Image

from backend.data.image_preprocessor import (
    ImagePreprocessor,
    NormalizationMode,
    ProcessedImage,
    ResizeMode,
)


@pytest.mark.unit
class TestImagePreprocessor:
    """Test suite for forensic image loading, resizing, normalization, and feature extraction."""

    def test_load_image_from_pil(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor()
        loaded = preprocessor.load_image(sample_rgb_image)
        assert isinstance(loaded, Image.Image)
        assert loaded.mode == "RGB"
        assert loaded.size == (300, 200)

    def test_load_image_from_bytes(self, sample_rgb_bytes: bytes):
        preprocessor = ImagePreprocessor()
        loaded = preprocessor.load_image(sample_rgb_bytes)
        assert loaded.mode == "RGB"
        assert loaded.size == (300, 200)

    def test_load_image_from_rgba(self, sample_rgba_image: Image.Image):
        preprocessor = ImagePreprocessor()
        loaded = preprocessor.load_image(sample_rgba_image)
        # Should convert cleanly to 3-channel RGB
        assert loaded.mode == "RGB"
        assert loaded.size == (200, 200)

    def test_load_image_from_grayscale(self, sample_grayscale_image: Image.Image):
        preprocessor = ImagePreprocessor()
        loaded = preprocessor.load_image(sample_grayscale_image)
        assert loaded.mode == "RGB"
        assert loaded.size == (150, 150)

    def test_load_image_from_numpy(self):
        preprocessor = ImagePreprocessor()
        arr_rgb = np.full((100, 100, 3), 128, dtype=np.uint8)
        loaded = preprocessor.load_image(arr_rgb)
        assert loaded.mode == "RGB"
        assert loaded.size == (100, 100)

    def test_invalid_input_type_raises_typeerror(self):
        preprocessor = ImagePreprocessor()
        with pytest.raises(TypeError):
            preprocessor.load_image(12345)  # type: ignore

    def test_invalid_numpy_shape_raises_valueerror(self):
        preprocessor = ImagePreprocessor()
        invalid_arr = np.zeros((10, 10, 5), dtype=np.uint8)
        with pytest.raises(ValueError, match="Unsupported numpy image shape"):
            preprocessor.load_image(invalid_arr)

    def test_letterbox_resize_preserves_aspect_ratio(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(
            target_size=(224, 224),
            resize_mode=ResizeMode.LETTERBOX,
        )
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)

        assert processed.target_size == (224, 224)
        assert processed.tensor.shape == (3, 224, 224)
        assert processed.original_size == (300, 200)
        # Top/bottom padding should be present since 300:200 is wider than 1:1
        top, bottom, left, right = processed.pad_offsets
        assert top > 0 or bottom > 0

    def test_center_crop_resize(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(
            target_size=(224, 224),
            resize_mode=ResizeMode.CENTER_CROP,
        )
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)

        assert processed.tensor.shape == (3, 224, 224)
        assert processed.pad_offsets == (0, 0, 0, 0)

    def test_direct_resize(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(
            target_size=(256, 256),
            resize_mode=ResizeMode.DIRECT,
        )
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)
        assert processed.tensor.shape == (3, 256, 256)
        assert processed.pad_offsets == (0, 0, 0, 0)

    def test_imagenet_normalization(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(
            target_size=(224, 224),
            normalization=NormalizationMode.IMAGENET,
        )
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)
        # Mean should not be strictly bounded by [0, 1] after ImageNet normalization
        assert processed.tensor.dtype == np.float32
        assert processed.tensor.min() < 0.0 or processed.tensor.max() > 1.0

    def test_zero_to_one_normalization(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(
            target_size=(224, 224),
            normalization=NormalizationMode.ZERO_TO_ONE,
        )
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)
        assert processed.tensor.min() >= 0.0
        assert processed.tensor.max() <= 1.0

    def test_minus_one_to_one_normalization(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(
            target_size=(224, 224),
            normalization=NormalizationMode.MINUS_ONE_TO_ONE,
        )
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)
        assert processed.tensor.min() >= -1.0 - 1e-5
        assert processed.tensor.max() <= 1.0 + 1e-5

    def test_exif_extraction_and_editing_detection(self, sample_exif_image_bytes: bytes):
        preprocessor = ImagePreprocessor()
        processed: ProcessedImage = preprocessor.process(sample_exif_image_bytes)

        assert processed.exif_present is True
        assert "Software" in processed.exif_data or "305" in processed.exif_data
        assert processed.exif_data.get("has_editing_signature") is True

    def test_noise_residual_extraction(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(
            target_size=(224, 224),
            extract_noise_residuals=True,
        )
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)
        assert processed.noise_residual is not None
        assert processed.noise_residual.shape == (224, 224)
        assert processed.noise_residual.min() >= 0.0
        assert processed.noise_residual.max() <= 1.0

    def test_batch_dimension_expansion(self, sample_rgb_image: Image.Image):
        preprocessor = ImagePreprocessor(target_size=(224, 224))
        processed: ProcessedImage = preprocessor.process(sample_rgb_image)
        batch = processed.to_batch()
        assert batch.shape == (1, 3, 224, 224)
