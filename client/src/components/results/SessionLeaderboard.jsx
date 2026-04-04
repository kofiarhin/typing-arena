import { memo } from "react";

const SessionLeaderboard = memo(function SessionLeaderboard({ leaderboard, localPlayerId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="pb-2 font-medium">Player</th>
            <th className="pb-2 font-medium text-right">Wins</th>
            <th className="pb-2 font-medium text-right">Rounds</th>
            <th className="pb-2 font-medium text-right">Avg</th>
            <th className="pb-2 font-medium text-right">Best</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => (
            <tr
              key={entry.playerId}
              className={`border-b border-gray-100 ${
                entry.playerId === localPlayerId ? "bg-indigo-50 font-medium" : ""
              }`}
            >
              <td className="py-2 text-gray-900">{entry.username}</td>
              <td className="py-2 text-right text-gray-700">{entry.wins}</td>
              <td className="py-2 text-right text-gray-500">{entry.roundsPlayed}</td>
              <td className="py-2 text-right text-gray-500">
                {entry.averageTimeMs ? `${(entry.averageTimeMs / 1000).toFixed(1)}s` : "—"}
              </td>
              <td className="py-2 text-right text-gray-500">
                {entry.bestTimeMs ? `${(entry.bestTimeMs / 1000).toFixed(1)}s` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default SessionLeaderboard;
