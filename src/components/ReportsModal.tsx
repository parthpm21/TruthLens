import React from "react";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { X, FileText, DownloadSimple, ShieldCheck, ShieldWarning, SealQuestion, CheckCircle } from "@phosphor-icons/react";

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const { scanHistory, downloadReportPdf } = useAnalysisStore();

  if (!isOpen) return null;

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "authentic":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-authentic/10 text-authentic border border-authentic/20">
            <ShieldCheck className="w-3.5 h-3.5" weight="duotone" />
            Authentic
          </span>
        );
      case "manipulated":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-anomaly/10 text-anomaly border border-anomaly/20">
            <ShieldWarning className="w-3.5 h-3.5" weight="duotone" />
            Manipulated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning border border-warning/20">
            <SealQuestion className="w-3.5 h-3.5" weight="duotone" />
            Uncertain
          </span>
        );
    }
  };

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
              <FileText className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Forensic Dossier Archive
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Exportable authenticity verification certificates & SHA-256 audit logs
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
        <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {scanHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-sans">
              No analysis dossiers generated yet. Run a media scan to generate certificates.
            </div>
          ) : (
            scanHistory.map((item, idx) => (
              <div
                key={`${item.analyzedAt}-${idx}`}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 mt-0.5 flex-shrink-0">
                    <FileText className="w-4 h-4 text-brand" weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate font-sans">
                        Dossier #{item.analyzedAt.slice(0, 10).replace(/-/g, "")}-{idx + 101}
                      </span>
                      {getVerdictBadge(item.verdict)}
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5 truncate">
                      {item.mediaType.toUpperCase()} · Trust Score: {item.trustScore}% · Conf: {Math.round(item.classifierConfidence * 100)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => downloadReportPdf(item.reportDownloadUrl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold font-sans transition-colors shadow-xs"
                  >
                    <DownloadSimple className="w-3.5 h-3.5 text-brand" weight="bold" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-authentic" weight="duotone" />
            Cryptographically signed with SHA-256
          </span>
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
