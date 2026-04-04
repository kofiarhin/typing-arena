import { memo } from "react";

const RoundHistory = memo(function RoundHistory({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {history.map((round) => (
        <div key={round.roundNumber} className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-gray-400 w-16 shrink-0">Round {round.roundNumber}</span>
          <span className="flex-1 font-medium text-gray-900">
            {round.winnerUsername || "No winner"}
          </span>
          <span className="text-gray-500">
            {round.winnerTimeMs ? `${(round.winnerTimeMs / 1000).toFixed(2)}s` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
});

export default RoundHistory;
