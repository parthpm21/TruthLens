import {
  BrainCircuit,
  Eye,
  Sparkles,
  Lightbulb,
} from "lucide-react";

const evidence = [
  {
    icon: Eye,
    title: "Visual Inconsistency",
    description:
      "Local visual patterns differ from surrounding regions and may indicate manipulation.",
  },
  {
    icon: Sparkles,
    title: "Synthetic Pattern",
    description:
      "The analyzed region contains patterns associated with synthetic or digitally altered content.",
  },
  {
    icon: BrainCircuit,
    title: "Model Evidence",
    description:
      "Multiple analysis signals contribute to the current forensic prediction.",
  },
];

function ExplainabilityPanel() {
  return (
    <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
          <BrainCircuit className="h-6 w-6 text-purple-600" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            Explainability
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-900 md:text-2xl">
            Why does TruthLens think this media is manipulated?
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
            TruthLens provides supporting evidence alongside its prediction,
            helping users understand which visual signals influenced the
            analysis.
          </p>
        </div>
      </div>

      {/* Evidence Cards */}
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {evidence.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:border-purple-200 hover:bg-purple-50/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Interpretation */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

        <div>
          <p className="text-sm font-semibold text-purple-900">
            Evidence-based interpretation
          </p>

          <p className="mt-1 text-xs leading-5 text-purple-800">
            The highlighted regions and confidence signals should be reviewed
            together. A high score indicates stronger model evidence, but does
            not by itself establish the source or intent of manipulation.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ExplainabilityPanel;