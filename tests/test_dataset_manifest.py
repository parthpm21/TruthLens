"""
TruthLens - Unit Tests for Dataset Manifest & Benchmark Curation
Sprint 1: Defined test cases for benchmark assembly & manifest profiling
"""

import json
import os
import tempfile
import pytest

from backend.data.dataset_manifest import (
    BenchmarkSample,
    DatasetManifest,
    GeneratorSource,
    ManipulationCategory,
    MediaType,
    Verdict,
)


@pytest.mark.unit
class TestDatasetManifest:
    """Test suite for dataset manifest models, filtering, statistics, and serialization."""

    def test_benchmark_sample_serialization(self):
        sample = BenchmarkSample(
            id="SMP_001",
            file_path="samples/test.jpg",
            media_type=MediaType.IMAGE,
            verdict=Verdict.AUTHENTIC,
            manipulation_category=ManipulationCategory.NONE,
            generator_source=GeneratorSource.REAL_CAMERA,
            label=0,
            resolution=(1920, 1080),
        )

        d = sample.to_dict()
        assert d["id"] == "SMP_001"
        assert d["media_type"] == "image"
        assert d["verdict"] == "authentic"

        restored = BenchmarkSample.from_dict(d)
        assert restored.id == sample.id
        assert restored.media_type == MediaType.IMAGE
        assert restored.verdict == Verdict.AUTHENTIC

    def test_manifest_add_and_filter(self, sample_benchmark_manifest: DatasetManifest):
        manifest = sample_benchmark_manifest

        # Filter by media type
        images = manifest.filter_by_media_type(MediaType.IMAGE)
        videos = manifest.filter_by_media_type(MediaType.VIDEO)
        assert len(images) == 2
        assert len(videos) == 1

        # Filter by verdict
        authentics = manifest.filter_by_verdict(Verdict.AUTHENTIC)
        manipulated = manifest.filter_by_verdict(Verdict.MANIPULATED)
        assert len(authentics) == 1
        assert len(manipulated) == 2

        # Filter by generator source
        midjourney = manifest.filter_by_source(GeneratorSource.MIDJOURNEY)
        assert len(midjourney) == 1
        assert midjourney[0].id == "TEST_002"

    def test_summary_statistics(self, sample_benchmark_manifest: DatasetManifest):
        stats = sample_benchmark_manifest.get_summary_statistics()

        assert stats["total_samples"] == 3
        assert stats["authentic_samples"] == 1
        assert stats["manipulated_samples"] == 2
        assert stats["image_count"] == 2
        assert stats["video_count"] == 1
        assert stats["source_distribution"][GeneratorSource.MIDJOURNEY.value] == 1

    def test_json_save_and_load(self, sample_benchmark_manifest: DatasetManifest):
        fd, tmp_json = tempfile.mkstemp(suffix=".json")
        os.close(fd)

        try:
            sample_benchmark_manifest.save_to_json(tmp_json)
            assert os.path.exists(tmp_json)

            loaded = DatasetManifest.load_from_json(tmp_json)
            assert len(loaded.samples) == len(sample_benchmark_manifest.samples)
            assert loaded.name == sample_benchmark_manifest.name
        finally:
            if os.path.exists(tmp_json):
                os.remove(tmp_json)

    def test_csv_export(self, sample_benchmark_manifest: DatasetManifest):
        fd, tmp_csv = tempfile.mkstemp(suffix=".csv")
        os.close(fd)

        try:
            sample_benchmark_manifest.export_to_csv(tmp_csv)
            assert os.path.exists(tmp_csv)
            with open(tmp_csv, "r", encoding="utf-8") as f:
                lines = f.readlines()
                assert len(lines) == 4  # Header + 3 samples
        finally:
            if os.path.exists(tmp_csv):
                os.remove(tmp_csv)
