import React, { useEffect, useRef } from "react";
import type { AudioForensicsData } from "../types/analysis";
import { useAnalysisStore } from "../store/useAnalysisStore";
import {
  Play,
  Pause,
  SpeakerHigh,
  Waveform,
  MicrophoneStage,
  Cpu,
  WarningOctagon,
  CheckCircle,
  Clock,
  Sparkle
} from "@phosphor-icons/react";

interface AudioForensicsViewProps {
  forensics: AudioForensicsData;
  verdict: "authentic" | "manipulated" | "uncertain";
}

export const AudioForensicsView: React.FC<AudioForensicsViewProps> = ({ forensics, verdict }) => {
  const { isPlayingAudio, audioCurrentTime, setIsPlayingAudio, setAudioCurrentTime, toggleAudioPlayback } = useAnalysisStore();
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Simulate audio playback timing
  useEffect(() => {
    if (isPlayingAudio) {
      lastTimeRef.current = Date.now();
      const step = () => {
        const now = Date.now();
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        const nextTime = audioCurrentTime + delta;
        if (nextTime >= forensics.durationSeconds) {
          setAudioCurrentTime(0);
          setIsPlayingAudio(false);
        } else {
          setAudioCurrentTime(nextTime);
          animationRef.current = requestAnimationFrame(step);
        }
      };
      animationRef.current = requestAnimationFrame(step);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlayingAudio, audioCurrentTime, forensics.durationSeconds, setAudioCurrentTime, setIsPlayingAudio]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    return `${m.toString().padStart(2, "0")}:${s.padStart(4, "0")}`;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setAudioCurrentTime(ratio * forensics.durationSeconds);
  };

  const isManipulated = verdict === "manipulated";
  const progressPercent = (audioCurrentTime / forensics.durationSeconds) * 100;

  return (
    <div className="space-y-5">
      {/* Audio Playback & Waveform Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand/10 border border-brand/20 text-brand">
              <SpeakerHigh className="w-4 h-4" weight="duotone" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">
                Vocal Signal Waveform Scrubber
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {forensics.sampleRate} · {forensics.bitrate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-brand" />
            <span>{formatTime(audioCurrentTime)}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-400">{formatTime(forensics.durationSeconds)}</span>
          </div>
        </div>

        {/* Interactive Waveform Container */}
        <div 
          onClick={handleWaveformClick}
          className="relative h-24 bg-slate-900 rounded-xl p-3 flex items-center justify-between gap-1 cursor-pointer overflow-hidden group select-none shadow-inner"
        >
          {/* Progress fill background */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-brand/15 pointer-events-none transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Current Playhead bar */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-brand shadow-[0_0_8px_rgba(28,167,196,0.9)] z-20 pointer-events-none transition-all duration-75"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Waveform Bars */}
          {forensics.waveformPoints.map((point, idx) => {
            const barProgress = (idx / forensics.waveformPoints.length) * 100;
            const isPlayed = barProgress <= progressPercent;
            
            // Check if bar is in synthetic segment
            const currentTimeAtBar = (idx / forensics.waveformPoints.length) * forensics.durationSeconds;
            const isAnomaly = forensics.syntheticSegments.some(
              (seg) => currentTimeAtBar >= seg.startTime && currentTimeAtBar <= seg.endTime
            );

            let barColor = isAnomaly ? "bg-anomaly" : isPlayed ? "bg-brand" : "bg-slate-700";
            if (isPlayed && isAnomaly) barColor = "bg-anomaly shadow-[0_0_6px_rgba(239,68,68,0.8)]";

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-center items-center h-full group/bar"
              >
                <div
                  className={`w-full max-w-[6px] rounded-full transition-all duration-100 ${barColor}`}
                  style={{ height: `${Math.max(12, point * 100)}%` }}
                />
              </div>
            );
          })}

          {/* Anomaly segment marker badges */}
          {forensics.syntheticSegments.map((seg, idx) => {
            const leftPct = (seg.startTime / forensics.durationSeconds) * 100;
            const widthPct = ((seg.endTime - seg.startTime) / forensics.durationSeconds) * 100;
            return (
              <div
                key={idx}
                className="absolute bottom-1 h-1.5 bg-anomaly/80 rounded-full border border-anomaly/40 pointer-events-none"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`Anomaly detected: ${seg.anomalyType}`}
              />
            );
          })}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleAudioPlayback}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold font-sans shadow-sm transition-all"
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-4 h-4" weight="fill" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" weight="fill" />
                <span>Simulate Playback</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-4 text-[11px] font-sans font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" /> Harmonic Signal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-anomaly inline-block" /> Synthetic Glitch
            </span>
          </div>
        </div>

      </div>

      {/* Spectrogram & Vocal Synthesis Model Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Spectrogram Canvas */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Waveform className="w-4 h-4 text-brand" weight="duotone" />
              <h4 className="text-xs font-bold text-slate-800 font-sans">
                Fourier Spectrogram & Resonator Head
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              0 Hz – {forensics.spectralCutoffFrequencyKhz} kHz
            </span>
          </div>

          <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
            <img
              src={forensics.spectrogramUrl}
              alt="Audio Spectrogram"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs px-2 py-1 rounded text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
              STFT Window: 1024 / Hop: 256
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            {isManipulated
              ? "High-frequency vocoder brickwall filter detected at 20.2 kHz with missing continuous formants."
              : "Continuous acoustic reverberation with natural harmonic distribution across all vocal formants."}
          </p>
        </div>

        {/* Vocal Biometrics & Synth Classifier */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
              <MicrophoneStage className="w-4 h-4 text-brand" weight="duotone" />
              <h4 className="text-xs font-bold text-slate-800 font-sans">
                Biometric Vocal Tract Indicators
              </h4>
            </div>

            {/* Synthesizer signature match box */}
            <div className={`p-3 rounded-xl border mb-3 flex items-start gap-2.5 ${
              isManipulated ? "bg-anomaly/8 border-anomaly/20" : "bg-authentic/8 border-authentic/20"
            }`}>
              <Cpu className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isManipulated ? "text-anomaly" : "text-authentic"}`} weight="duotone" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-500 font-sans">Identified Voice Profile</p>
                <p className={`text-xs font-bold font-sans truncate ${isManipulated ? "text-anomaly" : "text-authentic"}`}>
                  {forensics.synthesizerModel}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                  Classifier Confidence: {forensics.synthesizerConfidence}%
                </p>
              </div>
            </div>

            {/* Vocal Metric stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">Vocal Jitter (Pitch)</span>
                <span className={`font-mono font-bold ${forensics.vocalJitterPercent < 0.2 ? "text-anomaly" : "text-authentic"}`}>
                  {forensics.vocalJitterPercent}% {forensics.vocalJitterPercent < 0.2 ? "(Unnatural)" : "(Normal)"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">Shimmer (Amplitude)</span>
                <span className="font-mono font-bold text-slate-800">
                  {forensics.shimmerPercent}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">Harmonics/Noise (HNR)</span>
                <span className="font-mono font-bold text-slate-800">
                  {forensics.harmonicsToNoiseRatioDb} dB
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-sans">Biological Respiration</span>
                <span className={`font-sans font-bold flex items-center gap-1 ${
                  forensics.breathArtifactsDetected ? "text-authentic" : "text-anomaly"
                }`}>
                  {forensics.breathArtifactsDetected ? (
                    <>
                      <CheckCircle className="w-3 h-3" weight="bold" />
                      Detected
                    </>
                  ) : (
                    <>
                      <WarningOctagon className="w-3 h-3" weight="bold" />
                      Absent
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Anomaly segment triggers */}
          {forensics.syntheticSegments.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Timestamped Anomaly Segments:
              </span>
              <div className="space-y-1.5">
                {forensics.syntheticSegments.map((seg, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAudioCurrentTime(seg.startTime)}
                    className="w-full text-left p-2 rounded-lg bg-anomaly/5 hover:bg-anomaly/10 border border-anomaly/20 flex items-center justify-between text-[11px] font-sans transition-colors group"
                  >
                    <span className="font-bold text-anomaly flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" weight="duotone" />
                      {seg.startTime.toFixed(1)}s – {seg.endTime.toFixed(1)}s
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{seg.anomalyType}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
