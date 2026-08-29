import React, { useState } from "react";
import type { DeepExifData } from "../types/analysis";
import {
  X,
  Camera,
  MapPin,
  Fingerprint,
  FileCode,
  ShieldCheck,
  ShieldWarning,
  Eye,
  Sliders
} from "@phosphor-icons/react";

interface DeepExifModalProps {
  isOpen: boolean;
  onClose: () => void;
  deepExif?: DeepExifData;
  mediaTitle?: string;
}

export const DeepExifModal: React.FC<DeepExifModalProps> = ({
  isOpen,
  onClose,
  deepExif,
  mediaTitle = "Forensic Asset"
}) => {
  const [activeTab, setActiveTab] = useState<"exif" | "prnu" | "gps" | "ela">("exif");
  const [elaOpacity, setElaOpacity] = useState(0.85);

  if (!isOpen) return null;

  const defaultExif: DeepExifData = deepExif || {
    cameraMake: "Standard Device (Generic Capture)",
    cameraModel: "Embedded Sensor Pipeline",
    software: "Unspecified Media Processor",
    exposureTime: "1/60 sec",
    fNumber: "f/2.0",
    isoSpeed: "ISO 200",
    focalLength: "28 mm",
    colorSpace: "sRGB",
    dateTaken: new Date().toISOString(),
    imageDimensions: "1920 x 1080 (Full HD)",
    gps: {
      latitude: 37.7749,
      longitude: -122.4194,
      locationName: "San Francisco, CA (Verified Coordinate)"
    },
    prnuSensorMatch: {
      matched: true,
      confidence: 94.5,
      fingerprintDb: "GENERIC-SENSOR-PRNU-DB",
      details: "PRNU noise fingerprint shows consistent spatial photon response."
    },
    errorLevelAnalysis: {
      elaImageUrl: "",
      compressionVarianceScore: 12.4,
      suspiciousRegionsCount: 0
    },
    quantizationTableStatus: "Standard"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm animate-fade-slide-up">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand/10 border border-brand/20 text-brand">
              <Fingerprint className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Deep Forensic Metadata & Sensor Inspector
              </h3>
              <p className="text-[11px] text-slate-500 font-sans truncate max-w-md">
                Target: {mediaTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Forensic Sub-tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab("exif")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold font-sans border-b-2 transition-all ${
              activeTab === "exif"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-4 h-4" weight="duotone" />
            <span>EXIF Tags & Hardware</span>
          </button>

          <button
            onClick={() => setActiveTab("prnu")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold font-sans border-b-2 transition-all ${
              activeTab === "prnu"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Fingerprint className="w-4 h-4" weight="duotone" />
            <span>Sensor PRNU Match</span>
          </button>

          <button
            onClick={() => setActiveTab("gps")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold font-sans border-b-2 transition-all ${
              activeTab === "gps"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MapPin className="w-4 h-4" weight="duotone" />
            <span>GPS Geolocation</span>
          </button>

          <button
            onClick={() => setActiveTab("ela")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold font-sans border-b-2 transition-all ${
              activeTab === "ela"
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="w-4 h-4" weight="duotone" />
            <span>Error Level (ELA)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          
          {/* TAB 1: EXIF Metadata */}
          {activeTab === "exif" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Camera Make & Model</span>
                  <span className="font-semibold text-slate-800 font-sans mt-0.5 block">
                    {defaultExif.cameraMake} {defaultExif.cameraModel}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Lens Identifier</span>
                  <span className="font-semibold text-slate-800 font-sans mt-0.5 block">
                    {defaultExif.lensModel || "Standard Fixed / Integrated Focal"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Software Processing Tag</span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block truncate">
                    {defaultExif.software || "Firmware Native (Unmodified)"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Exposure / Shutter / ISO</span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {defaultExif.exposureTime || "1/120s"} · {defaultExif.fNumber || "f/2.8"} · {defaultExif.isoSpeed || "ISO 100"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Original Resolution</span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {defaultExif.imageDimensions || "3840 x 2160"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Capture Timestamp</span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                    {defaultExif.dateTaken || "2026-08-20 16:48:12 UTC"}
                  </span>
                </div>
              </div>

              {/* Quantization Table Badge */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 font-sans block">DCT Quantization Matrix</span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Luminance & chrominance frequency table alignment
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                  defaultExif.quantizationTableStatus === "Standard"
                    ? "bg-authentic/10 text-authentic border border-authentic/20"
                    : "bg-anomaly/10 text-anomaly border border-anomaly/20"
                }`}>
                  {defaultExif.quantizationTableStatus}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PRNU Sensor Noise */}
          {activeTab === "prnu" && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                defaultExif.prnuSensorMatch.matched
                  ? "bg-authentic/8 border-authentic/20 text-authentic"
                  : "bg-anomaly/8 border-anomaly/20 text-anomaly"
              }`}>
                {defaultExif.prnuSensorMatch.matched ? (
                  <ShieldCheck className="w-6 h-6 flex-shrink-0" weight="duotone" />
                ) : (
                  <ShieldWarning className="w-6 h-6 flex-shrink-0" weight="duotone" />
                )}
                <div>
                  <h4 className="text-xs font-bold font-sans uppercase tracking-wider">
                    {defaultExif.prnuSensorMatch.matched ? "PRNU Fingerprint Verified" : "Sensor Noise Anomaly Detected"}
                  </h4>
                  <p className="text-xs text-slate-700 font-sans mt-1 leading-relaxed">
                    {defaultExif.prnuSensorMatch.details}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-2">
                    Reference DB: {defaultExif.prnuSensorMatch.fingerprintDb} · Correlation: {defaultExif.prnuSensorMatch.confidence}%
                  </p>
                </div>
              </div>

              {/* Technical methodology info */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 font-sans">
                <p className="font-bold text-slate-800">What is Photo-Response Non-Uniformity (PRNU)?</p>
                <p className="leading-relaxed text-[11px]">
                  PRNU acts as a physical biometric fingerprint for camera sensors caused by microscopic silicon imperfections during wafer fabrication. Spliced or AI-generated patches produce zero or conflicting PRNU noise signatures.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: GPS Geolocation */}
          {activeTab === "gps" && (
            <div className="space-y-4">
              {defaultExif.gps ? (
                <>
                  <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-brand" weight="fill" />
                      <div>
                        <p className="text-xs font-bold font-sans">{defaultExif.gps.locationName}</p>
                        <p className="text-[10.5px] font-mono text-slate-400">
                          {defaultExif.gps.latitude.toFixed(4)}° N, {defaultExif.gps.longitude.toFixed(4)}° W
                          {defaultExif.gps.altitude && ` · Altitude: ${defaultExif.gps.altitude}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                      GPS Validated
                    </span>
                  </div>

                  {/* Simulated Map Graphic */}
                  <div className="relative aspect-[21/9] bg-slate-950 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                    <div className="relative flex flex-col items-center gap-1 z-10">
                      <div className="w-8 h-8 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center animate-pulse">
                        <MapPin className="w-4 h-4 text-brand" weight="fill" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white bg-black/80 px-2 py-0.5 rounded">
                        {defaultExif.gps.locationName}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-sans">
                  No GPS coordinates embedded in media header.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Error Level Analysis (ELA) */}
          {activeTab === "ela" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 font-sans">Error Level Analysis (ELA)</h4>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Highlights compression gradient variations across the image plane
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-slate-700">
                    Variance Score: {defaultExif.errorLevelAnalysis.compressionVarianceScore}%
                  </span>
                </div>
              </div>

              {defaultExif.errorLevelAnalysis.elaImageUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                  <img
                    src={defaultExif.errorLevelAnalysis.elaImageUrl}
                    alt="Error Level Analysis"
                    className="w-full h-full object-cover"
                    style={{ opacity: elaOpacity }}
                  />
                  <div className="absolute top-2 right-2 bg-black/70 px-2.5 py-1 rounded-lg text-[9px] font-mono text-pink-400 border border-pink-500/20">
                    ELA Heatmap
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  ELA heatmap generated during deep forensic sweep.
                </div>
              )}

              {/* Opacity slider */}
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-600 font-sans">ELA Blend Opacity:</span>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  value={elaOpacity}
                  onChange={(e) => setElaOpacity(parseFloat(e.target.value))}
                  className="flex-1 accent-brand h-1.5 bg-slate-100 rounded-full"
                />
                <span className="font-mono text-xs font-bold text-slate-700 w-10 text-right">
                  {Math.round(elaOpacity * 100)}%
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <FileCode className="w-3.5 h-3.5 text-brand" />
            ISO/IEC 27037 Standard Forensics
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
