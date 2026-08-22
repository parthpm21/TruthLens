import React from "react";
import { Database, CheckCircle, Warning, Info, Clock } from "@phosphor-icons/react";

interface MetadataPanelProps {
  metadata: {
    exifPresent: boolean;
    compressionArtifactsDetected: boolean;
    notes: string[];
  };
  analyzedAt: string;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata, analyzedAt }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
            <Database className="w-3.5 h-3.5 text-brand" weight="duotone" />
          </div>
          <span className="text-xs font-bold text-slate-700 font-sans">
            Metadata Forensics
          </span>
        </div>
        <span className="font-sans text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          Structural Checks
        </span>
      </div>

      <div className="p-5 space-y-4 flex flex-col">
        {/* Structural check grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* EXIF */}
          <div className={`rounded-xl p-3 border flex flex-col gap-2 ${
            metadata.exifPresent
              ? "bg-authentic/5 border-authentic/20"
              : "bg-warning/5 border-warning/20"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[9px] font-semibold text-slate-500">Exif signature</span>
              {metadata.exifPresent
                ? <CheckCircle className="w-4 h-4 text-authentic" weight="duotone" />
                : <Warning className="w-4 h-4 text-warning" weight="duotone" />
              }
            </div>
            <span className={`font-sans text-xs font-bold ${metadata.exifPresent ? "text-authentic" : "text-warning"}`}>
              {metadata.exifPresent ? "Present" : "Stripped"}
            </span>
          </div>

          {/* Compression */}
          <div className={`rounded-xl p-3 border flex flex-col gap-2 ${
            metadata.compressionArtifactsDetected
              ? "bg-anomaly/5 border-anomaly/20"
              : "bg-authentic/5 border-authentic/20"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[9px] font-semibold text-slate-500">Compression</span>
              {metadata.compressionArtifactsDetected
                ? <Warning className="w-4 h-4 text-anomaly" weight="duotone" />
                : <CheckCircle className="w-4 h-4 text-authentic" weight="duotone" />
              }
            </div>
            <span className={`font-sans text-xs font-bold ${metadata.compressionArtifactsDetected ? "text-anomaly" : "text-authentic"}`}>
              {metadata.compressionArtifactsDetected ? "Detected" : "Nominal"}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Info className="w-3.5 h-3.5 text-slate-400" weight="regular" />
            <span className="font-sans text-[10px] font-bold text-slate-600">Forensic Observations</span>
          </div>
          <div className="space-y-2 bg-[#f8fafc] border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar">
            {metadata.notes.map((note, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed font-sans">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp — label in Geist Sans, value in Geist Mono */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-450">
            <Clock className="w-3.5 h-3.5 text-slate-400" weight="regular" />
            <span className="font-sans text-[9px] font-semibold text-slate-500">Analyzed at</span>
          </div>
          <span className="font-mono text-[9px] text-slate-500 tabular-nums">{new Date(analyzedAt).toISOString().replace("T", " ").substring(0, 19)}</span>
        </div>
      </div>
    </div>
  );
};
