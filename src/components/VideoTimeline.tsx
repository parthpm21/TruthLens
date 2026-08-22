import React from "react";
import { FilmStrip, Clock } from "@phosphor-icons/react";

interface VideoFrame {
  timestampSeconds: number;
  frameThumbnailUrl: string;
  frameTrustScore: number;
}

interface VideoTimelineProps {
  frames: VideoFrame[];
  activeFrameIndex: number;
  onFrameClick: (index: number) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  frames,
  activeFrameIndex,
  onFrameClick,
}) => {
  const getScoreStyle = (score: number) => {
    if (score >= 70) return { textClass: "text-authentic", barClass: "bg-authentic" };
    if (score >= 40) return { textClass: "text-warning",  barClass: "bg-warning"  };
    return                 { textClass: "text-anomaly",   barClass: "bg-anomaly"   };
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
            <FilmStrip className="w-3.5 h-3.5 text-brand" weight="duotone" />
          </div>
          <span className="text-xs font-bold text-slate-700 font-sans">Frame Timeline</span>
        </div>
        <span className="font-sans text-[10px] font-semibold text-slate-500">
          {frames.length} frames sampled
        </span>
      </div>

      {/* Filmstrip scroll area */}
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {frames.map((frame, index) => {
            const isActive = index === activeFrameIndex;
            const s = getScoreStyle(frame.frameTrustScore);
            return (
              <button
                key={index}
                onClick={() => onFrameClick(index)}
                className={`flex-shrink-0 flex flex-col rounded-xl overflow-hidden border transition-all duration-150 group ${
                  isActive
                    ? "border-brand shadow-sm scale-[1.01]"
                    : "border-slate-200 hover:border-slate-400 hover:scale-[1.01]"
                }`}
                style={{ width: 112 }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={frame.frameThumbnailUrl}
                    alt={`Frame ${index + 1}`}
                    className={`w-full h-full object-cover transition-opacity duration-150 ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-95"}`}
                  />
                  {isActive && (
                    <div className="absolute inset-0 border-2 border-brand/40 pointer-events-none" />
                  )}
                  {/* Frame badge — label Geist Sans, no all-caps */}
                  <span className="absolute top-1 left-1.5 font-sans text-[8px] font-bold text-white bg-black/60 px-1 py-0.5 rounded-sm">
                    F{index + 1}
                  </span>
                </div>

                {/* Trust score fill bar */}
                <div className={`h-1 ${s.barClass} opacity-90`} style={{ width: `${frame.frameTrustScore}%`, transition: "width 0.6s ease" }} />
                <div className="h-0.5 w-full bg-slate-100" />

                {/* Footer — timestamp in Geist Mono, score% in Geist Mono */}
                <div className="px-2.5 py-2 bg-slate-50/50 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 text-[8px] font-mono text-slate-450">
                    <Clock className="w-2.5 h-2.5" weight="regular" />
                    <span>{formatTime(frame.timestampSeconds)}</span>
                  </div>
                  <span className={`font-mono text-[9px] font-bold tabular-nums ${s.textClass}`}>
                    {frame.frameTrustScore}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
