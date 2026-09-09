"""
TruthLens - Integration & API Endpoint Tests for FastAPI Ingestion Gateway
Sprint 1: Set up unit-testing framework for the FastAPI gateway
"""

import io
import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestFastAPIIngestionGateway:
    """Test suite for FastAPI gateway routes: health, media ingestion, validation, and manifest."""

    def test_health_endpoint(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "TruthLens Ingestion Gateway"
        assert data["engine_status"] == "ONLINE"
        assert "JPEG" in data["supported_image_formats"]
        assert "MP4" in data["supported_video_formats"]

    def test_ingest_image_endpoint_success(self, client: TestClient, sample_rgb_bytes: bytes):
        files = {"file": ("test_sample.png", sample_rgb_bytes, "image/png")}
        data = {
            "target_width": "224",
            "target_height": "224",
            "normalization": "imagenet",
            "resize_mode": "letterbox",
            "extract_noise_residuals": "true",
        }
        response = client.post("/api/v1/ingest/image", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["media_type"] == "image"
        assert payload["tensor_shape"] == [3, 224, 224]
        assert payload["noise_residual_present"] is True
        assert payload["processing_time_ms"] > 0

    def test_ingest_image_with_custom_normalization(self, client: TestClient, sample_rgb_bytes: bytes):
        files = {"file": ("test_custom.png", sample_rgb_bytes, "image/png")}
        data = {
            "target_width": "128",
            "target_height": "128",
            "normalization": "minus_one_to_one",
            "resize_mode": "center_crop",
        }
        response = client.post("/api/v1/ingest/image", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()
        assert payload["tensor_shape"] == [3, 128, 128]

    def test_ingest_image_empty_file_fails(self, client: TestClient):
        files = {"file": ("empty.jpg", b"", "image/jpeg")}
        response = client.post("/api/v1/ingest/image", files=files)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_ingest_video_endpoint_success(
        self, client: TestClient, sample_synthetic_video_bytes: bytes
    ):
        files = {"file": ("synthetic_clip.mp4", sample_synthetic_video_bytes, "video/mp4")}
        data = {
            "target_width": "112",
            "target_height": "112",
            "num_frames": "8",
            "sampling_strategy": "uniform",
            "normalization": "imagenet",
        }
        response = client.post("/api/v1/ingest/video", files=files, data=data)
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["media_type"] == "video"
        assert payload["tensor_shape"] == [8, 3, 112, 112]
        assert payload["frame_count"] == 8
        assert len(payload["frame_metadata"]) == 8

    def test_ingest_url_endpoint(self, client: TestClient):
        req_body = {
            "url": "https://example.com/media/sample_deepfake.mp4",
            "media_type": "video",
            "target_width": 224,
            "target_height": 224,
        }
        response = client.post("/api/v1/ingest/url", json=req_body)
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert payload["resolved_media_type"] == "video"

    def test_ingest_url_invalid_protocol(self, client: TestClient):
        req_body = {"url": "ftp://invalid-url.com/stream"}
        response = client.post("/api/v1/ingest/url", json=req_body)
        assert response.status_code == 400

    def test_validate_media_endpoint(self, client: TestClient, sample_rgb_bytes: bytes):
        files = {"file": ("valid_photo.png", sample_rgb_bytes, "image/png")}
        response = client.post("/api/v1/validate/media", files=files)
        assert response.status_code == 200
        payload = response.json()
        assert payload["is_valid"] is True
        assert payload["media_type"] == "image"
        assert payload["resolution"] == [300, 200]

    def test_manifest_summary_endpoint(self, client: TestClient):
        response = client.get("/api/v1/manifest/summary")
        assert response.status_code == 200
        payload = response.json()
        assert payload["total_samples"] >= 4
        assert payload["authentic_samples"] >= 1
        assert payload["manipulated_samples"] >= 3
        assert payload["image_count"] >= 3
        assert payload["video_count"] >= 1
