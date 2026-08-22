import React from "react";
import { ChartDonut } from "@phosphor-icons/react";

interface TrustScoreGaugeProps {
  score: number;
  verdict: "authentic" | "manipulated" | "uncertain";
  classifierConfidence: number;
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({
  score,
  verdict,
  classifierConfidence,
}) => {
  const getColors = (v: typeof verdict) => {
    switch (v) {
      case "authentic":   return { stroke: "#10b981", glow: "rgba(16,185,129,0.15)", textClass: "text-authentic", bgClass: "bg-authentic/10", borderClass: "border-authentic/25" };
      case "manipulated": return { stroke: "#ef4444", glow: "rgba(239,68,68,0.15)",  textClass: "text-anomaly",  bgClass: "bg-anomaly/10",  borderClass: "border-anomaly/25"  };
      case "uncertain":   return { stroke: "#f59e0b", glow: "rgba(245,158,11,0.15)",  textClass: "text-warning",  bgClass: "bg-warning/10",  borderClass: "border-warning/25"  };
    }
  };
  const c = getColors(verdict);

  const verdictLabel: Record<typeof verdict, string> = {
    authentic: "Authentic",
    manipulated: "Manipulated",
    uncertain: "Uncertain",
  };

  // Arc parameters — 240° sweep
  const r = 48;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;
  const arcLen = (circ * 240) / 360;
  const offset = arcLen - (score / 100) * arcLen;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center overflow-hidden relative shadow-sm">
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(to right, transparent, ${c.stroke}, transparent)` }}
      />

      {/* Header row */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <ChartDonut className="w-3.5 h-3.5 text-brand" weight="duotone" />
          </div>
          <span className="text-xs font-bold text-slate-700 font-sans">Fused Trust Index</span>
        </div>
        <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${c.bgClass} ${c.textClass} ${c.borderClass}`}>
          {verdictLabel[verdict]}
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="relative w-44 h-36 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-[210deg] overflow-visible"
          viewBox="0 0 120 120"
        >
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={9}
            strokeDasharray={circ}
            strokeDashoffset={circ - arcLen}
            strokeLinecap="round"
          />
          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const angle = (-210 + (i / 10) * 240) * (Math.PI / 180);
            const x1 = cx + (r - 6) * Math.cos(angle);
            const y1 = cy + (r - 6) * Math.sin(angle);
            const x2 = cx + (r + 2) * Math.cos(angle);
            const y2 = cy + (r + 2) * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i * 10 <= score ? c.stroke : "#cbd5e1"}
                strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
                strokeOpacity={0.8}
              />
            );
          })}
          {/* Score arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={c.stroke}
            strokeWidth={9}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            filter={`drop-shadow(0 0 3px ${c.glow})`}
          />
        </svg>

        {/* Inner readout — score stays Geist Mono, label switches to Geist Sans */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 select-none">
          <span className={`font-mono text-4xl font-extrabold leading-none tabular-nums ${c.textClass}`}>
            {score}
            <span className="text-lg text-slate-400 font-normal ml-0.5">%</span>
          </span>
          <span className="font-sans text-[9px] font-semibold text-slate-500 mt-1.5 tracking-wide">
            Trust Score
          </span>
        </div>
      </div>

      {/* Auxiliary metric row — labels in Geist Sans, values in Geist Mono */}
      <div className="w-full mt-1 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="font-sans text-[9px] font-semibold text-slate-500">Classifier</span>
          <span className="font-mono text-sm font-bold text-slate-800 tabular-nums">{classifierConfidence}%</span>
        </div>
        <div className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">
          <span className="font-sans text-[9px] font-semibold text-slate-500">Calibration</span>
          <span className="font-sans text-sm font-bold text-authentic">Nominal</span>
        </div>
      </div>
    </div>
  );
};
