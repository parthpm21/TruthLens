import {
  ScanSearch,
  MapPin,
  BrainCircuit,
  Check,
} from "lucide-react";

const analysisOptions = [
  {
    id: "detection",
    icon: ScanSearch,
    title: "Manipulation Detection",
    description:
      "Determine whether the media contains manipulated content.",
  },
  {
    id: "localization",
    icon: MapPin,
    title: "Manipulation Localization",
    description:
      "Identify suspicious regions or frames within the media.",
  },
  {
    id: "explainability",
    icon: BrainCircuit,
    title: "Explainable Analysis",
    description:
      "Explore evidence behind the model's prediction.",
  },
];

function AnalysisControls({ selectedOptions, setSelectedOptions }) {
  const toggleOption = (id) => {
    setSelectedOptions((current) =>
      current.includes(id)
        ? current.filter((option) => option !== id)
        : [...current, id]
    );
  };

  return (
    <div className="mt-8">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Analysis Options
        </p>

        <h3 className="mt-1 text-xl font-bold text-gray-900">
          What would you like to inspect?
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Select one or more forensic analysis tasks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {analysisOptions.map((option) => {
          const Icon = option.icon;
          const selected = selectedOptions.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              className={`relative rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-purple-300 bg-purple-50 shadow-sm"
                  : "border-gray-100 bg-gray-50 hover:border-purple-200 hover:bg-purple-50/40"
              }`}
            >
              <div
                className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full ${
                  selected
                    ? "bg-purple-600 text-white"
                    : "border border-gray-200 bg-white"
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  selected
                    ? "bg-purple-100 text-purple-600"
                    : "bg-white text-gray-500"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h4 className="mt-4 pr-6 font-semibold text-gray-900">
                {option.title}
              </h4>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AnalysisControls;