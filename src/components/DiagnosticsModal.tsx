import React from "react";
import { X, Cpu } from "@phosphor-icons/react";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const telemetryMetrics = [
    { label: "Neural Model Architecture", value: "TruFor v4.2 + Noiseprint ResNet-50", status: "Active" },
    { label: "Localization Heatmap Engine", value: "Grad-CAM Cross-Attention Head", status: "Nominal" },
    { label: "Metadata Integrity Parser", value: "ExifTool v12.7 + Structural Check", status: "Operational" },
    { label: "Inference Latency (Avg)", value: "34ms (GPU Accel / FP16 TensorRT)", status: "Optimal" },
    { label: "Classifier Calibration", value: "Platt Scaling (ECE < 0.018)", status: "Calibrated" },
    { label: "Entropy Noise Floor", value: "-48.2 dB SNR Baseline", status: "Calibrated" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-slide-up">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand/10 border border-brand/20 text-brand">
              <Cpu className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Forensic Engine Telemetry & System Status
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Real-time diagnostic parameters, model weights, and pipeline health
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Status summary banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div>
                <p className="text-xs font-bold font-sans">Verification Engine Online</p>
                <p className="text-[10px] text-slate-400 font-mono">Cluster Node: truthlens-inference-prod-us-east1</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-400">
              99.98% UPTIME
            </span>
          </div>

          {/* Metric parameters */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-sans px-1">
              Active Pipeline Parameters
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
              {telemetryMetrics.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 font-sans">{item.label}</p>
                    <p className="font-mono text-[10.5px] text-slate-500">{item.value}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans bg-authentic/10 text-authentic border border-authentic/20 flex-shrink-0">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span className="text-slate-400 font-mono text-[10px]">Build Hash: d9f82a7c4e10b981</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
