export default function ResultCard({ videoUrl, onReset }) {
  return (
    <div className="glass-card w-full max-w-md p-5">
      <h2 className="mb-4 text-lg font-semibold">Your Reel Is Ready</h2>
      <video
        className="mb-4 aspect-[9/16] w-full rounded-xl border border-zinc-800 bg-black"
        controls
        src={videoUrl}
      />
      <div className="flex gap-3">
        <a
          href={videoUrl}
          download
          className="flex-1 rounded-lg bg-brand px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Download
        </a>
        <button
          onClick={onReset}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          Create Another
        </button>
      </div>
    </div>
  );
}
