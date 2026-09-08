import type { AnalysisResult } from "../types/analysis";
import { mockFixtures } from "./fixtures";

/**
 * Helper to simulate a network delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Analyzes the uploaded media file.
 * Returns a randomized relevant fixture depending on whether the media is an image or video,
 * after a simulated 2-3 second network delay.
 */
export async function analyzeMedia(file: File): Promise<AnalysisResult> {
  // Simulate 2 to 3 seconds delay
  const waitTime = Math.random() * 1500 + 2000;
  await delay(waitTime);

  const isVideo = file.type.startsWith("video/") || file.name.match(/\.(mp4|mov|webm|avi)$/i);
  const targetType = isVideo ? "video" : "image";

  // Filter fixtures by type to match the upload file's category
  const candidates = mockFixtures.filter((f) => f.mediaType === targetType);
  
  const selectedFixture = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : mockFixtures[0];
  
  // Return a shallow copy with a fresh timestamp and custom title
  return {
    ...selectedFixture,
    title: file.name,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Analyzes media streamed / ingested from a public web URL.
 */
export async function analyzeUrl(url: string, preferredMediaType?: "image" | "video"): Promise<AnalysisResult> {
  // Simulate 2.5s network extraction & analysis delay
  await delay(2500);

  let targetType: "image" | "video" = preferredMediaType || "video";

  if (!preferredMediaType) {
    if (url.match(/\.(jpg|jpeg|png|webp|avif)/i) || url.includes("photo") || url.includes("image")) {
      targetType = "image";
    } else {
      targetType = "video";
    }
  }

  const candidates = mockFixtures.filter((f) => f.mediaType === targetType);
  const selectedFixture = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : mockFixtures[0];

  return {
    ...selectedFixture,
    sourceUrl: url,
    title: `Web Stream: ${url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 32)}...`,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Simulates downloading a forensic report PDF.
 * Returns a Blob with fake PDF content after a 1.5 second delay.
 */
export async function downloadReport(_url: string): Promise<Blob> {
  await delay(1500);
  
  // Create a minimal fake PDF file content
  const fakePdfContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 50 >>
stream
BT
/F1 12 Tf
70 700 Td
(TruthLens Forensic Report - Authenticity Analysis) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000130 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
310
%%EOF`;

  return new Blob([fakePdfContent], { type: "application/pdf" });
}

/**
 * Simulates fetching the scan history.
 * Returns the collection of mock fixtures after a 800ms delay.
 */
export async function getScanHistory(): Promise<AnalysisResult[]> {
  await delay(800);
  return [...mockFixtures];
}
