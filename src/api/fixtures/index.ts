import type { AnalysisResult } from "../../types/analysis";

// Base Images (from Unsplash for high quality visuals)
const IMAGES = {
  politician: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80",
  invoice: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
  crowd: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80",
  drone: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=800&auto=format&fit=crop&q=80",
};

// SVG Overlays as inline Data URLs to represent heatmaps
// 1. Politician Deepfake heatmaps (mouth/face area)
const POLITICIAN_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="loc1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff3333" stop-opacity="0.85"/><stop offset="40%" stop-color="%23ff6600" stop-opacity="0.6"/><stop offset="100%" stop-color="%23ff3333" stop-opacity="0"/></radialGradient></defs><circle cx="410" cy="210" r="90" fill="url(%23loc1)"/></svg>`;
const POLITICIAN_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230f172a" fill-opacity="0.4"/><circle cx="410" cy="210" r="100" fill="none" stroke="%23ff3333" stroke-width="4" stroke-dasharray="8,4"/><circle cx="410" cy="210" r="70" fill="%23000" fill-opacity="0.6"/></svg>`;
const POLITICIAN_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff0000" stop-opacity="0.85"/><stop offset="35%" stop-color="%23ffaa00" stop-opacity="0.6"/><stop offset="70%" stop-color="%2300ff00" stop-opacity="0.3"/><stop offset="100%" stop-color="%230000ff" stop-opacity="0"/></radialGradient></defs><circle cx="410" cy="210" r="220" fill="url(%23gc1)"/></svg>`;
const POLITICIAN_ELA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23111827"/><circle cx="410" cy="210" r="95" fill="%23ec4899" fill-opacity="0.75"/><circle cx="410" cy="210" r="70" fill="%23a855f7" fill-opacity="0.6"/></svg>`;

// 2. Invoice Manipulation heatmaps (price text area)
const INVOICE_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect x="420" y="380" width="220" height="70" fill="%23ff3333" fill-opacity="0.65" stroke="%23ff0000" stroke-width="2" rx="4"/></svg>`;
const INVOICE_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230f172a" fill-opacity="0.5"/><rect x="410" y="370" width="240" height="90" fill="none" stroke="%23ff3333" stroke-width="3" stroke-dasharray="10,5"/></svg>`;
const INVOICE_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ff00ff" stop-opacity="0.8"/><stop offset="40%" stop-color="%23ff3333" stop-opacity="0.5"/><stop offset="80%" stop-color="%2300ffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient></defs><circle cx="530" cy="415" r="180" fill="url(%23gc2)"/></svg>`;
const INVOICE_ELA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23090d16"/><rect x="415" y="375" width="230" height="80" fill="%23f43f5e" fill-opacity="0.8" stroke="%23fb7185" stroke-width="2"/></svg>`;

// 3. Authentic Crowd heatmaps (mostly empty/normal)
const CROWD_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><text x="20" y="40" fill="%2300bfa5" font-family="monospace" font-size="14">NO ANOMALIES DETECTED</text></svg>`;
const CROWD_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%2300bfa5" fill-opacity="0.05"/></svg>`;
const CROWD_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%2300bfa5" stop-opacity="0.2"/><stop offset="100%" stop-color="%2300bfa5" stop-opacity="0"/></radialGradient></defs><circle cx="400" cy="300" r="300" fill="url(%23gc3)"/></svg>`;
const CROWD_ELA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230a0e17" fill-opacity="0.95"/><circle cx="400" cy="300" r="200" fill="%2310b981" fill-opacity="0.05"/></svg>`;

// 4. Drone footage heatmaps (ambiguous area)
const DRONE_LOCALIZATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="loc4" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffb300" stop-opacity="0.7"/><stop offset="100%" stop-color="%23ffb300" stop-opacity="0"/></radialGradient></defs><circle cx="300" cy="400" r="150" fill="url(%23loc4)"/></svg>`;
const DRONE_CONFIDENCE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><circle cx="300" cy="400" r="170" fill="none" stroke="%23ffb300" stroke-width="2" stroke-dasharray="5,5"/></svg>`;
const DRONE_GRADCAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="gc4" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffb300" stop-opacity="0.6"/><stop offset="50%" stop-color="%2300ff00" stop-opacity="0.3"/><stop offset="100%" stop-color="%230000ff" stop-opacity="0"/></radialGradient></defs><circle cx="300" cy="400" r="280" fill="url(%23gc4)"/></svg>`;
const DRONE_ELA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230e131f"/><circle cx="300" cy="400" r="150" fill="%23f59e0b" fill-opacity="0.4"/></svg>`;

