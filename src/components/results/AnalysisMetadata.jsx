import {
  FileImage,
  HardDrive,
  Calendar,
  Layers3,
} from "lucide-react";

function AnalysisMetadata({ file, selectedOptions = [] }) {
  const fileSize = file
    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    : "—";

  const fileType = file?.type
    ? file.type.split("/")[1]?.toUpperCase()
    : "—";

  const analysisTypes = {
    detection: "Manipulation Detection",
    localization: "Manipulation Localization",
    explainability: "Explainable Analysis",
  };

  const selectedTasks = selectedOptions.length
    ? selectedOptions
        .map((option) => analysisTypes[option])
        .filter(Boolean)
        .join(", ")
    : "Standard Analysis";

  const metadata = [
    {
      icon: FileImage,
      label: "File Type",
      value: fileType,
    },
    {
      icon: HardDrive,
      label: "File Size",
      value: fileSize,
    },
    {
      icon: Calendar,
      label: "Analysis",
      value: "Completed",
    },
    {
      icon: Layers3,
      label: "Tasks",
      value: selectedTasks,
    },
  ];

  return (
    <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
          Analysis Metadata
        </p>

        <h2 className="mt-1 text-xl font-bold text-gray-900">
          Analysis Overview
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Technical information about the analyzed media and selected
          forensic tasks.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metadata.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-400">
                    {item.label}
                  </p>

                  <p
                    className="mt-1 truncate text-sm font-semibold text-gray-900"
                    title={item.value}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AnalysisMetadata;