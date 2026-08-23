import React, { useState } from "react";
import { X, Stack, Upload, CheckCircle, Sparkle } from "@phosphor-icons/react";

interface BulkScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkScanModal: React.FC<BulkScanModalProps> = ({ isOpen, onClose }) => {
  const [queuedFiles] = useState<Array<{ name: string; size: string; status: "queued" | "processing" | "completed" }>>([
    { name: "surveillance_feed_cam04.mp4", size: "48.2 MB", status: "completed" },
    { name: "interview_press_briefing.png", size: "3.4 MB", status: "completed" },
    { name: "social_media_leak_target.jpg", size: "1.8 MB", status: "processing" },
    { name: "broadcast_segment_raw.mov", size: "124.5 MB", status: "queued" },
  ]);

  if (!isOpen) return null;

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
              <Stack className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Batch Forensic Pipeline
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Multi-asset queue processing with parallel TruFor neural inference
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
          {/* Dropzone notice */}
          <div className="border-2 border-dashed border-slate-300 hover:border-brand bg-slate-50/50 hover:bg-brand/5 rounded-xl p-5 text-center cursor-pointer transition-all">
            <Upload className="w-6 h-6 text-brand mx-auto mb-2" weight="duotone" />
            <p className="text-xs font-bold text-slate-700 font-sans">
              Drop multiple images & videos here for batch ingestion
            </p>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Supports up to 50 assets per batch (JPEG, PNG, MP4, MOV)
            </p>
          </div>

          {/* Queue List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 font-sans px-1">
              <span>Pipeline Queue ({queuedFiles.length} items)</span>
              <span className="text-brand font-mono text-[10px]">Parallel Workers: 4 Active</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
              {queuedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-slate-800 text-[11px] font-semibold truncate">{file.name}</p>
                    <p className="font-mono text-[10px] text-slate-400">{file.size}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.status === "completed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-sans bg-authentic/10 text-authentic border border-authentic/20">
                        <CheckCircle className="w-3.5 h-3.5" weight="duotone" />
                        Verified
                      </span>
                    )}
                    {file.status === "processing" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-sans bg-brand/10 text-brand border border-brand/20 animate-pulse">
                        <Sparkle className="w-3.5 h-3.5" weight="duotone" />
                        Analyzing...
                      </span>
                    )}
                    {file.status === "queued" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-sans bg-slate-200 text-slate-600">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span>Enterprise REST API Endpoint: <code className="font-mono text-brand bg-slate-100 px-1 py-0.5 rounded">/api/v4/forensics/bulk</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
