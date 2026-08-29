import React, { useRef, useState } from "react";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { mockFixtures } from "../api/fixtures";
import {
  Upload,
  Trash,
  ShieldWarning,
  CaretRight,
  Globe,
  SpeakerHigh,
  Image as ImageIcon,
  FilmStrip,
  Sparkle,
  LinkSimple,
  Play
} from "@phosphor-icons/react";

export const UploadView: React.FC = () => {
  const {
    selectedFile,
    selectedFilePreview,
    uploadTab,
    setUploadTab,
    setFile,
    clearFile,
    uploadAndAnalyze,
    analyzeUrlStream,
    analyzePreset,
    isAnalyzing,
    error
  } = useAnalysisStore();

  const [isDragActive, setIsDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (file: File) => {
    const isImage = file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|webp)$/i);
    const isVideo = file.type.startsWith("video/") || file.name.match(/\.(mp4|mov|webm)$/i);
    const isAudio = file.type.startsWith("audio/") || file.name.match(/\.(mp3|wav|m4a|ogg|flac)$/i);

    if (isImage || isVideo || isAudio) {
      setFile(file);
    } else {
      alert("Unsupported format. Upload JPEG/PNG image, MP4/MOV video, or MP3/WAV audio.");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onButtonClick = () => {
    if (uploadTab === "audio") {
      audioInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      analyzeUrlStream(urlInput.trim());
    }
  };

  const isVideo = selectedFile?.type.startsWith("video/") || false;
  const isAudio = selectedFile?.type.startsWith("audio/") || selectedFile?.name.match(/\.(mp3|wav|m4a|ogg|flac)$/i);

  const sampleUrls = [
    { label: "Viral Politician FaceSwap Clip", url: "https://truthlens.ai/samples/press-briefing-falsified.mp4", type: "video" as const },
    { label: "ElevenLabs Executive Voice Clone", url: "https://truthlens.ai/samples/executive-voice-clone.mp3", type: "audio" as const },
    { label: "Spliced Accounting Document", url: "https://truthlens.ai/samples/invoice-audit-scan.jpg", type: "image" as const },
    { label: "Authentic Podcast Interview", url: "https://truthlens.ai/samples/podcast-authentic.wav", type: "audio" as const },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 max-w-5xl mx-auto w-full">
      
      {/* Top Headline Section */}
      <div className="w-full text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans leading-tight">
          The Most <span className="text-brand">Explainable</span> Deepfake Detector!
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-sans max-w-lg mx-auto">
          Scan images, videos, audio voice clips, or public web streams with millisecond neural verification.
        </p>
      </div>

      {/* Ingestion Mode Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/80 rounded-2xl mb-6 shadow-2xs">
        <button
          onClick={() => { setUploadTab("file"); clearFile(); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all duration-150 ${
            uploadTab === "file"
              ? "bg-white text-brand shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ImageIcon className="w-4 h-4" weight="duotone" />
          <span>Image / Video</span>
        </button>

        <button
          onClick={() => { setUploadTab("audio"); clearFile(); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all duration-150 ${
            uploadTab === "audio"
              ? "bg-white text-brand shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <SpeakerHigh className="w-4 h-4" weight="duotone" />
          <span>Audio & Voice</span>
        </button>

        <button
          onClick={() => { setUploadTab("url"); clearFile(); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all duration-150 ${
            uploadTab === "url"
              ? "bg-white text-brand shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Globe className="w-4 h-4" weight="duotone" />
          <span>URL Scanner</span>
        </button>

        <button
          onClick={() => { setUploadTab("presets"); clearFile(); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-sans transition-all duration-150 ${
            uploadTab === "presets"
              ? "bg-white text-brand shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkle className="w-4 h-4" weight="duotone" />
          <span>Demo Presets</span>
        </button>
      </div>

      {error && (
        <div className="w-full mb-6 p-4 bg-anomaly/8 border border-anomaly/20 rounded-xl flex items-center gap-3 text-sm text-anomaly font-sans">
          <ShieldWarning className="w-4.5 h-4.5 flex-shrink-0" weight="duotone" />
          <span>{error}</span>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Panel: Dynamic Ingestion Container */}
        <div className="md:col-span-7 flex flex-col">
          
          {/* TAB 1 & 2: File or Audio Upload */}
          {(uploadTab === "file" || uploadTab === "audio") && (
            !selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`flex-1 min-h-[320px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 bg-white ${
                  isDragActive
                    ? "border-brand bg-brand/5 shadow-[0_0_24px_rgba(28,167,196,0.06)]"
                    : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={handleChange}
                />
                <input
                  ref={audioInputRef}
                  type="file"
                  className="hidden"
                  accept="audio/mp3,audio/wav,audio/m4a,audio/ogg,audio/flac"
                  onChange={handleChange}
                />
                
                <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-400 group-hover:scale-105 transition-all">
                  {uploadTab === "audio" ? (
                    <SpeakerHigh className="w-8 h-8 text-brand" weight="duotone" />
                  ) : (
                    <Upload className="w-8 h-8 text-brand" weight="duotone" />
                  )}
                </div>
                
                <p className="text-sm font-semibold text-slate-700 font-sans">
                  {uploadTab === "audio"
                    ? "Click to upload audio voice clip or drag & drop"
                    : "Click to upload media or drag and drop"}
                </p>
                
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-sans">
                  {uploadTab === "audio"
                    ? "Supports MP3, WAV, M4A, OGG, or FLAC up to 100MB"
                    : "Supports high-resolution JPEGs, PNGs, MP4s, or MOVs."}
                </p>
              </div>
            ) : (
              /* File Preview Mode */
              <div className="flex-1 min-h-[320px] border border-slate-200 rounded-2xl bg-white p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                  {isAudio ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center text-white">
                      <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand flex items-center justify-center text-brand animate-pulse">
                        <SpeakerHigh className="w-6 h-6" weight="duotone" />
                      </div>
                      <div>
                        <span className="font-sans text-sm font-bold block">{selectedFile.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">Audio Ingestion Buffer Ready</span>
                      </div>
                    </div>
                  ) : isVideo ? (
                    <video src={selectedFilePreview || ""} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={selectedFilePreview || ""} alt="uploaded preview" className="w-full h-full object-cover" />
                  )}
                  
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-sans text-slate-700 font-semibold shadow-sm uppercase">
                    {isAudio ? "Audio" : isVideo ? "Video" : "Image"}
                  </div>
                </div>

                {/* File Info strip */}
                <div className="flex items-center justify-between gap-3 mt-4 border-t border-slate-100 pt-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5 tabular-nums">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 border border-slate-200 hover:border-anomaly/40 text-slate-400 hover:text-anomaly bg-slate-50 hover:bg-anomaly/5 rounded-xl transition-all duration-150 flex-shrink-0"
                    title="Remove target"
                  >
                    <Trash className="w-4 h-4" weight="regular" />
                  </button>
                </div>
              </div>
            )
          )}

          {/* TAB 3: Live URL Scanner */}
          {uploadTab === "url" && (
            <div className="flex-1 min-h-[320px] border border-slate-200 rounded-2xl bg-white p-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand/10 text-brand">
                    <Globe className="w-5 h-5" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-sans">Remote Media Stream Ingestion</h3>
                    <p className="text-[11px] text-slate-500 font-sans">Paste any public URL to scan YouTube, X, TikTok, or CDN media</p>
                  </div>
                </div>

                <form onSubmit={handleUrlSubmit} className="space-y-3">
                  <div className="relative">
                    <LinkSimple className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/stream/video.mp4 or tweet link..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-brand focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!urlInput.trim() || isAnalyzing}
                    className="w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider font-sans transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Extract & Ingest Web Stream</span>
                  </button>
                </form>

                {/* Quick Sample Links */}
                <div className="pt-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase font-sans tracking-wider block mb-2">
                    Or Test Public Stream Presets:
                  </span>
                  <div className="space-y-1.5">
                    {sampleUrls.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setUrlInput(s.url); analyzeUrlStream(s.url, s.type); }}
                        className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-sans transition-colors group"
                      >
                        <span className="font-semibold text-slate-700 truncate group-hover:text-brand">
                          {s.label}
                        </span>
                        <span className="text-[9.5px] uppercase font-mono px-1.5 py-0.5 rounded bg-white border text-slate-500">
                          {s.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Instant Demo Presets */}
          {uploadTab === "presets" && (
            <div className="flex-1 min-h-[320px] border border-slate-200 rounded-2xl bg-white p-5 flex flex-col justify-between shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans mb-1">Instant Forensic Test Fixtures</h3>
                <p className="text-[11px] text-slate-500 font-sans mb-3">One-click simulated telemetry for immediate verification inspection</p>
                
                <div className="space-y-2">
                  {mockFixtures.map((fixture, idx) => (
                    <div
                      key={idx}
                      onClick={() => analyzePreset(fixture)}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-brand/5 hover:border-brand/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-brand flex-shrink-0 group-hover:scale-105 transition-transform">
                          {fixture.mediaType === "audio" ? (
                            <SpeakerHigh className="w-4 h-4" weight="duotone" />
                          ) : fixture.mediaType === "video" ? (
                            <FilmStrip className="w-4 h-4" weight="duotone" />
                          ) : (
                            <ImageIcon className="w-4 h-4" weight="duotone" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate font-sans group-hover:text-brand">
                            {fixture.title || `Sample ${fixture.mediaType.toUpperCase()}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {fixture.mediaType.toUpperCase()} · Trust Score: {fixture.trustScore}%
                          </p>
                        </div>
                      </div>

                      <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white group-hover:bg-brand group-hover:text-white border border-slate-200 text-slate-700 text-[10px] font-bold font-sans transition-colors shadow-2xs">
                        <Play className="w-3 h-3" weight="fill" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Panel: Light-tinted Summary / Info Card */}
        <div className="md:col-span-5 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-6 justify-between shadow-sm">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight font-sans">
              Comprehensive Forensic Suite
            </h3>
            
            {/* Divider line matching isgen.ai */}
            <div className="w-8 h-0.5 bg-brand" />

            {/* Feature bullets with colored arrow icons */}
            <ul className="space-y-3.5 pt-2 text-xs text-slate-650 leading-relaxed font-sans font-medium">
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  <strong>Audio Deepfake & Voice Clones:</strong> Spectrogram analysis & vocal biomechanics.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  <strong>Video FaceSwap Forensics:</strong> Temporal consistency & boundary artifacts.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  <strong>Sensor PRNU & Deep EXIF:</strong> Silicon noise fingerprints & GPS validation.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  <strong>Explainable Heatmaps:</strong> TruFor pixel localization & Grad-CAM cross-attention.
                </span>
              </li>
            </ul>
          </div>

          {/* Action button & TOS caption */}
          <div className="mt-8 space-y-3.5">
            {selectedFile ? (
              <button
                onClick={uploadAndAnalyze}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-sans"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running Telemetry...
                  </>
                ) : (
                  "Run AI Detection"
                )}
              </button>
            ) : uploadTab === "url" ? (
              <p className="text-[11px] text-slate-500 text-center font-sans">
                Paste a stream URL or pick a preset above to begin
              </p>
            ) : uploadTab === "presets" ? (
              <p className="text-[11px] text-slate-500 text-center font-sans">
                Select any fixture above for instant inspection
              </p>
            ) : (
              <button
                onClick={onButtonClick}
                className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 text-center font-sans"
              >
                {uploadTab === "audio" ? "Select Audio Clip" : "Select Media File"}
              </button>
            )}
            
            <p className="text-[10px] text-slate-400 text-center font-sans">
              By continuing you agree to our <a href="#" onClick={(e) => e.preventDefault()} className="text-brand underline">Terms of Service</a>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

