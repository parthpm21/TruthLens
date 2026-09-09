import {
  Upload,
  ScanSearch,
  MapPin,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Media",
    description:
      "Upload an image or video that you want TruthLens to analyze.",
    style: "bg-purple-100 text-purple-600",
  },
  {
    number: "02",
    icon: ScanSearch,
    title: "Detect",
    description:
      "The forensic pipeline analyzes the media for AI-generated or manipulated content.",
    style: "bg-blue-100 text-blue-600",
  },
  {
    number: "03",
    icon: MapPin,
    title: "Localize",
    description:
      "Suspicious regions or video frames can be highlighted for deeper inspection.",
    style: "bg-pink-100 text-pink-600",
  },
  {
    number: "04",
    icon: Lightbulb,
    title: "Explain",
    description:
      "Interpretability tools provide evidence behind the model's prediction.",
    style: "bg-amber-100 text-amber-600",
  },
];

function HowItWorks() {
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">
            How It Works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            From Media to
            <br />
            <span className="text-purple-600">Forensic Insight.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-gray-600 md:text-lg">
            A simple workflow designed to make complex digital forensics
            accessible and understandable.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {/* Connecting line */}
          <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-purple-100 lg:block" />

          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative z-10 text-center"
              >
                {/* Icon */}
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${step.style} border-4 border-white shadow-sm`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                {/* Number */}
                <p className="mt-5 text-xs font-bold tracking-widest text-purple-400">
                  STEP {step.number}
                </p>

                <h3 className="mt-2 text-lg font-bold text-gray-900">
                  {step.title}
                </h3>

                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-gray-500">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom callout */}
        <div className="mx-auto mt-16 flex max-w-3xl items-center justify-between rounded-3xl bg-purple-50 px-6 py-5 md:px-8">
          <div>
            <p className="font-semibold text-gray-900">
              Ready to inspect your media?
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Start with an image or video.
            </p>
          </div>

          <button className="hidden items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 sm:flex">
            Start Analysis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;