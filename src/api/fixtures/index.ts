import type { AnalysisResult } from "../../types/analysis";

// Base Images (from Unsplash for high quality visuals)
const IMAGES = {
  politician: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80",
  invoice: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
  crowd: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80",
  drone: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=800&auto=format&fit=crop&q=80"
};

// SVG Overlays as inline Data URLs to represent heatmaps
// 1. Politician Deepfake heatmaps (mouth/face area)
const POLITICIAN_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="loc1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff3333" stop-opacity="0.85"/><stop offset="40%" stop-color="%23ff6600" stop-opacity="0.6"/><stop offset="100%" stop-color="%23ff3333" stop-opacity="0"/></radialGradient></defs><circle cx="410" cy="210" r="90" fill="url(%23loc1)"/></svg>`;
const POLITICIAN_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230f172a" fill-opacity="0.4"/><circle cx="410" cy="210" r="100" fill="none" stroke="%23ff3333" stroke-width="4" stroke-dasharray="8,4"/><circle cx="410" cy="210" r="70" fill="%23000" fill-opacity="0.6"/></svg>`;
const POLITICIAN_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff0000" stop-opacity="0.85"/><stop offset="35%" stop-color="%23ffaa00" stop-opacity="0.6"/><stop offset="70%" stop-color="%2300ff00" stop-opacity="0.3"/><stop offset="100%" stop-color="%230000ff" stop-opacity="0"/></radialGradient></defs><circle cx="410" cy="210" r="220" fill="url(%23gc1)"/></svg>`;

// 2. Invoice Manipulation heatmaps (price text area)
const INVOICE_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect x="420" y="380" width="220" height="70" fill="%23ff3333" fill-opacity="0.65" stroke="%23ff0000" stroke-width="2" rx="4"/></svg>`;
const INVOICE_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230f172a" fill-opacity="0.5"/><rect x="410" y="370" width="240" height="90" fill="none" stroke="%23ff3333" stroke-width="3" stroke-dasharray="10,5"/></svg>`;
const INVOICE_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff00ff" stop-opacity="0.8"/><stop offset="40%" stop-color="%23ff3333" stop-opacity="0.5"/><stop offset="80%" stop-color="%2300ffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient></defs><circle cx="530" cy="415" r="180" fill="url(%23gc2)"/></svg>`;

// 3. Authentic Crowd heatmaps (mostly empty/normal)
const CROWD_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><text x="20" y="40" fill="%2300bfa5" font-family="monospace" font-size="14">NO ANOMALIES DETECTED</text></svg>`;
const CROWD_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%2300bfa5" fill-opacity="0.05"/></svg>`;
const CROWD_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%2300bfa5" stop-opacity="0.2"/><stop offset="100%" stop-color="%2300bfa5" stop-opacity="0"/></radialGradient></defs><circle cx="400" cy="300" r="300" fill="url(%23gc3)"/></svg>`;

// 4. Drone footage heatmaps (ambiguous area)
const DRONE_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="loc4" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffb300" stop-opacity="0.7"/><stop offset="100%" stop-color="%23ffb300" stop-opacity="0"/></radialGradient></defs><circle cx="300" cy="400" r="150" fill="url(%23loc4)"/></svg>`;
const DRONE_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><circle cx="300" cy="400" r="170" fill="none" stroke="%23ffb300" stroke-width="2" stroke-dasharray="5,5"/></svg>`;
const DRONE_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc4" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffb300" stop-opacity="0.6"/><stop offset="50%" stop-color="%2300ff00" stop-opacity="0.3"/><stop offset="100%" stop-color="%230000ff" stop-opacity="0"/></radialGradient></defs><circle cx="300" cy="400" r="280" fill="url(%23gc4)"/></svg>`;


