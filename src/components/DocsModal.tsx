import React from "react";
import { X, ShieldCheck, CheckCircle, Info, Eye } from "@phosphor-icons/react";

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
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
              <ShieldCheck className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Forensic Methodology & Verification Guide
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Understanding TruFor heatmaps, Confidence maps, and Trust Index ratings
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
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs font-sans text-slate-650 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand" weight="duotone" />
              1. Localized Anomaly Localization
            </h4>
            <p>
              TruthLens employs a two-stream deep neural network combining RGB pixel correlation and high-frequency noise residuals (Noiseprint). Pixels marked in <strong className="text-anomaly">Red</strong> exhibit statistical anomalies characteristic of GAN, Diffusion (Midjourney/Flux), or deepfake face swapping.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-authentic" weight="duotone" />
              2. Fused Trust Index Interpretation
            </h4>
            <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
              <li><strong className="text-authentic">80% – 100% (Authentic):</strong> Sensor noise pattern consistent with physical camera sensor; no generative hallucination detected.</li>
              <li><strong className="text-warning">45% – 79% (Uncertain):</strong> Heavy compression artifacts or minor post-processing filters detected; inconclusive.</li>
              <li><strong className="text-anomaly">0% – 44% (Manipulated):</strong> High-confidence structural tampering, inpainting, or synthetic generative model signatures found.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-brand" weight="duotone" />
              3. Forensic Dossier Export
            </h4>
            <p>
              Each forensic report includes an immutable verification token, EXIF header analysis, frame-by-frame temporal breakdown for video streams, and full-resolution Grad-CAM attention visualizations.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span>TruthLens Standard v4.2 · ISO/IEC 27037 Compliant</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
