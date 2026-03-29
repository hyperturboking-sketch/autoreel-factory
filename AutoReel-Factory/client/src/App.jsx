import { useMemo, useState } from "react";
import ProgressSteps from "./components/ProgressSteps";
import ResultCard from "./components/ResultCard";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const STATES = {
  HOME: "home",
  LOADING: "loading",
  RESULT: "result",
};

export default function App() {
  const [topic, setTopic] = useState("");
  const [state, setState] = useState(STATES.HOME);
  const [activeStep, setActiveStep] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  const canGenerate = useMemo(() => topic.trim().length > 2, [topic]);

  async function handleGenerate() {
    if (!canGenerate) return;
    setError("");
    setState(STATES.LOADING);
    setActiveStep(0);

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2500);

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video.");
      }

      setActiveStep(3);
      const absoluteUrl = data.videoUrl?.startsWith("http")
        ? data.videoUrl
        : `${API_BASE}${data.videoUrl}`;
      setVideoUrl(absoluteUrl);
      setState(STATES.RESULT);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setState(STATES.HOME);
    } finally {
      clearInterval(timer);
    }
  }

  function reset() {
    setTopic("");
    setVideoUrl("");
    setError("");
    setState(STATES.HOME);
    setActiveStep(0);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.22),_transparent_50%)]" />
      <section className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            AutoReel Factory
          </h1>
          <p className="mt-3 text-sm text-zinc-400 md:text-base">
            Turn a topic into a fully generated AI reel.
          </p>
        </div>

        {state === STATES.HOME && (
          <div className="glass-card w-full max-w-xl p-6 shadow-glow">
            <label htmlFor="topic" className="mb-2 block text-sm text-zinc-300">
              Reel Topic
            </label>
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. motivation for students"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition focus:border-brand"
            />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate Reel
            </button>
          </div>
        )}

        {state === STATES.LOADING && <ProgressSteps activeIndex={activeStep} />}
        {state === STATES.RESULT && (
          <ResultCard videoUrl={videoUrl} onReset={reset} />
        )}
      </section>
    </main>
  );
}
