import { memo } from "react";

const PlayerList = memo(function PlayerList({ players, localPlayerId }) {
  return (
    <div className="flex flex-col gap-2">
      {players?.map((p) => (
        <div
          key={p.playerId}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            p.playerId === localPlayerId
              ? "border-indigo-300 bg-indigo-50"
              : "border-gray-200 bg-white"
          } ${!p.isActive ? "opacity-40" : ""}`}
        >
          <span className="text-xl">
            {p.isHost ? "👑" : "🏁"}
          </span>
          <span className="font-medium text-gray-900 flex-1">{p.username}</span>
          {p.playerId === localPlayerId && (
            <span className="text-xs text-indigo-600 font-medium">You</span>
          )}
          {p.isHost && (
            <span className="text-xs text-amber-600 font-medium">Host</span>
          )}
          {!p.isActive && (
            <span className="text-xs text-gray-400">Disconnected</span>
          )}
        </div>
      ))}
    </div>
  );
});

export default PlayerList;
