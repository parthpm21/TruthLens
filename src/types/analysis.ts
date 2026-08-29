export interface AudioSyntheticSegment {
  startTime: number;
  endTime: number;
  confidence: number;
  anomalyType: string;
}

export interface AudioForensicsData {
  durationSeconds: number;
  sampleRate: string;
  bitrate: string;
  synthesizerModel: string;
  synthesizerConfidence: number; // 0-100
  vocalJitterPercent: number; // pitch perturbation
  shimmerPercent: number; // amplitude perturbation
  harmonicsToNoiseRatioDb: number; // HNR
  breathArtifactsDetected: boolean;
  spectralCutoffFrequencyKhz: number;
  waveformPoints: number[];
  spectrogramUrl: string;
  syntheticSegments: AudioSyntheticSegment[];
  audioPlaybackUrl?: string;
}

export interface DeepExifData {
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  software?: string;
  exposureTime?: string;
  fNumber?: string;
  isoSpeed?: string;
  focalLength?: string;
  colorSpace?: string;
  dateTaken?: string;
  imageDimensions?: string;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: string;
    locationName: string;
  };
  prnuSensorMatch: {
    matched: boolean;
    confidence: number;
    fingerprintDb: string;
    details: string;
  };
  errorLevelAnalysis: {
    elaImageUrl: string;
    compressionVarianceScore: number;
    suspiciousRegionsCount: number;
  };
  quantizationTableStatus: "Standard" | "Non-standard (Modified)" | "Custom";
}

export interface AnalysisResult {
  mediaType: "image" | "video" | "audio";
  verdict: "authentic" | "manipulated" | "uncertain";
  trustScore: number; // 0-100, fused confidence
  classifierConfidence: number; // 0-100
  title?: string;
  sourceUrl?: string;
  localizationMap: { overlayImageUrl: string; confidence: number };
  confidenceMap: { overlayImageUrl: string };
  gradCamHeatmap: { overlayImageUrl: string };
  metadata: {
    exifPresent: boolean;
    compressionArtifactsDetected: boolean;
    notes: string[];
  };
  deepExif?: DeepExifData;
  audioForensics?: AudioForensicsData;
  // present only when mediaType === "video"
  videoFrames?: {
    timestampSeconds: number;
    frameThumbnailUrl: string;
    frameTrustScore: number;
  }[];
  reportDownloadUrl: string;
  analyzedAt: string; // ISO timestamp
}
