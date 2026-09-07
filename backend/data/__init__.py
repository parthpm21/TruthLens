"""
TruthLens - Forensic Data Pipeline & Benchmark Dataset Ingestion Module
Part of Pratham Yadav's User Story 1 (Benchmark Assembly & Curation Engine)
"""

from .dataset_manifest import (
    MediaType,
    Verdict,
    ManipulationCategory,
    GeneratorSource,
    BenchmarkSample,
    DatasetManifest,
)

__all__ = [
    "MediaType",
    "Verdict",
    "ManipulationCategory",
    "GeneratorSource",
    "BenchmarkSample",
    "DatasetManifest",
]

try:
    from .image_preprocessor import (
        ImagePreprocessor,
        ProcessedImage,
        NormalizationMode,
        ResizeMode,
    )
    __all__.extend([
        "ImagePreprocessor",
        "ProcessedImage",
        "NormalizationMode",
        "ResizeMode",
    ])
except ImportError:
    pass

try:
    from .video_preprocessor import (
        VideoPreprocessor,
        ProcessedVideo,
        VideoFrameMetadata,
        SamplingStrategy,
    )
    __all__.extend([
        "VideoPreprocessor",
        "ProcessedVideo",
        "VideoFrameMetadata",
        "SamplingStrategy",
    ])
except ImportError:
    pass

