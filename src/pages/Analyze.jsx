import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileImage,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import AnalysisControls from "../components/uploads/AnalysisControls";
import AnalysisProgress from "../components/uploads/AnalysisProgress";

function Analyze() {

  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState([
    "detection",
    "localization",
    "explainability",
  ]);

  const handleStartAnalysis = () => {
    if (!file || selectedOptions.length === 0) return;

    setIsAnalyzing(true);
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
  };

  const isVideo = file?.type.startsWith("video/");

  return (
    <main className="min-h-screen bg-[#faf9fc] px-6 pb-20 pt-36">
        {isAnalyzing ? (
            <AnalysisProgress
                selectedOptions={selectedOptions}
                onComplete={() => {
                navigate("/results", {
                    state: {
                        file,
                        selectedOptions,
                    },
                 });
                }}
            />
        ) : (

            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">
                    <ShieldCheck className="h-7 w-7 text-purple-600" />
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">
                    TruthLens Analysis
                </p>

                <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                    Analyze Your Media
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
                    Upload an image or video to inspect it for AI-generated content
                    and digital manipulation.
                </p>

                </div>

                {/* Upload Card */}
                <div className="mt-12 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/40 md:p-8">

                {!file ? (
                    <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`rounded-3xl border-2 border-dashed p-10 text-center transition md:p-16 ${
                        dragActive
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 bg-gray-50/70 hover:border-purple-300 hover:bg-purple-50/40"
                    }`}
                    >

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100">
                        <Upload className="h-7 w-7 text-purple-600" />
                    </div>

                    <h2 className="mt-6 text-xl font-bold text-gray-900">
                        Drop your media here
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        or choose a file from your device
                    </p>

                    <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700">
                        <Upload className="h-4 w-4" />
                        Choose File

                        <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileInput}
                        className="hidden"
                        />
                    </label>

                    {/* Supported formats */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">

                        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-500 shadow-sm">
                        <ImageIcon className="h-4 w-4 text-purple-500" />
                        Images
                        </div>

                        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-500 shadow-sm">
                        <Video className="h-4 w-4 text-blue-500" />
                        Videos
                        </div>

                    </div>

                    <p className="mt-5 text-xs text-gray-400">
                        Supported image and video formats
                    </p>

                    </div>
                ) : (
                    /* File Preview */
                    <div>

                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                            Selected Media
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-gray-900">
                            Review Before Analysis
                        </h2>
                        </div>

                        <button
                        onClick={removeFile}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                        title="Remove file"
                        >
                        <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Preview */}
                    <div className="mt-6 overflow-hidden rounded-3xl bg-gray-100">

                        {isVideo ? (
                        <video
                            src={URL.createObjectURL(file)}
                            controls
                            className="max-h-[500px] w-full object-contain"
                        />
                        ) : (
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Selected media preview"
                            className="max-h-[500px] w-full object-contain"
                        />
                        )}

                    </div>

                    {/* File information */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">

                        <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-400">File Name</p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                            {file.name}
                        </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-400">Type</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                            {isVideo ? "Video" : "Image"}
                        </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-400">Size</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        </div>

                    </div>

                        <AnalysisControls
                        selectedOptions={selectedOptions}
                        setSelectedOptions={setSelectedOptions}
                        />              

                    {/* Analysis button */}
                    <button
                        type="button"
                        onClick={handleStartAnalysis}
                        disabled={!file || selectedOptions.length === 0}
                        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
                    >
                        Start Analysis

                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>

                    </div>
                )}

                </div>

                {/* Privacy note */}
                <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
                <ShieldCheck className="h-4 w-4" />
                Your media is used only for forensic analysis.
                </div>

            </div>
        )}

    </main>
  );
}

export default Analyze;