"""
TruthLens - Dataset Manifest & Benchmark Registry Endpoints
"""

from fastapi import APIRouter
from ...data.dataset_manifest import (
    BenchmarkSample,
    DatasetManifest,
    GeneratorSource,
    ManipulationCategory,
    MediaType,
    Verdict,
)
from ..schemas import ManifestSummaryResponse

router = APIRouter(prefix="/api/v1/manifest", tags=["Manifest"])


def _build_default_benchmark_manifest() -> DatasetManifest:
    """Construct an initial in-memory benchmark manifest for testing and profiling."""
    manifest = DatasetManifest(name="TruthLens-Core-Benchmark-v1.0")

    # Sample 1: Authentic Image
    manifest.add_sample(
        BenchmarkSample(
            id="IMG_AUTH_001",
            file_path="samples/authentic_portrait.jpg",
            media_type=MediaType.IMAGE,
            verdict=Verdict.AUTHENTIC,
            manipulation_category=ManipulationCategory.NONE,
            generator_source=GeneratorSource.REAL_CAMERA,
            label=0,
            resolution=(1920, 1080),
            compression_quality="raw",
        )
    )

    # Sample 2: Diffusion Synthetic Image
    manifest.add_sample(
        BenchmarkSample(
            id="IMG_DIFF_002",
            file_path="samples/midjourney_v6_face.png",
            media_type=MediaType.IMAGE,
            verdict=Verdict.MANIPULATED,
            manipulation_category=ManipulationCategory.GENERATIVE_DIFFUSION,
            generator_source=GeneratorSource.MIDJOURNEY,
            label=1,
            resolution=(1024, 1024),
            compression_quality="raw",
        )
    )

    # Sample 3: Video FaceForensics Deepfake
    manifest.add_sample(
        BenchmarkSample(
            id="VID_FF_003",
            file_path="samples/ff_deepfakes_clip.mp4",
            media_type=MediaType.VIDEO,
            verdict=Verdict.MANIPULATED,
            manipulation_category=ManipulationCategory.FACE_SWAP,
            generator_source=GeneratorSource.FF_DEEPFAKES,
            label=1,
            resolution=(1280, 720),
            compression_quality="c23",
        )
    )

    # Sample 4: Spliced Document
    manifest.add_sample(
        BenchmarkSample(
            id="IMG_SPLICE_004",
            file_path="samples/invoice_spliced.jpg",
            media_type=MediaType.IMAGE,
            verdict=Verdict.MANIPULATED,
            manipulation_category=ManipulationCategory.SPLICING,
            generator_source=GeneratorSource.REAL_CAMERA,
            label=1,
            resolution=(2480, 3508),
            compression_quality="raw",
        )
    )

    return manifest


_GLOBAL_MANIFEST = _build_default_benchmark_manifest()


@router.get("/summary", response_model=ManifestSummaryResponse)
async def get_manifest_summary() -> ManifestSummaryResponse:
    """Return benchmark dataset distribution metrics and source counts."""
    stats = _GLOBAL_MANIFEST.get_summary_statistics()
    return ManifestSummaryResponse(**stats)
