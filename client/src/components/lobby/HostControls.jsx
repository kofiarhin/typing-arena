export default function HostControls({ isHost, canStart, onStart, onEnd }) {
  if (!isHost) return null;

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onStart}
        disabled={!canStart}
        className="w-full bg-green-600 text-white rounded-xl py-4 text-lg font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {canStart ? "Start Game" : "Need 2+ players"}
      </button>
      <button
        onClick={onEnd}
        className="w-full border border-red-300 text-red-600 rounded-xl py-3 text-sm font-medium hover:bg-red-50"
      >
        End Session
      </button>
    </div>
  );
}
