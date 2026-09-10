"""
TruthLens — Benchmark Dataset Curation
Author: Parth Maheshwari
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1)

Curates and catalogs multi-source image + video benchmark samples
(GAN/diffusion synthetic images, FaceForensics++ manipulated video clips)
into a single structured manifest for the preprocessing gateway.
"""
from __future__ import annotations

import csv
import json
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
from typing import List, Optional


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"


class SourceGenerator(str, Enum):
    STYLEGAN2 = "stylegan2"
    STABLE_DIFFUSION = "stable_diffusion"
    MIDJOURNEY = "midjourney"
    REAL = "real"
    DEEPFAKES = "deepfakes"
    FACE2FACE = "face2face"
    FACESWAP = "faceswap"
    NEURALTEXTURES = "neuraltextures"


@dataclass
class BenchmarkSample:
    sample_id: str
    media_type: MediaType
    source_generator: SourceGenerator
    label: str  # "real" | "fake"
    file_path: str
    dataset_origin: str
    resolution: Optional[str] = None
    duration_seconds: Optional[float] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["media_type"] = self.media_type.value
        d["source_generator"] = self.source_generator.value
        return d


class BenchmarkCurator:
    IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    VIDEO_EXT = {".mp4", ".avi", ".mov", ".mkv"}

    def __init__(self, root_dir: str | Path):
        self.root_dir = Path(root_dir)
        self.samples: List[BenchmarkSample] = []

    def _scan(self, source_dir, exts, generator, label, origin, media_type):
        source_dir = Path(source_dir)
        if not source_dir.exists():
            return 0
        n = 0
        for path in sorted(source_dir.rglob("*")):
            if path.suffix.lower() in exts:
                self.samples.append(BenchmarkSample(
                    sample_id=f"{generator.value}_{path.stem}",
                    media_type=media_type,
                    source_generator=generator,
                    label=label,
                    file_path=str(path),
                    dataset_origin=origin,
                ))
                n += 1
        return n

    def curate_images(self, source_dir, generator, label, origin):
        return self._scan(source_dir, self.IMAGE_EXT, generator, label, origin, MediaType.IMAGE)

    def curate_videos(self, source_dir, generator, label, origin):
        return self._scan(source_dir, self.VIDEO_EXT, generator, label, origin, MediaType.VIDEO)

    def curate_all(self) -> "BenchmarkCurator":
        self.curate_images(self.root_dir / "images/stylegan2", SourceGenerator.STYLEGAN2, "fake", "GenImage")
        self.curate_images(self.root_dir / "images/stable_diffusion", SourceGenerator.STABLE_DIFFUSION, "fake", "DiffusionDB")
        self.curate_images(self.root_dir / "images/real", SourceGenerator.REAL, "real", "FFHQ/COCO")
        self.curate_videos(self.root_dir / "video/deepfakes", SourceGenerator.DEEPFAKES, "fake", "FaceForensics++ c23")
        self.curate_videos(self.root_dir / "video/face2face", SourceGenerator.FACE2FACE, "fake", "FaceForensics++ c23")
        self.curate_videos(self.root_dir / "video/real", SourceGenerator.REAL, "real", "FaceForensics++ c23")
        return self

    def summary(self) -> dict:
        return {
            "total": len(self.samples),
            "images": len([s for s in self.samples if s.media_type == MediaType.IMAGE]),
            "videos": len([s for s in self.samples if s.media_type == MediaType.VIDEO]),
            "real": len([s for s in self.samples if s.label == "real"]),
            "fake": len([s for s in self.samples if s.label == "fake"]),
        }

    def write_manifest_json(self, out_path):
        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps([s.to_dict() for s in self.samples], indent=2))

    def write_manifest_csv(self, out_path):
        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.samples:
            return
        with out_path.open("w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(self.samples[0].to_dict().keys()))
            w.writeheader()
            for s in self.samples:
                w.writerow(s.to_dict())


if __name__ == "__main__":
    c = BenchmarkCurator("backend/data/benchmark_raw").curate_all()
    c.write_manifest_json("backend/data/benchmark_manifest.json")
    c.write_manifest_csv("backend/data/benchmark_manifest.csv")
    print(c.summary())