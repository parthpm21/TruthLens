import { create } from "zustand";
import type { AnalysisResult } from "../types/analysis";
import { analyzeMedia, analyzeUrl, getScanHistory, downloadReport } from "../api/client";

export type UploadTab = "file" | "url" | "presets";

interface AnalysisState {
  scanHistory: AnalysisResult[];
  currentResult: AnalysisResult | null;
  selectedFile: File | null;
  selectedFilePreview: string | null;
  uploadTab: UploadTab;
  isAnalyzing: boolean;
  analysisProgressText: string;
  selectedOverlayMode: "original" | "localization" | "confidence" | "gradcam";
  activeFrameIndex: number;
  isLoadingHistory: boolean;
  error: string | null;

  // Modals state
  isDeepExifOpen: boolean;

  // Actions
  setUploadTab: (tab: UploadTab) => void;
  setFile: (file: File) => void;
  clearFile: () => void;
  uploadAndAnalyze: () => Promise<void>;
  analyzeUrlStream: (url: string, preferredMediaType?: "image" | "video") => Promise<void>;
  analyzePreset: (preset: AnalysisResult) => Promise<void>;
  fetchScanHistory: () => Promise<void>;
  selectResult: (result: AnalysisResult) => void;
  downloadReportPdf: (url: string) => Promise<void>;
  resetCurrentResult: () => void;
  setSelectedOverlayMode: (mode: "original" | "localization" | "confidence" | "gradcam") => void;
  setActiveFrameIndex: (index: number) => void;
  setIsDeepExifOpen: (open: boolean) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  scanHistory: [],
  currentResult: null,
  selectedFile: null,
  selectedFilePreview: null,
  uploadTab: "file",
  isAnalyzing: false,
  analysisProgressText: "Initializing telemetry...",
  selectedOverlayMode: "original",
  activeFrameIndex: 0,
  isLoadingHistory: false,
  error: null,
  isDeepExifOpen: false,

  setUploadTab: (tab: UploadTab) => {
    set({ uploadTab: tab, error: null });
  },

  setIsDeepExifOpen: (open: boolean) => {
    set({ isDeepExifOpen: open });
  },

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
    }, 700);

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

  analyzeUrlStream: async (url: string, preferredMediaType?: "image" | "video") => {
    if (!url || !url.trim()) {
      set({ error: "Please enter a valid media stream URL." });
      return;
    }

    set({ 
      isAnalyzing: true, 
      error: null, 
      analysisProgressText: "Ingesting remote URL stream..." 
    });

    const progressTexts = [
      "Resolving HTTP/TLS headers...",
      "Extracting media chunks...",
      "Executing neural classifier...",
      "Computing spatial & spectral heatmaps...",
      "Assembling forensic audit certificate..."
    ];
    let progressIdx = 0;

    const intervalId = setInterval(() => {
      progressIdx = (progressIdx + 1) % progressTexts.length;
      set({ analysisProgressText: progressTexts[progressIdx] });
    }, 650);

    try {
      const result = await analyzeUrl(url.trim(), preferredMediaType);
      clearInterval(intervalId);

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
        error: err?.message || "Failed to ingest and analyze URL stream."
      });
    }
  },

  analyzePreset: async (preset: AnalysisResult) => {
    set({ 
      isAnalyzing: true, 
      error: null, 
      analysisProgressText: "Loading sample telemetry..." 
    });

    const progressTexts = [
      "Loading neural weights...",
      "Verifying cryptographic hash...",
      "Extracting confidence maps...",
      "Synthesizing forensic dashboard..."
    ];
    let progressIdx = 0;

    const intervalId = setInterval(() => {
      progressIdx = (progressIdx + 1) % progressTexts.length;
      set({ analysisProgressText: progressTexts[progressIdx] });
    }, 500);

    // Short simulate delay
    setTimeout(() => {
      clearInterval(intervalId);
      const freshResult: AnalysisResult = {
        ...preset,
        analyzedAt: new Date().toISOString()
      };
      const currentHistory = get().scanHistory;
      set({
        currentResult: freshResult,
        scanHistory: [freshResult, ...currentHistory],
        isAnalyzing: false,
        selectedFile: null,
        selectedFilePreview: null,
        selectedOverlayMode: "original",
        activeFrameIndex: 0
      });
    }, 1600);
  },

  fetchScanHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const history = await getScanHistory();
      set({ scanHistory: history, isLoadingHistory: false });
    } catch (_err) {
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
      
      const filename = url.split("/").pop() || "forensic-report.pdf";
      link.setAttribute("download", filename);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (_err) {
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