export const mockFixtures: AnalysisResult[] = [
  {
    mediaType: "video",
    verdict: "manipulated",
    trustScore: 12,
    classifierConfidence: 94.2,
    localizationMap: { overlayImageUrl: POLITICIAN_LOCALIZATION, confidence: 91.5 },
    confidenceMap: { overlayImageUrl: POLITICIAN_CONFIDENCE },
    gradCamHeatmap: { overlayImageUrl: POLITICIAN_GRADCAM },
    metadata: {
      exifPresent: false,
      compressionArtifactsDetected: true,
      notes: [
        "Audio-to-video synchronization mismatch (lip-sync offset ~120ms).",
        "Deepfake auto-encoder blending lines detected near the chin and lower lip region.",
        "Facial landmark jitter matches known FaceSwap/StarGAN frequency profiles.",
        "Inconsistent illumination angle between facial reflections and scene background."
      ]
    },
    videoFrames: [
      { timestampSeconds: 0, frameThumbnailUrl: IMAGES.politician, frameTrustScore: 45 },
      { timestampSeconds: 2, frameThumbnailUrl: IMAGES.politician, frameTrustScore: 12 },
      { timestampSeconds: 4, frameThumbnailUrl: IMAGES.politician, frameTrustScore: 8 },
      { timestampSeconds: 6, frameThumbnailUrl: IMAGES.politician, frameTrustScore: 10 },
      { timestampSeconds: 8, frameThumbnailUrl: IMAGES.politician, frameTrustScore: 35 }
    ],
    reportDownloadUrl: "/reports/rep-politician-0822.pdf",
    analyzedAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    mediaType: "image",
    verdict: "manipulated",
    trustScore: 34,
    classifierConfidence: 81.3,
    localizationMap: { overlayImageUrl: INVOICE_LOCALIZATION, confidence: 85.0 },
    confidenceMap: { overlayImageUrl: INVOICE_CONFIDENCE },
    gradCamHeatmap: { overlayImageUrl: INVOICE_GRADCAM },
    metadata: {
      exifPresent: true,
      compressionArtifactsDetected: true,
      notes: [
        "EXIF software tag indicates editing via Adobe Photoshop 2026.",
        "Local double-compression artifacts found in the total amount region.",
        "Font pattern mismatch: text elements in modified area do not match the document base font metrics."
      ]
    },
    reportDownloadUrl: "/reports/rep-invoice-0822.pdf",
    analyzedAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    mediaType: "image",
    verdict: "authentic",
    trustScore: 96,
    classifierConfidence: 98.4,
    localizationMap: { overlayImageUrl: CROWD_LOCALIZATION, confidence: 2.1 },
    confidenceMap: { overlayImageUrl: CROWD_CONFIDENCE },
    gradCamHeatmap: { overlayImageUrl: CROWD_GRADCAM },
    metadata: {
      exifPresent: true,
      compressionArtifactsDetected: false,
      notes: [
        "EXIF camera metadata matches standard iPhone 16 Pro hardware signature.",
        "Pixel grid consistency analysis shows normal, single-layer JPEG compression structure.",
        "Sensor noise pattern (PRNU) is uniform across the entire image area."
      ]
    },
    reportDownloadUrl: "/reports/rep-crowd-0822.pdf",
    analyzedAt: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
  },
  {
    mediaType: "video",
    verdict: "uncertain",
    trustScore: 52,
    classifierConfidence: 61.2,
    localizationMap: { overlayImageUrl: DRONE_LOCALIZATION, confidence: 54.8 },
    confidenceMap: { overlayImageUrl: DRONE_CONFIDENCE },
    gradCamHeatmap: { overlayImageUrl: DRONE_GRADCAM },
    metadata: {
      exifPresent: false,
      compressionArtifactsDetected: true,
      notes: [
        "Moderate video compression makes artifact localization unreliable.",
        "Suspected lens flare could be misclassified as light source manipulation.",
        "Frame-rate drops detected; temporal consistency metrics are inconclusive."
      ]
    },
    videoFrames: [
      { timestampSeconds: 0, frameThumbnailUrl: IMAGES.drone, frameTrustScore: 65 },
      { timestampSeconds: 3, frameThumbnailUrl: IMAGES.drone, frameTrustScore: 52 },
      { timestampSeconds: 6, frameThumbnailUrl: IMAGES.drone, frameTrustScore: 48 },
      { timestampSeconds: 9, frameThumbnailUrl: IMAGES.drone, frameTrustScore: 55 }
    ],
    reportDownloadUrl: "/reports/rep-drone-0822.pdf",
    analyzedAt: new Date(Date.now() - 3600000 * 72).toISOString() // 3 days ago
  }
];

export const getBaseImageForResult = (result: AnalysisResult): string => {
  if (result.mediaType === "video") {
    if (result.trustScore < 20) return IMAGES.politician;
    return IMAGES.drone;
  } else {
    if (result.trustScore < 50) return IMAGES.invoice;
    return IMAGES.crowd;
  }
};
