import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

function HeatmapViewer({ file }) {
  const [view, setView] = useState("overlay");
  const [mediaUrl, setMediaUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setMediaUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setMediaUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isImage = file?.type?.startsWith("image/");
  const isVideo = file?.type?.startsWith("video/");

  return (
    <div>
      {/* Viewer Controls */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setView("original")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              view === "original"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Original
          </button>

          <button
            type="button"
            onClick={() => setView("heatmap")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              view === "heatmap"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Heatmap
          </button>

          <button
            type="button"
            onClick={() => setView("overlay")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              view === "overlay"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overlay
          </button>
        </div>

        <span className="hidden text-xs text-gray-400 sm:block">
          Localization view
        </span>
      </div>

      {/* Media Viewer */}
      <div className="relative mt-4 overflow-hidden rounded-2xl bg-gray-100">
        {isImage && mediaUrl ? (
          <div className="relative aspect-video">

            {/* Original */}
            <img
              src={mediaUrl}
              alt="Analyzed media"
              className={`h-full w-full object-contain ${
                view === "heatmap" ? "opacity-30" : ""
              }`}
            />

            {/* Heatmap */}
            {view !== "original" && (
              <div className="pointer-events-none absolute inset-0">

                {/* High suspicion */}
                <div className="absolute left-[42%] top-[18%] h-24 w-32 rounded-full bg-red-500/55 blur-xl" />

                {/* Medium suspicion */}
                <div className="absolute left-[28%] top-[52%] h-28 w-32 rounded-full bg-orange-400/50 blur-xl" />

                {/* Lower suspicion */}
                <div className="absolute right-[25%] top-[35%] h-24 w-28 rounded-full bg-yellow-300/50 blur-xl" />
              </div>
            )}

            {/* Suspicious Region Boxes */}
            {view === "overlay" && (
              <div className="pointer-events-none absolute inset-0">

                <div className="absolute left-[40%] top-[15%] h-[22%] w-[18%] rounded-xl border-2 border-red-500">
                  <span className="absolute -top-7 left-0 rounded-lg bg-red-500 px-2 py-1 text-[10px] font-semibold text-white">
                    High
                  </span>
                </div>

                <div className="absolute left-[25%] top-[50%] h-[25%] w-[20%] rounded-xl border-2 border-orange-400">
                  <span className="absolute -top-7 left-0 rounded-lg bg-orange-400 px-2 py-1 text-[10px] font-semibold text-white">
                    Medium
                  </span>
                </div>
              </div>
            )}

          </div>
        ) : isVideo && mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            className="aspect-video h-full w-full object-contain"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <div className="text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm text-gray-500">
                No media available
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          High suspicion
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-400" />
          Medium suspicion
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-300" />
          Lower suspicion
        </div>
      </div>
    </div>
  );
}

export default HeatmapViewer;