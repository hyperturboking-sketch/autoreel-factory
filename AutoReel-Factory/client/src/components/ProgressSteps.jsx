const STEPS = [
  "Generating script...",
  "Creating voice...",
  "Fetching clips...",
  "Rendering video...",
];

export default function ProgressSteps({ activeIndex }) {
  return (
    <div className="glass-card w-full max-w-md p-6">
      <h2 className="mb-5 text-lg font-semibold text-zinc-100">Processing</h2>
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const active = index <= activeIndex;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
                active
                  ? "border-brand/50 bg-brand/10 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  active ? "bg-brand animate-pulse" : "bg-zinc-700"
                }`}
              />
              <p className="text-sm">{step}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
