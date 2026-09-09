"""
TruthLens - Pytest Fixtures & Shared Test Configuration
Author: Pratham Yadav & Backend Test Engineering
Sprint 1: Test-framework setup for the ingestion gateway
"""

from __future__ import annotations

import io
import os
import tempfile
from typing import Generator
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from backend.data.dataset_manifest import (
    BenchmarkSample,
    DatasetManifest,
    GeneratorSource,
    ManipulationCategory,
    MediaType,
    Verdict,
)
from backend.gateway.app import create_app


@pytest.fixture(scope="session")
def app():
    """Create a FastAPI test application instance."""
    return create_app()


@pytest.fixture(scope="session")
def client(app) -> Generator[TestClient, None, None]:
    """Provide a TestClient for making HTTP requests to the FastAPI ingestion gateway."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_rgb_image() -> Image.Image:
    """Generate a standard 300x200 synthetic RGB test image."""
    arr = np.zeros((200, 300, 3), dtype=np.uint8)
    # Add colored rectangles
    arr[:100, :150] = [255, 0, 0]      # Red quadrant
    arr[:100, 150:] = [0, 255, 0]      # Green quadrant
    arr[100:, :150] = [0, 0, 255]      # Blue quadrant
    arr[100:, 150:] = [255, 255, 0]    # Yellow quadrant
    return Image.fromarray(arr, mode="RGB")


@pytest.fixture
def sample_rgb_bytes(sample_rgb_image: Image.Image) -> bytes:
    """Return PNG byte stream of sample RGB image."""
    buf = io.BytesIO()
    sample_rgb_image.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def sample_rgba_image() -> Image.Image:
    """Generate a 200x200 RGBA image with alpha channel transparency."""
    arr = np.zeros((200, 200, 4), dtype=np.uint8)
    arr[:, :, :3] = 180
    arr[:, :, 3] = 128  # Semi-transparent
    return Image.fromarray(arr, mode="RGBA")


@pytest.fixture
def sample_grayscale_image() -> Image.Image:
    """Generate a 150x150 Grayscale image."""
    arr = np.linspace(0, 255, 150 * 150, dtype=np.uint8).reshape(150, 150)
    return Image.fromarray(arr, mode="L")


@pytest.fixture
def sample_exif_image_bytes() -> bytes:
    """Generate a JPEG image with simulated EXIF software metadata."""
    img = Image.new("RGB", (256, 256), color=(200, 100, 50))
    exif_obj = img.getexif()
    # 305 is Software tag in EXIF standard
    exif_obj[305] = "Adobe Photoshop 2026.1 (Macintosh)"
    exif_obj[271] = "Canon"  # Make
    exif_obj[272] = "Canon EOS R5"  # Model

    buf = io.BytesIO()
    img.save(buf, format="JPEG", exif=exif_obj)
    return buf.getvalue()


@pytest.fixture
def sample_synthetic_video_path() -> Generator[str, None, None]:
    """
    Synthesize a valid 24-frame (1-second, 24fps) MP4 video on disk using OpenCV.
    Yields the temporary file path and removes it after test execution.
    """
    fd, temp_path = tempfile.mkstemp(suffix=".mp4")
    os.close(fd)

    width, height = 320, 240
    fps = 24.0
    num_frames = 24

    # Use mp4v or avc1 fourcc
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))

    for i in range(num_frames):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Draw moving circular pattern
        cx = int(40 + (i / num_frames) * (width - 80))
        cy = int(height / 2)
        cv2.circle(frame, (cx, cy), 30, (0, 255, 255), -1)
        cv2.putText(
            frame,
            f"F:{i}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
        )
        out.write(frame)

    out.release()
    yield temp_path

    if os.path.exists(temp_path):
        try:
            os.remove(temp_path)
        except Exception:
            pass


@pytest.fixture
def sample_synthetic_video_bytes(sample_synthetic_video_path: str) -> bytes:
    """Return raw byte content of the synthetic test MP4 video."""
    with open(sample_synthetic_video_path, "rb") as f:
        return f.read()


@pytest.fixture
def sample_benchmark_manifest() -> DatasetManifest:
    """Construct an in-memory DatasetManifest with balanced test samples."""
    manifest = DatasetManifest(name="TruthLens-Unit-Test-Manifest")

    manifest.add_sample(
        BenchmarkSample(
            id="TEST_001",
            file_path="tests/data/real_sample.jpg",
            media_type=MediaType.IMAGE,
            verdict=Verdict.AUTHENTIC,
            manipulation_category=ManipulationCategory.NONE,
            generator_source=GeneratorSource.REAL_CAMERA,
            label=0,
            resolution=(1920, 1080),
        )
    )
    manifest.add_sample(
        BenchmarkSample(
            id="TEST_002",
            file_path="tests/data/fake_sample.png",
            media_type=MediaType.IMAGE,
            verdict=Verdict.MANIPULATED,
            manipulation_category=ManipulationCategory.GENERATIVE_DIFFUSION,
            generator_source=GeneratorSource.MIDJOURNEY,
            label=1,
            resolution=(1024, 1024),
        )
    )
    manifest.add_sample(
        BenchmarkSample(
            id="TEST_003",
            file_path="tests/data/fake_video.mp4",
            media_type=MediaType.VIDEO,
            verdict=Verdict.MANIPULATED,
            manipulation_category=ManipulationCategory.FACE_SWAP,
            generator_source=GeneratorSource.FF_DEEPFAKES,
            label=1,
            resolution=(1280, 720),
        )
    )

    return manifest
