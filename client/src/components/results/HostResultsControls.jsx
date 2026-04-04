export default function HostResultsControls({ isHost, onRestart, onEnd }) {
  if (!isHost) {
    return (
      <p className="text-center text-gray-400 text-sm py-2">Waiting for host...</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onRestart}
        className="w-full bg-indigo-600 text-white rounded-xl py-4 text-lg font-bold hover:bg-indigo-700"
      >
        Play Again
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
