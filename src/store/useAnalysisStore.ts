import { create } from "zustand";
import type { AnalysisResult } from "../types/analysis";
import { analyzeMedia, getScanHistory, downloadReport } from "../api/client";

interface AnalysisState {
  scanHistory: AnalysisResult[];
  currentResult: AnalysisResult | null;
  selectedFile: File | null;
  selectedFilePreview: string | null;
  isAnalyzing: boolean;
  analysisProgressText: string;
  selectedOverlayMode: "original" | "localization" | "confidence" | "gradcam";
  activeFrameIndex: number;
  isLoadingHistory: boolean;
  error: string | null;

  // Actions
  setFile: (file: File) => void;
  clearFile: () => void;
  uploadAndAnalyze: () => Promise<void>;
  fetchScanHistory: () => Promise<void>;
  selectResult: (result: AnalysisResult) => void;
  downloadReportPdf: (url: string) => Promise<void>;
  resetCurrentResult: () => void;
  setSelectedOverlayMode: (mode: "original" | "localization" | "confidence" | "gradcam") => void;
  setActiveFrameIndex: (index: number) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  scanHistory: [],
  currentResult: null,
  selectedFile: null,
  selectedFilePreview: null,
  isAnalyzing: false,
  analysisProgressText: "Initializing telemetry...",
  selectedOverlayMode: "original",
  activeFrameIndex: 0,
  isLoadingHistory: false,
  error: null,

  setFile: (file: File) => {
    // Revoke old object URL if exists
    const prevPreview = get().selectedFilePreview;
    if (prevPreview) {
      URL.revokeObjectURL(prevPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    set({
      selectedFile: file,
      selectedFilePreview: previewUrl,
      error: null,
    });
  },

  clearFile: () => {
    const preview = get().selectedFilePreview;
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    set({
      selectedFile: null,
      selectedFilePreview: null,
      error: null,
    });
  },

  uploadAndAnalyze: async () => {
    const file = get().selectedFile;
    if (!file) return;

    set({ isAnalyzing: true, error: null, analysisProgressText: "Extracting features..." });

    // Progress text cycling intervals
    const progressTexts = [
      "Extracting features...",
      "Running localization...",
      "Generating explanation...",
      "Synthesizing visual overlays...",
      "Finalizing forensics report..."
    ];
    let progressIdx = 0;

    const intervalId = setInterval(() => {
      progressIdx = (progressIdx + 1) % progressTexts.length;
      set({ analysisProgressText: progressTexts[progressIdx] });
    }, 800);

    try {
      const result = await analyzeMedia(file);
      
      clearInterval(intervalId);

      // Add to local scan history (prepend so newest is first)
      const currentHistory = get().scanHistory;
      
      set({
        currentResult: result,
        scanHistory: [result, ...currentHistory],
        isAnalyzing: false,
        selectedFile: null,
        selectedFilePreview: null,
        selectedOverlayMode: "original",
        activeFrameIndex: 0
      });
    } catch (err: any) {
      clearInterval(intervalId);
      set({
        isAnalyzing: false,
        error: err?.message || "An error occurred during media analysis."
      });
    }
  },

  fetchScanHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const history = await getScanHistory();
      set({ scanHistory: history, isLoadingHistory: false });
    } catch (err: any) {
      set({ isLoadingHistory: false, error: "Failed to fetch scan history." });
    }
  },

  selectResult: (result: AnalysisResult) => {
    set({
      currentResult: result,
      selectedFile: null,
      selectedFilePreview: null,
      selectedOverlayMode: "original",
      activeFrameIndex: 0,
      error: null
    });
  },

  downloadReportPdf: async (url: string) => {
    try {
      const blob = await downloadReport(url);
      
      // Trigger browser download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      // Extract file name from url or default
      const filename = url.split("/").pop() || "forensic-report.pdf";
      link.setAttribute("download", filename);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      set({ error: "Failed to download forensic report." });
    }
  },

  resetCurrentResult: () => {
    set({
      currentResult: null,
      selectedOverlayMode: "original",
      activeFrameIndex: 0,
      error: null
    });
  },

  setSelectedOverlayMode: (mode) => {
    set({ selectedOverlayMode: mode });
  },

  setActiveFrameIndex: (index) => {
    set({ activeFrameIndex: index });
  }
}));
