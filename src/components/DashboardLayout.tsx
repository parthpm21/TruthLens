import React, { useState, useEffect } from "react";
import { ScanHistoryPanel } from "./ScanHistoryPanel";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { ReportsModal } from "./ReportsModal";
import { BulkScanModal } from "./BulkScanModal";
import { DiagnosticsModal } from "./DiagnosticsModal";
import { DocsModal } from "./DocsModal";
import { 
  ShieldCheck, 
  Pulse, 
  Cpu, 
  Scan, 
  FilmStrip, 
  ClockCounterClockwise, 
  FileText, 
  Stack,
  Clock,
  Question,
  UploadSimple
} from "@phosphor-icons/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type ActiveNav = "image" | "video" | "url" | "history" | "reports" | "bulk" | "none";

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [systemTime, setSystemTime] = useState("");
  const [activeNav, setActiveNav] = useState<ActiveNav>("image");

  // Modals state
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const { resetCurrentResult, currentResult, scanHistory, setUploadTab } = useAnalysisStore();

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setSystemTime(date.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync activeNav with currentResult mediaType if present
  useEffect(() => {
    if (currentResult) {
      if (currentResult.mediaType === "video") setActiveNav("video");
      else setActiveNav("image");
    }
  }, [currentResult]);

  const handleNavClick = (id: ActiveNav) => {
    setActiveNav(id);
    if (id === "image") {
      resetCurrentResult();
      setUploadTab("file");
    } else if (id === "video") {
      resetCurrentResult();
      setUploadTab("file");
    } else if (id === "url") {
      resetCurrentResult();
      setUploadTab("url");
    } else if (id === "history") {
      setIsSidebarOpen((prev) => !prev);
    } else if (id === "reports") {
      setIsReportsOpen(true);
    } else if (id === "bulk") {
      setIsBulkOpen(true);
    }
  };

  const navRailItems = [
    {
      id: "image" as ActiveNav,
      label: "Image Scan",
      icon: Scan,
      tooltip: "Single & Multi-Layer Image Forensics",
    },
    {
      id: "video" as ActiveNav,
      label: "Video Scan",
      icon: FilmStrip,
      tooltip: "Temporal Video Stream Forensics",
    },
    {
      id: "url" as ActiveNav,
      label: "URL Stream",
      icon: Scan,
      tooltip: "Live Web & Social Media Ingestion",
    },
    {
      id: "history" as ActiveNav,
      label: "Records",
      icon: ClockCounterClockwise,
      badge: scanHistory.length > 0 ? scanHistory.length : undefined,
      tooltip: "Scan History & Audit Logs",
    },
    {
      id: "reports" as ActiveNav,
      label: "Reports",
      icon: FileText,
      tooltip: "Forensic PDF Dossiers & Certificates",
    },
    {
      id: "bulk" as ActiveNav,
      label: "Batch Scan",
      icon: Stack,
      tooltip: "Multi-Asset Parallel Ingestion",
    },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fafafa] text-slate-850 font-sans selection:bg-brand/15 selection:text-slate-900">
      
      {/* Precision Enterprise Header */}
      <header className="h-16 border-b border-slate-200/90 bg-white/90 backdrop-blur-md px-5 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 shadow-xs">
        {/* Brand & Suite title */}
        <div 
          onClick={resetCurrentResult} 
          className="flex items-center space-x-3.5 cursor-pointer select-none group"
          title="Return to home / New analysis"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand shadow-sm group-hover:scale-105 transition-transform duration-200">
            <ShieldCheck className="w-5 h-5" weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-[0.18em] uppercase font-sans m-0 text-slate-900 leading-none">
                TRUTH<span className="text-brand">LENS</span>
              </h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                v4.2
              </span>
            </div>
            <p className="text-[8.5px] text-slate-500 font-sans tracking-[0.25em] uppercase m-0 mt-1 font-semibold">
              Authenticity Verification Suite
            </p>
          </div>
        </div>

        {/* Diagnostic Metadata & Status pills */}
        <div className="flex items-center space-x-3 text-[11px] select-none">
          {/* Live Engine Status badge */}
          <div 
            onClick={() => setIsDiagnosticsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Click to view full engine telemetry"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-sans font-medium">Sys:</span>
            <span className="text-emerald-700 font-mono font-bold">
              ONLINE
            </span>
          </div>
          
          {/* Neural Engine info */}
          <div 
            onClick={() => setIsDiagnosticsOpen(true)}
            className="hidden md:flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Click to view engine architecture"
          >
            <Cpu className="w-3.5 h-3.5 text-brand" weight="duotone" />
            <span className="text-slate-400 font-sans font-medium">Engine:</span>
            <span className="text-slate-800 font-mono font-bold">TRUFOR_v4.2</span>
          </div>

          {/* UTC Clock */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl font-mono font-semibold text-slate-750 text-[10.5px] shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" weight="regular" />
            <span className="tabular-nums">{systemTime}</span>
          </div>

          {/* Quick Upload action */}
          <button
            onClick={resetCurrentResult}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold font-sans transition-all shadow-xs"
          >
            <UploadSimple className="w-3.5 h-3.5" weight="bold" />
            <span>New Scan</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Navigation Rail - Modern Professional Minimalist Sidebar */}
        <aside className="w-[74px] bg-white border-r border-slate-200/90 flex flex-col justify-between items-center py-4 flex-shrink-0 z-20 shadow-xs select-none">
          
          {/* Top & Middle Navigation Tools */}
          <div className="w-full flex flex-col items-center gap-3">
            {navRailItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <div key={item.id} className="relative group w-full flex flex-col items-center">
                  {/* Left Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-brand rounded-r-full shadow-[0_0_8px_rgba(28,167,196,0.6)]" />
                  )}

                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-[58px] flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-150 text-center relative ${
                      isActive
                        ? "text-brand"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {/* Icon Badge Container */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 relative ${
                        isActive
                          ? "bg-brand/10 border border-brand/30 text-brand shadow-xs"
                          : "bg-slate-50/80 border border-slate-200/60 text-slate-600 group-hover:bg-slate-100 group-hover:border-slate-300 group-hover:text-slate-900 shadow-2xs"
                      }`}
                    >
                      <Icon className="w-5 h-5" weight={isActive ? "fill" : "duotone"} />

                      {/* Optional Badge Count */}
                      {typeof item.badge === "number" && (
                        <span className="absolute -top-1 -right-1 bg-brand text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Micro-label */}
                    <span
                      className={`text-[8.5px] font-semibold tracking-tight font-sans leading-none truncate max-w-full uppercase ${
                        isActive ? "text-brand font-bold" : "text-slate-500 group-hover:text-slate-800"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>

                  {/* Tooltip on Hover */}
                  <div className="absolute left-[78px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                    <div className="bg-slate-900 text-white text-[11px] font-sans font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2 border border-slate-700">
                      <span>{item.tooltip}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Utility Rail Items */}
          <div className="w-full flex flex-col items-center gap-2 pt-3 border-t border-slate-100">
            {/* Engine Telemetry */}
            <div className="relative group w-full flex flex-col items-center">
              <button
                onClick={() => setIsDiagnosticsOpen(true)}
                className="w-10 h-10 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all duration-150 shadow-2xs"
                title="Engine Diagnostics"
              >
                <Pulse className="w-4.5 h-4.5" weight="duotone" />
              </button>
              <div className="absolute left-[78px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <div className="bg-slate-900 text-white text-[11px] font-sans font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
                  Engine Telemetry & Hardware Info
                </div>
              </div>
            </div>

            {/* Methodology & Guide */}
            <div className="relative group w-full flex flex-col items-center">
              <button
                onClick={() => setIsDocsOpen(true)}
                className="w-10 h-10 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all duration-150 shadow-2xs"
                title="Verification Guide"
              >
                <Question className="w-4.5 h-4.5" weight="bold" />
              </button>
              <div className="absolute left-[78px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <div className="bg-slate-900 text-white text-[11px] font-sans font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
                  Verification Methodology Guide
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* History Panel */}
        <ScanHistoryPanel isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Content View Area */}
        <main className="flex-1 h-full overflow-y-auto bg-transparent relative custom-scrollbar flex flex-col">
          {children}
        </main>
      </div>

      {/* Interactive Modals */}
      <ReportsModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} />
      <BulkScanModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} />
      <DiagnosticsModal isOpen={isDiagnosticsOpen} onClose={() => setIsDiagnosticsOpen(false)} />
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
};
