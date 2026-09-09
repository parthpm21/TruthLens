import {
  AlertTriangle,
  CheckCircle2,
  Play,
} from "lucide-react";

const frames = [
  { frame: 1, time: "00:01", score: 12, status: "normal" },
  { frame: 2, time: "00:03", score: 24, status: "normal" },
  { frame: 3, time: "00:05", score: 76, status: "suspicious" },
  { frame: 4, time: "00:07", score: 91, status: "high" },
  { frame: 5, time: "00:09", score: 84, status: "suspicious" },
  { frame: 6, time: "00:11", score: 31, status: "normal" },
  { frame: 7, time: "00:13", score: 68, status: "suspicious" },
  { frame: 8, time: "00:15", score: 18, status: "normal" },
];

function FrameTimeline() {
  return (
    <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
            Frame-Level Analysis
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-900">
            Suspicious Frames
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review how manipulation confidence changes across the video.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            Normal
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            Suspicious
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            High
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-8">
        <div className="relative h-16 rounded-2xl bg-gray-50 px-3">
          <div className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-200" />

          <div className="relative flex h-full items-center justify-between">
            {frames.map((item) => {
              const isHigh = item.status === "high";
              const isSuspicious = item.status === "suspicious";

              return (
                <div
                  key={item.frame}
                  className="group relative flex flex-col items-center"
                >
                  <button
                    type="button"
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-sm transition hover:scale-110 ${
                      isHigh
                        ? "bg-red-500"
                        : isSuspicious
                          ? "bg-orange-400"
                          : "bg-green-400"
                    }`}
                  >
                    {isHigh && (
                      <AlertTriangle className="h-3.5 w-3.5 text-white" />
                    )}
                  </button>

                  <span className="mt-2 text-[10px] font-medium text-gray-400">
                    {item.time}
                  </span>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute bottom-14 left-1/2 z-20 hidden -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-2 text-center text-xs text-white shadow-lg group-hover:block">
                    <p className="font-semibold">
                      Frame {item.frame}
                    </p>

                    <p className="mt-1 text-gray-300">
                      Score: {item.score}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Frame cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {frames
          .filter((item) => item.status !== "normal")
          .map((item) => (
            <div
              key={item.frame}
              className={`rounded-2xl border p-4 ${
                item.status === "high"
                  ? "border-red-100 bg-red-50"
                  : "border-orange-100 bg-orange-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      item.status === "high"
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {item.status === "high" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Frame {item.frame}
                    </p>

                    <p className="text-xs text-gray-500">
                      {item.time}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-sm font-bold ${
                    item.status === "high"
                      ? "text-red-600"
                      : "text-orange-600"
                  }`}
                >
                  {item.score}%
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-purple-600" />

        <p className="text-sm text-purple-800">
          4 frames show elevated manipulation confidence and may require
          deeper inspection.
        </p>
      </div>
    </section>
  );
}

export default FrameTimeline;