import React, { useEffect } from "react";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { getBaseImageForResult } from "../api/fixtures";
import { Clock, ShieldCheck, ShieldWarning, SealQuestion, CaretLeft, CaretRight, ClockCounterClockwise } from "@phosphor-icons/react";
import type { AnalysisResult } from "../types/analysis";

interface ScanHistoryPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ScanHistoryPanel: React.FC<ScanHistoryPanelProps> = ({ isOpen, onToggle }) => {
  const { scanHistory, currentResult, selectResult, fetchScanHistory, isLoadingHistory } = useAnalysisStore();

  useEffect(() => {
    fetchScanHistory();
  }, [fetchScanHistory]);

  const getVerdictIcon = (verdict: AnalysisResult["verdict"]) => {
    switch (verdict) {
      case "authentic":
        return <ShieldCheck className="w-3.5 h-3.5 text-authentic" weight="duotone" />;
      case "manipulated":
        return <ShieldWarning className="w-3.5 h-3.5 text-anomaly" weight="duotone" />;
      case "uncertain":
        return <SealQuestion className="w-3.5 h-3.5 text-warning" weight="duotone" />;
    }
  };

  const getVerdictStyle = (verdict: AnalysisResult["verdict"]) => {
    switch (verdict) {
      case "authentic":
        return "text-authentic bg-authentic/10 border-authentic/20";
      case "manipulated":
        return "text-anomaly bg-anomaly/10 border-anomaly/20";
      case "uncertain":
        return "text-warning bg-warning/10 border-warning/20";
    }
  };

  const getSelectedBorderColor = (verdict: AnalysisResult["verdict"]) => {
    switch (verdict) {
      case "authentic":   return "border-l-authentic shadow-sm";
      case "manipulated": return "border-l-anomaly shadow-sm";
      case "uncertain":   return "border-l-warning shadow-sm";
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · " + date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return isoString;
    }
  };

  // Format label to sentence case
  const getSentenceCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div
      className={`relative flex flex-col h-full border-r border-slate-200 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out z-10 ${
        isOpen ? "w-64" : "w-12"
      }`}
    >
      {/* Collapse/expand toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-5 -right-3.5 z-20 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-400 hover:text-slate-800 rounded-full p-1 shadow-md transition-all duration-150"
        aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <CaretLeft className="w-3.5 h-3.5" /> : <CaretRight className="w-3.5 h-3.5" />}
      </button>

      {isOpen ? (
        <>
          {/* Panel header */}
          <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <ClockCounterClockwise className="w-3.5 h-3.5 text-slate-500" weight="duotone" />
              </div>
              <h2 className="text-xs font-bold text-slate-700 font-sans">Scan Records</h2>
            </div>
            <span className="font-mono text-[10px] text-slate-550 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
              {scanHistory.length}
            </span>
          </div>

          {/* Scan list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center h-36 space-y-3">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-brand rounded-full animate-spin"></div>
                <span className="font-sans text-[10px] text-slate-400 tracking-wide">Syncing records...</span>
              </div>
            ) : scanHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-[10px] font-sans tracking-wide">
                No past scans found
              </div>
            ) : (
              scanHistory.map((item, index) => {
                const isSelected = currentResult?.analyzedAt === item.analyzedAt;
                const baseImage = getBaseImageForResult(item);
                return (
                  <button
                    key={`${item.analyzedAt}-${index}`}
                    onClick={() => selectResult(item)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border-l-2 text-left transition-all duration-150 ${
                      isSelected
                        ? `bg-slate-50 border border-slate-200 ${getSelectedBorderColor(item.verdict)}`
                        : "bg-white hover:bg-slate-50/80 border border-slate-200/50 hover:border-slate-200 border-l-transparent"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-black flex-shrink-0">
                      <img src={baseImage} alt="scan thumbnail" className="w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                      <div className="absolute bottom-0.5 right-0.5 bg-black/60 px-1 rounded text-[7px] font-mono text-slate-300 uppercase">
                        {item.mediaType === "video" ? "VID" : "IMG"}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-sans font-semibold border flex items-center gap-1 leading-none ${getVerdictStyle(item.verdict)}`}>
                          {getVerdictIcon(item.verdict)}
                          {getSentenceCase(item.verdict)}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                          {item.trustScore}
                          <span className="text-[9px] text-slate-400 font-normal">%</span>
                        </span>
                      </div>

                      <div className="flex items-center text-[9px] text-slate-400 font-mono gap-1 truncate mt-0.5">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" weight="regular" />
                        <span className="truncate">{formatTimestamp(item.analyzedAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Collapsed state */
        <div className="flex flex-col items-center pt-8 space-y-5">
          <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-50">
            <ClockCounterClockwise className="w-3.5 h-3.5 text-slate-400" weight="duotone" />
          </div>
          <span className="font-mono text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 w-7 h-7 rounded-full flex items-center justify-center">
            {scanHistory.length}
          </span>
        </div>
      )}
    </div>
  );
};
