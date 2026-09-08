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
  mediaType: "image" | "video";
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
  // present only when mediaType === "video"
  videoFrames?: {
    timestampSeconds: number;
    frameThumbnailUrl: string;
    frameTrustScore: number;
  }[];
  reportDownloadUrl: string;
  analyzedAt: string; // ISO timestamp
}
