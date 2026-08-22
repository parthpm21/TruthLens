import React, { useEffect, useState } from "react";
import { ShieldCheck, TerminalWindow } from "@phosphor-icons/react";

interface IntroLoaderProps {
  onComplete: () => void;
}

export const IntroLoader: React.FC<IntroLoaderProps> = ({ onComplete }) => {
  const [percentage, setPercentage] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("truthlens_intro_loaded");
    if (hasLoaded === "true") {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 80);

    const timeout = setTimeout(() => {
      triggerFadeOut();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  const triggerFadeOut = () => {
    setIsFadingOut(true);
    sessionStorage.setItem("truthlens_intro_loaded", "true");
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div
      onClick={triggerFadeOut}
      className={`fixed inset-0 bg-[#fafafa] z-50 flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-300 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-scan-grid opacity-30 pointer-events-none"></div>
      
      {/* Subtle Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(28,167,196,0.08)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="relative flex flex-col items-center max-w-lg px-6 text-center">
        {/* Animated Icon Ring */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 rounded-full bg-brand/10 blur-xl group-hover:bg-brand/20 transition-all duration-500 animate-pulse"></div>
          <div className="relative border border-brand/20 bg-white p-5 rounded-2xl flex items-center justify-center shadow-md">
            <ShieldCheck className="w-10 h-10 text-brand animate-pulse" weight="duotone" />
          </div>
        </div>

        {/* Logo with Laser reveal effect */}
        <div className="relative overflow-hidden py-2 px-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-[0.2em] uppercase font-sans text-slate-800 leading-none relative select-none">
            TRUTH<span className="text-brand">LENS</span>
          </h1>
          <div className="absolute top-0 bottom-0 w-1 bg-brand shadow-[0_0_12px_#1ca7c4] opacity-80 animate-laser-sweep"></div>
        </div>

        {/* Progress loading bar */}
        <div className="w-48 bg-slate-200/80 border border-slate-300/40 h-1.5 rounded-full overflow-hidden mt-8 relative">
          <div 
            className="h-full bg-brand transition-all duration-100 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Telemetry sub-text */}
        <div className="mt-4 flex flex-col items-center gap-1.5 text-slate-500 font-sans text-xs">
          <div className="flex items-center gap-2">
            <TerminalWindow className="w-4.5 h-4.5 text-brand animate-pulse" weight="duotone" />
            <span className="text-[11px] font-medium tracking-wide">
              Connecting secure pipeline... <span className="font-mono text-slate-850 font-bold ml-1">{percentage}%</span>
            </span>
          </div>
          <span className="text-[9px] opacity-60 uppercase tracking-widest mt-2">[ Click anywhere to skip ]</span>
        </div>
      </div>
    </div>
  );
};
