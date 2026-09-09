import { useLocation } from "react-router-dom";
import HeatmapViewer from "../components/results/HeatmapViewer";
import FrameTimeline from "../components/results/FrameTimeline";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ScanSearch,
  MapPin,
  BrainCircuit,
  FileImage,
} from "lucide-react";

function Results() {

  const location = useLocation();

  const file = location.state?.file;
  const selectedOptions = location.state?.selectedOptions || [];   
  return (
    <main className="min-h-screen bg-[#faf9fc] px-6 pb-20 pt-32">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
            TruthLens Results
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Forensic Analysis Report
          </h1>

          <p className="mt-2 text-gray-500">
            Review the detection result, suspicious regions, and supporting
            evidence.
          </p>
        </div>

        {/* Verdict */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Overall Verdict
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Potentially Manipulated
                </h2>
              </div>
            </div>

            <div className="rounded-2xl bg-purple-50 px-6 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Confidence
              </p>

              <p className="mt-1 text-3xl font-bold text-purple-700">
                87.4%
              </p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-purple-600"
              style={{ width: "87.4%" }}
            />
          </div>
        </section>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* Media */}
          <section className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Analyzed Media
                </p>

                <p className="mt-1 text-xs text-gray-500">
                   {file?.name || "No media selected"}
                </p>
              </div>

              <FileImage className="h-5 w-5 text-gray-400" />
            </div>

            <HeatmapViewer file={file} />

            </section>                   

          {/* Analysis summary */}
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">
              Analysis Summary
            </p>

            <div className="mt-5 space-y-3">

              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <ScanSearch className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Detection
                  </p>
                  <p className="text-xs text-gray-500">
                    Manipulation detected
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Localization
                  </p>
                  <p className="text-xs text-gray-500">
                    Suspicious regions found
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <BrainCircuit className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Explainability
                  </p>
                  <p className="text-xs text-gray-500">
                    Evidence generated
                  </p>
                </div>
              </div>

            </div>
          </section>
        </div>

        {file?.type?.startsWith("video/") && (
        <FrameTimeline />
        )}

        {/* Explanation */}
        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
              <BrainCircuit className="h-6 w-6 text-purple-600" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                Explainable Analysis
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-900">
                Why does TruthLens think this media is manipulated?
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-500">
                The analysis indicates visual inconsistencies in selected
                regions of the media. These areas show patterns that may be
                associated with synthetic generation or digital manipulation.
                The highlighted regions provide visual evidence supporting
                the model's prediction.
              </p>
            </div>
          </div>
        </section>

        {/* Technical details */}
        <section className="mt-6 grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Media Type
            </p>

            <p className="mt-2 text-lg font-bold text-gray-900">
              Image
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Suspicious Regions
            </p>

            <p className="mt-2 text-lg font-bold text-gray-900">
              4 detected
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Analysis Status
            </p>

            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-lg font-bold text-gray-900">
                Complete
              </p>
            </div>
          </div>

        </section>

        {/* Trust note */}
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-purple-600" />

          <p className="text-sm text-purple-800">
            TruthLens provides an AI-assisted forensic assessment. Results
            should be interpreted alongside the available visual evidence.
          </p>
        </div>

      </div>
    </main>
  );
}

export default Results;