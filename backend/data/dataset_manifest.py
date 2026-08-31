"""
TruthLens - Dataset Manifest & Benchmark Curation Schema
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1)

This module provides data models, manifest parsing, labeling validation, and dataset 
profiling for multi-source authentic vs synthetic image/video benchmarks (GANs, Diffusion, FaceForensics++).
"""

from __future__ import annotations

import csv
import json
import os
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class Verdict(str, Enum):
    AUTHENTIC = "authentic"
    MANIPULATED = "manipulated"
    UNCERTAIN = "uncertain"


class ManipulationCategory(str, Enum):
    NONE = "none"
    FACE_SWAP = "face_swap"
    INPAINTING = "inpainting"
    GENERATIVE_DIFFUSION = "generative_diffusion"
    GENERATIVE_GAN = "generative_gan"
    SPLICING = "splicing"
    AUDIO_VIDEO_MISALIGNMENT = "audio_video_misalignment"


class GeneratorSource(str, Enum):
    REAL_CAMERA = "real_camera"
    STYLEGAN2 = "stylegan2"
    PROGAN = "progan"
    STABLE_DIFFUSION_V1 = "stable_diffusion_v1"
    STABLE_DIFFUSION_XL = "stable_diffusion_xl"
    MIDJOURNEY = "midjourney"
    DALL_E_3 = "dall_e_3"
    FLUX = "flux"
    FF_DEEPFAKES = "faceforensics_deepfakes"
    FF_FACE2FACE = "faceforensics_face2face"
    FF_FACESWAP = "faceforensics_faceswap"
    FF_NEURALTEXTURES = "faceforensics_neuraltextures"
    CELEB_DF = "celeb_df"
    DFDC = "dfdc"
    UNKNOWN = "unknown"


@dataclass
class BenchmarkSample:
    """Represents a single curated benchmark data point (Image or Video clip)."""
    id: str
    file_path: str
    media_type: MediaType
    verdict: Verdict
    manipulation_category: ManipulationCategory
    generator_source: GeneratorSource
    label: int  # 0 for authentic, 1 for manipulated
    resolution: Tuple[int, int] = (0, 0)  # (width, height)
    compression_quality: Optional[str] = "raw"  # e.g., 'raw', 'c23', 'c40'
    ground_truth_mask_path: Optional[str] = None
    metadata_tags: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert sample to dictionary format for JSON serialization."""
        data = asdict(self)
        data["media_type"] = self.media_type.value
        data["verdict"] = self.verdict.value
        data["manipulation_category"] = self.manipulation_category.value
        data["generator_source"] = self.generator_source.value
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> BenchmarkSample:
        """Create sample instance from dictionary."""
        return cls(
            id=str(data["id"]),
            file_path=str(data["file_path"]),
            media_type=MediaType(data["media_type"]),
            verdict=Verdict(data["verdict"]),
            manipulation_category=ManipulationCategory(data["manipulation_category"]),
            generator_source=GeneratorSource(data["generator_source"]),
            label=int(data["label"]),
            resolution=tuple(data.get("resolution", (0, 0))),  # type: ignore
            compression_quality=data.get("compression_quality", "raw"),
            ground_truth_mask_path=data.get("ground_truth_mask_path"),
            metadata_tags=data.get("metadata_tags", {}),
        )


class DatasetManifest:
    """
    Manages collection, filtering, validation, and serialization of benchmark datasets.
    """

    def __init__(self, name: str = "TruthLens-Benchmark-v1.0") -> None:
        self.name = name
        self.samples: List[BenchmarkSample] = []

    def add_sample(self, sample: BenchmarkSample) -> None:
        """Add a curated benchmark sample to the manifest."""
        self.samples.append(sample)

    def filter_by_media_type(self, media_type: MediaType) -> List[BenchmarkSample]:
        """Return only samples matching the given media type (image or video)."""
        return [s for s in self.samples if s.media_type == media_type]

    def filter_by_source(self, source: GeneratorSource) -> List[BenchmarkSample]:
        """Filter samples by generator origin (e.g. Midjourney, StyleGAN2, FF++)."""
        return [s for s in self.samples if s.generator_source == source]

    def filter_by_verdict(self, verdict: Verdict) -> List[BenchmarkSample]:
        """Filter samples by ground truth verdict (authentic vs manipulated)."""
        return [s for s in self.samples if s.verdict == verdict]

    def get_summary_statistics(self) -> Dict[str, Any]:
        """Generate high-level dataset distribution metrics."""
        total = len(self.samples)
        if total == 0:
            return {"total_samples": 0}

        authentic_count = sum(1 for s in self.samples if s.label == 0)
        manipulated_count = sum(1 for s in self.samples if s.label == 1)
        image_count = sum(1 for s in self.samples if s.media_type == MediaType.IMAGE)
        video_count = sum(1 for s in self.samples if s.media_type == MediaType.VIDEO)

        source_distribution: Dict[str, int] = {}
        category_distribution: Dict[str, int] = {}

        for s in self.samples:
            source_distribution[s.generator_source.value] = (
                source_distribution.get(s.generator_source.value, 0) + 1
            )
            category_distribution[s.manipulation_category.value] = (
                category_distribution.get(s.manipulation_category.value, 0) + 1
            )

        return {
            "manifest_name": self.name,
            "total_samples": total,
            "authentic_samples": authentic_count,
            "manipulated_samples": manipulated_count,
            "authentic_ratio": round(authentic_count / total, 4),
            "manipulated_ratio": round(manipulated_count / total, 4),
            "image_count": image_count,
            "video_count": video_count,
            "source_distribution": source_distribution,
            "category_distribution": category_distribution,
        }

    def save_to_json(self, output_path: str | Path) -> None:
        """Serialize benchmark manifest to a formatted JSON file."""
        payload = {
            "manifest_name": self.name,
            "summary": self.get_summary_statistics(),
            "samples": [s.to_dict() for s in self.samples],
        }
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    @classmethod
    def load_from_json(cls, json_path: str | Path) -> DatasetManifest:
        """Load manifest from JSON file."""
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        manifest = cls(name=data.get("manifest_name", "TruthLens-Benchmark"))
        for item in data.get("samples", []):
            manifest.add_sample(BenchmarkSample.from_dict(item))
        return manifest

    def export_to_csv(self, csv_path: str | Path) -> None:
        """Export sample index to CSV for training pipelines and tabular analysis."""
        Path(csv_path).parent.mkdir(parents=True, exist_ok=True)
        fieldnames = [
            "id",
            "file_path",
            "media_type",
            "verdict",
            "manipulation_category",
            "generator_source",
            "label",
            "width",
            "height",
            "compression_quality",
            "ground_truth_mask_path",
        ]
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for s in self.samples:
                writer.writerow(
                    {
                        "id": s.id,
                        "file_path": s.file_path,
                        "media_type": s.media_type.value,
                        "verdict": s.verdict.value,
                        "manipulation_category": s.manipulation_category.value,
                        "generator_source": s.generator_source.value,
                        "label": s.label,
                        "width": s.resolution[0],
                        "height": s.resolution[1],
                        "compression_quality": s.compression_quality,
                        "ground_truth_mask_path": s.ground_truth_mask_path or "",
                    }
                )