export const mockFixtures: AnalysisResult[] = [
  {
    mediaType: "video",
    title: "Presidential Press Briefing Deepfake",
    sourceUrl: "https://truthlens.ai/samples/press-briefing-falsified.mp4",
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
    deepExif: {
      cameraMake: "Sony Corporation",
      cameraModel: "ILCE-7RM4 (Simulated Header)",
      lensModel: "FE 24-70mm F2.8 GM",
      software: "Adobe Premiere Pro 24.2 / FakeApp v2.2",
      exposureTime: "1/120 sec",
      fNumber: "f/2.8",
      isoSpeed: "ISO 800",
      focalLength: "50.0 mm",
      colorSpace: "sRGB",
      dateTaken: "2026-06-14 14:22:08 UTC",
      imageDimensions: "3840 x 2160 (4K UHD)",
      gps: {
        latitude: 38.8977,
        longitude: -77.0365,
        altitude: "18.2 m",
        locationName: "Washington, DC (White House Press Room)"
      },
      prnuSensorMatch: {
        matched: false,
        confidence: 96.4,
        fingerprintDb: "PRNU-SONY-7R4-DB",
        details: "Sensor PRNU fingerprint fails in facial bounding box; composite splice identified."
      },
      errorLevelAnalysis: {
        elaImageUrl: POLITICIAN_ELA,
        compressionVarianceScore: 84.6,
        suspiciousRegionsCount: 3
      },
      quantizationTableStatus: "Non-standard (Modified)"
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
    title: "Tampered Financial Invoice",
    sourceUrl: "https://truthlens.ai/samples/invoice-audit-scan.jpg",
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
    deepExif: {
      cameraMake: "Canon",
      cameraModel: "Canon CanoScan LiDE 400",
      software: "Adobe Photoshop 2026.1 (Macintosh)",
      exposureTime: "N/A (Flatbed Scanner)",
      fNumber: "N/A",
      isoSpeed: "N/A",
      focalLength: "N/A",
      colorSpace: "Adobe RGB (1998)",
      dateTaken: "2026-08-10 09:15:30",
      imageDimensions: "2480 x 3508 (A4 300 DPI)",
      prnuSensorMatch: {
        matched: false,
        confidence: 88.2,
        fingerprintDb: "CANON-SCANNER-DB",
        details: "Double-compression ghosting detected in bounding box [X:420, Y:380, W:220, H:70]."
      },
      errorLevelAnalysis: {
        elaImageUrl: INVOICE_ELA,
        compressionVarianceScore: 78.3,
        suspiciousRegionsCount: 1
      },
      quantizationTableStatus: "Non-standard (Modified)"
    },
    reportDownloadUrl: "/reports/rep-invoice-0822.pdf",
    analyzedAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    mediaType: "image",
    title: "Crowd Assembly Photo Verification",
    sourceUrl: "https://truthlens.ai/samples/authentic-crowd-event.jpg",
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
    deepExif: {
      cameraMake: "Apple",
      cameraModel: "iPhone 16 Pro",
      lensModel: "iPhone 16 Pro back triple camera 6.765mm f/1.78",
      software: "iOS 19.4",
      exposureTime: "1/500 sec",
      fNumber: "f/1.78",
      isoSpeed: "ISO 64",
      focalLength: "24.0 mm (equivalent)",
      colorSpace: "Display P3",
      dateTaken: "2026-08-20 16:48:12",
      imageDimensions: "8064 x 6048 (48 MP ProRAW)",
      gps: {
        latitude: 40.7580,
        longitude: -73.9855,
        altitude: "24.5 m",
        locationName: "New York, NY (Times Square)"
      },
      prnuSensorMatch: {
        matched: true,
        confidence: 99.1,
        fingerprintDb: "APPLE-IPHONE16PRO-PRNU-DB",
        details: "PRNU noise fingerprint matches genuine Apple Sony IMX903 sensor across all quadrants."
      },
      errorLevelAnalysis: {
        elaImageUrl: CROWD_ELA,
        compressionVarianceScore: 3.1,
        suspiciousRegionsCount: 0
      },
      quantizationTableStatus: "Standard"
    },
    reportDownloadUrl: "/reports/rep-crowd-0822.pdf",
    analyzedAt: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
  },
  {
    mediaType: "video",
    title: "Surveillance Drone Reconnaissance Footage",
    sourceUrl: "https://truthlens.ai/samples/drone-surveillance-stream.mov",
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
    deepExif: {
      cameraMake: "DJI",
      cameraModel: "Mavic 3 Enterprise Thermal",
      software: "DJI Fly v1.14",
      exposureTime: "1/240 sec",
      fNumber: "f/2.8",
      isoSpeed: "ISO 400",
      focalLength: "12.3 mm",
      colorSpace: "D-Log M",
      dateTaken: "2026-08-18 11:04:19",
      imageDimensions: "3840 x 2160 (4K 60fps)",
      gps: {
        latitude: 34.0522,
        longitude: -118.2437,
        altitude: "120.4 m",
        locationName: "Los Angeles, CA (Downtown Corridor)"
      },
      prnuSensorMatch: {
        matched: true,
        confidence: 62.4,
        fingerprintDb: "DJI-SENSOR-DB",
        details: "Compression lossiness attenuates PRNU correlation; inconclusive."
      },
      errorLevelAnalysis: {
        elaImageUrl: DRONE_ELA,
        compressionVarianceScore: 45.2,
        suspiciousRegionsCount: 1
      },
      quantizationTableStatus: "Standard"
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

