import React, { useEffect, useState } from "react";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { TerminalWindow, Cpu, Stack, Eye, Brain, MagnifyingGlass } from "@phosphor-icons/react";

const STAGES = [
  { icon: MagnifyingGlass, label: "Extracting features..." },
  { icon: Cpu,          label: "Running localization..." },
  { icon: Stack,        label: "Building heatmaps..." },
  { icon: Eye,          label: "Generating explanation..." },
  { icon: Brain,        label: "Synthesizing report..." },
];

export const AnalyzingView: React.FC = () => {
  const { analysisProgressText, selectedFile, selectedFilePreview } = useAnalysisStore();
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const logsPool = [
    "INTEGRITY_CHECK › MD5/SHA256 checksum scan initialized",
    "FORMAT_PARSER › Loading metadata ring buffers",
    "EXIF_READER › Header consistency OK",
    "PIXEL_SCAN › JPEG compression table analysis running",
    "FREQ_DOMAIN › Double-JPEG compression detection pass",
    "NEURAL_NET › TruFor localization model loaded",
    "LOCALIZER › Noise residual field computation",
    "CLASSIFIER › Splicing boundary confidence scoring",
    "GRAD_CAM › Extracting intermediate gradient heatmaps",
    "FUSION › Collating score arrays…",
  ];

  useEffect(() => {
    setTerminalLogs(["SYSTEM › Pipeline locked on target."]);
    let logIndex = 0;
    let stageIndex = 0;

    const logInterval = setInterval(() => {
      if (logIndex < logsPool.length) {
        setTerminalLogs((prev) => [...prev, logsPool[logIndex]].slice(-7));
        logIndex++;
      }
    }, 420);

    const stageInterval = setInterval(() => {
      stageIndex = (stageIndex + 1) % STAGES.length;
      setActiveStageIdx(stageIndex);
    }, 800);

    return () => {
      clearInterval(logInterval);
      clearInterval(stageInterval);
    };
  }, []);

  const isVideo = selectedFile?.type.startsWith("video/");

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
      <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Gradient top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-brand via-[#2ed573] to-transparent" />

        <div className="p-8 flex flex-col items-center gap-8">

          {/* Media target thumbnail with scan overlay */}
          <div className="relative w-56 h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
            {selectedFilePreview && (
              isVideo ? (
                <video src={selectedFilePreview} className="w-full h-full object-cover opacity-60" muted />
              ) : (
                <img src={selectedFilePreview} alt="target" className="w-full h-full object-cover opacity-60" />
              )
            )}
            {/* Scan grid overlay */}
            <div className="absolute inset-0 bg-scan-grid opacity-20 pointer-events-none" />
            {/* Moving scan line */}
            <div className="absolute left-0 w-full h-0.5 bg-brand shadow-[0_0_8px_rgba(28,167,196,0.5)] animate-scan-line" />
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-brand" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-brand" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-brand" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-brand" />
            {/* Center label */}
            <div className="absolute inset-0 flex items-end justify-start p-2">
              <span className="font-sans text-[9px] text-brand font-bold uppercase tracking-wider">Scanning buffer...</span>
            </div>
          </div>

          {/* Stage indicators */}
          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isActive = i === activeStageIdx;
                const isDone = i < activeStageIdx;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-sans text-[10px] uppercase tracking-wide transition-all duration-300 ${
                      isActive
                        ? "bg-brand/10 border-brand/35 text-brand shadow-sm font-bold"
                        : isDone
                        ? "bg-authentic/8 border-authentic/25 text-authentic"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" weight="duotone" />
                    <span className="hidden sm:inline">{stage.label.replace("...", "")}</span>
                    {isDone && <span className="text-[10px] text-authentic font-bold">✓</span>}
                  </div>
                );
              })}
            </div>

            {/* Primary progress text */}
            <div className="text-center">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-brand font-bold mb-1">
                Pipeline Running
              </p>
              <h3 className="text-base font-bold text-slate-800">{analysisProgressText}</h3>
              {selectedFile && (
                <p className="font-sans text-[11px] text-slate-400 mt-1 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs bg-slate-100 border border-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand to-authentic animate-progress-bar rounded-full" />
            </div>
          </div>

          {/* Terminal log panel */}
          <div className="w-full bg-[#0c0e12] border border-slate-900 rounded-xl p-4 font-mono text-[9px]">
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-anomaly/70" />
                <div className="w-2 h-2 rounded-full bg-warning/70" />
                <div className="w-2 h-2 rounded-full bg-authentic/70" />
              </div>
              <TerminalWindow className="w-3.5 h-3.5 text-slate-500" weight="regular" />
              <span className="text-slate-500 uppercase tracking-widest font-sans text-[8.5px] font-bold">Forensic engine console</span>
            </div>
            <div className="space-y-1.5 h-28 overflow-hidden flex flex-col justify-end">
              {terminalLogs.map((log, i) => {
                const [prefix, ...rest] = log.split(" › ");
                return (
                  <div key={i} className="truncate text-slate-300">
                    <span className="text-brand/80 font-bold mr-2">{prefix}</span>
                    {rest.join(" › ")}
                  </div>
                );
              })}
              <div className="flex items-center gap-1 text-brand/80 animate-pulse">
                <span>&gt;</span>
                <span className="w-1.5 h-3.5 bg-brand/70 animate-pulse" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
