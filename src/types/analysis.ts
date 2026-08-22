export interface AnalysisResult {
  mediaType: "image" | "video";
  verdict: "authentic" | "manipulated" | "uncertain";
  trustScore: number; // 0-100, fused confidence
  classifierConfidence: number; // 0-100
  localizationMap: { overlayImageUrl: string; confidence: number };
  confidenceMap: { overlayImageUrl: string };
  gradCamHeatmap: { overlayImageUrl: string };
  metadata: {
    exifPresent: boolean;
    compressionArtifactsDetected: boolean;
    notes: string[];
  };
  // present only when mediaType === "video"
  videoFrames?: {
    timestampSeconds: number;
    frameThumbnailUrl: string;
    frameTrustScore: number;
  }[];
  reportDownloadUrl: string;
  analyzedAt: string; // ISO timestamp
}
