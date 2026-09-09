"""
TruthLens - Forensic Data Pipeline & Benchmark Dataset Ingestion Module
Author: Pratham Yadav (Deep Learning & Computer Vision Lead)
Sprint 1: Benchmark Assembly & Ingestion API (User Story 1)
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

try:
    from .validator import (
        PreprocessingValidator,
        ValidationResult,
        ValidationIssue,
        ValidationSeverity,
        DatasetStatistics,
        ValidationSummary,
    )
    __all__.extend([
        "PreprocessingValidator",
        "ValidationResult",
        "ValidationIssue",
        "ValidationSeverity",
        "DatasetStatistics",
        "ValidationSummary",
    ])
except ImportError:
    pass
