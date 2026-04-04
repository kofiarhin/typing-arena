export default function RoundStandings({ results, localPlayerId }) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col gap-2">
      {results.map((r, i) => (
        <div
          key={r.playerId}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            r.playerId === localPlayerId
              ? "bg-indigo-50 border-indigo-200"
              : "bg-white border-gray-200"
          }`}
        >
          <span className="text-xl w-8 text-center">
            {r.status === "finished"
              ? medals[i] || `#${r.position}`
              : "💨"}
          </span>
          <span className="flex-1 font-medium text-gray-900">{r.username}</span>
          <span className="text-sm text-gray-500">
            {r.status === "finished" && r.timeMs != null
              ? `${(r.timeMs / 1000).toFixed(2)}s`
              : "DNF"}
          </span>
        </div>
      ))}
    </div>
  );
}
