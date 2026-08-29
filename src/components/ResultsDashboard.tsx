import React, { useState } from "react";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { getBaseImageForResult } from "../api/fixtures";
import { TrustScoreGauge } from "./TrustScoreGauge";
import { MetadataPanel } from "./MetadataPanel";
import { VideoTimeline } from "./VideoTimeline";
import { AudioForensicsView } from "./AudioForensicsView";
import { DeepExifModal } from "./DeepExifModal";
import {
  CaretLeft,
  Download,
  Stack,
  Eye,
  ShieldCheck,
  ShieldWarning,
  SealQuestion,
  Sliders,
  Fingerprint,
  SpeakerHigh,
  FilmStrip,
  Image as ImageIcon
} from "@phosphor-icons/react";

export const ResultsDashboard: React.FC = () => {
  const {
    currentResult,
    resetCurrentResult,
    selectedOverlayMode,
    setSelectedOverlayMode,
    activeFrameIndex,
    setActiveFrameIndex,
    downloadReportPdf,
    isDeepExifOpen,
    setIsDeepExifOpen
  } = useAnalysisStore();

  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!currentResult) return null;

  const getBaseMedia = () => {
    if (currentResult.mediaType === "video" && currentResult.videoFrames) {
      return currentResult.videoFrames[activeFrameIndex]?.frameThumbnailUrl || getBaseImageForResult(currentResult);
    }
    return getBaseImageForResult(currentResult);
  };

  const getOverlayUrl = () => {
    switch (selectedOverlayMode) {
      case "localization": return currentResult.localizationMap.overlayImageUrl;
      case "confidence":   return currentResult.confidenceMap.overlayImageUrl;
      case "gradcam":      return currentResult.gradCamHeatmap.overlayImageUrl;
      default:             return null;
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try { await downloadReportPdf(currentResult.reportDownloadUrl); }
    finally { setIsDownloading(false); }
  };

  const verdictConfig = {
    authentic:   { icon: ShieldCheck,    text: "text-authentic",  bg: "bg-authentic/10",  border: "border-authentic/25",  topBar: "#10b981", label: "Authentic"   },
    manipulated: { icon: ShieldWarning,  text: "text-anomaly",    bg: "bg-anomaly/10",    border: "border-anomaly/25",    topBar: "#ef4444", label: "Manipulated" },
    uncertain:   { icon: SealQuestion,  text: "text-warning",    bg: "bg-warning/10",    border: "border-warning/25",    topBar: "#f59e0b", label: "Uncertain"   },
  };
  const vc = verdictConfig[currentResult.verdict];
  const VerdictIcon = vc.icon;

  const overlayUrl = getOverlayUrl();

  const OVERLAY_MODES = [
    { key: "original",     label: "Original",     shortLabel: "Orig" },
    { key: "localization", label: "Localization",  shortLabel: "Loc" },
    { key: "confidence",   label: "Confidence",    shortLabel: "Conf" },
    { key: "gradcam",      label: "Grad-CAM",      shortLabel: "CAM" },
  ] as const;

  const isAudio = currentResult.mediaType === "audio";

  return (
    <div className="flex-1 flex flex-col p-5 md:p-6 w-full max-w-7xl mx-auto space-y-5 animate-fade-slide-up">

      {/* Breadcrumb / action row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={resetCurrentResult}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-all duration-150 shadow-sm"
          >
            <CaretLeft className="w-4 h-4" weight="bold" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-sans font-bold uppercase tracking-wider ${vc.text} ${vc.bg} ${vc.border}`}>
                <VerdictIcon className="w-3.5 h-3.5" weight="duotone" />
                {vc.label}
              </span>
              <span className="font-sans text-[10px] text-slate-400 font-semibold tracking-wider hidden sm:inline uppercase flex items-center gap-1">
                {isAudio ? (
                  <SpeakerHigh className="w-3 h-3 text-brand inline" />
                ) : currentResult.mediaType === "video" ? (
                  <FilmStrip className="w-3 h-3 text-brand inline" />
                ) : (
                  <ImageIcon className="w-3 h-3 text-brand inline" />
                )}
                {currentResult.mediaType.toUpperCase()} · Forensic Dossier
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-850 mt-0.5 font-sans">
              {currentResult.title || "Authenticity Analysis Dashboard"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Deep EXIF modal trigger button */}
          <button
            onClick={() => setIsDeepExifOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-brand/40 text-slate-750 hover:text-brand font-sans text-xs transition-all duration-150 shadow-sm font-semibold"
          >
            <Fingerprint className="w-4 h-4 text-brand" weight="duotone" />
            <span className="hidden sm:inline">Deep Metadata & Sensor EXIF</span>
            <span className="sm:hidden">EXIF</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs transition-all duration-150 disabled:opacity-50 shadow-sm font-semibold"
          >
            {isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" weight="bold" />
                Forensic PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main asymmetric grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── Main Media / Audio Forensic Container ── */}
        <div className="lg:col-span-8 space-y-5">
          
          {isAudio && currentResult.audioForensics ? (
            /* Dedicated Audio Voice Clone Forensics View */
            <AudioForensicsView
              forensics={currentResult.audioForensics}
              verdict={currentResult.verdict}
            />
          ) : (
            /* Image & Video Heatmap Viewer */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${vc.topBar}, transparent)` }} />

              <div className="p-5 space-y-4">
                {/* Viewer header + toggles */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <Stack className="w-3.5 h-3.5 text-brand" weight="duotone" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-sans">
                      Heatmap Explanation
                    </span>
                  </div>

                  {/* Overlay mode tabs */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                    {OVERLAY_MODES.map(({ key, label, shortLabel }) => (
                      <button
                        key={key}
                        onClick={() => setSelectedOverlayMode(key)}
                        className={`px-3 py-1.5 rounded-lg font-sans text-[10px] font-semibold tracking-wide transition-all duration-150 whitespace-nowrap ${
                          selectedOverlayMode === key
                            ? "bg-brand text-white font-bold shadow-sm"
                            : "text-slate-500 hover:text-slate-850"
                        }`}
                      >
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Image Canvas */}
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <img
                    src={getBaseMedia()}
                    alt="media target"
                    className="w-full h-full object-cover select-none"
                  />
                  {overlayUrl && (
                    <img
                      src={overlayUrl}
                      alt={`${selectedOverlayMode} overlay`}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200"
                      style={{
                        mixBlendMode: selectedOverlayMode === "localization" ? "normal" : "multiply",
                        opacity: overlayOpacity,
                      }}
                    />
                  )}
                  {selectedOverlayMode !== "original" && (
                    <div className="absolute inset-0 bg-scan-grid opacity-10 pointer-events-none" />
                  )}
                  
                  {/* Overlay mode watermark */}
                  {selectedOverlayMode !== "original" && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-2.5 py-1.5 font-sans text-[10px] text-slate-750 font-bold shadow-sm">
                      {selectedOverlayMode === "localization" && "TruFor · Localization"}
                      {selectedOverlayMode === "confidence" && "TruFor · Confidence"}
                      {selectedOverlayMode === "gradcam" && "Grad-CAM · Heatmap"}
                    </div>
                  )}
                </div>

                {/* Controls row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  {/* Opacity slider */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Sliders className="w-4 h-4 text-slate-400 flex-shrink-0" weight="regular" />
                    <span className="font-sans text-[10.5px] text-slate-500 font-semibold flex-shrink-0">Opacity</span>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={overlayOpacity}
                      disabled={selectedOverlayMode === "original"}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-brand disabled:opacity-30 disabled:cursor-not-allowed bg-slate-100"
                    />
                    <span className="font-mono text-xs font-bold text-slate-800 w-8 text-right tabular-nums">
                      {Math.round(overlayOpacity * 100)}%
                    </span>
                  </div>

                  {/* Legend */}
                  <div className="flex-shrink-0 text-[10px] font-sans font-medium text-slate-650">
                    {selectedOverlayMode === "original" && (
                      <div className="flex items-center gap-1.5 text-slate-450">
                        <Eye className="w-3.5 h-3.5" weight="regular" />
                        <span>Original content baseline</span>
                      </div>
                    )}
                    {selectedOverlayMode === "localization" && (
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <span className="text-slate-450 font-bold">Legend:</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ff3333] opacity-80 inline-block" /> Spliced</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ff6600] opacity-60 inline-block" /> Edge</span>
                      </div>
                    )}
                    {selectedOverlayMode === "confidence" && (
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <span className="text-slate-450 font-bold">Legend:</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-dashed border-[#ff3333] inline-block" /> Discontinuity</span>
                      </div>
                    )}
                    {selectedOverlayMode === "gradcam" && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-slate-450 font-bold">Heat:</span>
                        <div className="h-2 w-20 rounded-sm bg-gradient-to-r from-blue-600 via-green-500 to-red-500 border border-slate-200" />
                        <span className="text-slate-500">Cold → Hot</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video frame timeline (conditional) */}
          {currentResult.mediaType === "video" && currentResult.videoFrames && (
            <VideoTimeline
              frames={currentResult.videoFrames}
              activeFrameIndex={activeFrameIndex}
              onFrameClick={setActiveFrameIndex}
            />
          )}
        </div>

        {/* ── Analytics panel ── */}
        <div className="lg:col-span-4 space-y-5">
          <TrustScoreGauge
            score={currentResult.trustScore}
            verdict={currentResult.verdict}
            classifierConfidence={currentResult.classifierConfidence}
          />
          <MetadataPanel
            metadata={currentResult.metadata}
            analyzedAt={currentResult.analyzedAt}
            onOpenDeepExif={() => setIsDeepExifOpen(true)}
          />
        </div>
      </div>

      {/* Deep EXIF & Sensor Forensics Modal */}
      <DeepExifModal
        isOpen={isDeepExifOpen}
        onClose={() => setIsDeepExifOpen(false)}
        deepExif={currentResult.deepExif}
        mediaTitle={currentResult.title || "Target Media Asset"}
      />
    </div>
  );
};
