import React, { useState, useEffect } from "react";
import { ScanHistoryPanel } from "./ScanHistoryPanel";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { 
  ShieldCheck, 
  Pulse, 
  Cpu, 
  Image, 
  Video, 
  ClockCounterClockwise, 
  FileText, 
  Stack 
} from "@phosphor-icons/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [systemTime, setSystemTime] = useState("");
  const { resetCurrentResult } = useAnalysisStore();

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setSystemTime(date.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Left Nav Rail items matching the reference screenshot pattern
  const navRailItems = [
    { label: "Image Scan", icon: Image, color: "text-[#1ca7c4]", bg: "bg-[#1ca7c4]/15" },
    { label: "Video Scan", icon: Video, color: "text-[#ff9f43]", bg: "bg-[#ff9f43]/15" },
    { label: "Scan History", icon: ClockCounterClockwise, color: "text-[#4834d4]", bg: "bg-[#4834d4]/15" },
    { label: "Reports", icon: FileText, color: "text-[#2ed573]", bg: "bg-[#2ed573]/15" },
    { label: "Bulk Scan", icon: Stack, color: "text-[#eb4d4b]", bg: "bg-[#eb4d4b]/15" },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-transparent text-slate-800 font-sans">
      
      {/* Precision Light Header */}
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between z-20 flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-light p-2 rounded-xl border border-brand/20 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-brand" weight="duotone" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] uppercase font-sans m-0 text-slate-900 leading-none">
              TRUTH<span className="text-brand">LENS</span>
            </h1>
            <p className="text-[8px] text-slate-500 font-sans tracking-[0.25em] uppercase m-0 mt-1 font-semibold">
              Authenticity Verification Suite
            </p>
          </div>
        </div>

        {/* Diagnostic Metadata */}
        <div className="flex items-center space-x-4 text-[10px] text-slate-550 select-none">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Pulse className="w-4 h-4 text-brand" weight="duotone" />
            <span className="text-slate-400 font-sans font-medium">Sys:</span>
            <span className="text-brand font-mono font-bold flex items-center gap-1">
              ONLINE
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Cpu className="w-4 h-4 text-brand" weight="duotone" />
            <span className="text-slate-400 font-sans font-medium">Engine:</span>
            <span className="text-slate-800 font-mono font-bold">TRUFOR_v4.2</span>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono font-bold text-slate-800 shadow-sm">
            <span>{systemTime}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Navigation Rail - Leftmost vertical sidebar matching the reference screenshot */}
        <div className="w-[72px] bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 flex-shrink-0 z-10 shadow-sm">
          {navRailItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={resetCurrentResult}
                className="w-14 flex flex-col items-center gap-1 p-1 hover:bg-slate-50 rounded-xl transition-all duration-200 group text-center"
                title={item.label}
              >
                {/* Rounded pastel icon badge */}
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${item.color}`} weight="duotone" />
                </div>
                <span className="text-[8px] font-semibold tracking-tight text-slate-500 font-sans leading-none truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* History Panel */}
        <ScanHistoryPanel isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Content View Area */}
        <main className="flex-1 h-full overflow-y-auto bg-transparent relative custom-scrollbar flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
