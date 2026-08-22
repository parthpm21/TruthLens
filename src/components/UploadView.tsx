import React, { useRef, useState } from "react";
import { useAnalysisStore } from "../store/useAnalysisStore";
import { Upload, Trash, ShieldWarning, CaretRight } from "@phosphor-icons/react";

export const UploadView: React.FC = () => {
  const { selectedFile, selectedFilePreview, setFile, clearFile, uploadAndAnalyze, isAnalyzing, error } = useAnalysisStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const isImage = file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png)$/i);
    const isVideo = file.type.startsWith("video/") || file.name.match(/\.(mp4|mov)$/i);
    if (isImage || isVideo) setFile(file);
    else alert("Unsupported format. Upload JPEG/PNG image or MP4/MOV video.");
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const isVideo = selectedFile?.type.startsWith("video/") || false;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 max-w-5xl mx-auto w-full">
      
      {/* Top Headline Section matching isgen.ai */}
      <div className="w-full text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans leading-tight">
          The Most <span className="text-brand">Explainable</span> Deepfake Detector!
        </h2>
        <p className="text-slate-550 text-sm mt-3 font-sans max-w-lg mx-auto">
          Upload an image or video to see if it was generated or altered by AI. Try now for free!
        </p>
      </div>

      {error && (
        <div className="w-full mb-6 p-4 bg-anomaly/8 border border-anomaly/20 rounded-xl flex items-center gap-3 text-sm text-anomaly font-sans">
          <ShieldWarning className="w-4.5 h-4.5 flex-shrink-0" weight="duotone" />
          <span>{error}</span>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Panel: Dropzone or Preview */}
        <div className="md:col-span-7 flex flex-col">
          {!selectedFile ? (
            /* Drag and Drop Zone */
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`flex-1 min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 bg-white ${
                isDragActive
                  ? "border-brand bg-brand/5 shadow-[0_0_24px_rgba(28,167,196,0.06)]"
                  : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,video/mp4,video/quicktime"
                onChange={handleChange}
              />
              
              <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-400 group-hover:scale-105 transition-all">
                <Upload className="w-8 h-8 text-brand" weight="duotone" />
              </div>
              
              <p className="text-sm font-semibold text-slate-700">
                Click to upload or drag and drop
              </p>
              
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                Supports high-resolution JPEGs, PNGs, MP4s, or MOVs.
              </p>
            </div>
          ) : (
            /* File Preview Mode */
            <div className="flex-1 min-h-[300px] border border-slate-200 rounded-2xl bg-white p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                {isVideo ? (
                  <video src={selectedFilePreview || ""} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={selectedFilePreview || ""} alt="uploaded preview" className="w-full h-full object-cover" />
                )}
                
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-sans text-slate-700 font-semibold shadow-sm">
                  {isVideo ? "Video" : "Image"}
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
          )}
        </div>

        {/* Right Panel: Light-tinted Summary / Info Card */}
        <div className="md:col-span-5 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-6 justify-between shadow-sm">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight font-sans">
              The Most Accurate AI Deepfake Detector
            </h3>
            
            {/* Divider line matching isgen.ai */}
            <div className="w-8 h-0.5 bg-brand" />

            {/* Feature bullets with colored arrow icons */}
            <ul className="space-y-3.5 pt-2 text-xs text-slate-650 leading-relaxed font-sans font-medium">
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  Detect <strong>AI Generated</strong> and altered media.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  Identify <strong>localized changes</strong> with pixel precision.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  Provide <strong>explainable heatmaps</strong> (TruFor & Grad-CAM).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CaretRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" weight="bold" />
                <span>
                  Generate <strong>forensic PDF reports</strong> instantly.
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
            ) : (
              <button
                onClick={onButtonClick}
                className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 text-center font-sans"
              >
                Select Media File
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
