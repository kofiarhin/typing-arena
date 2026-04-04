import { memo } from "react";

const AVATARS = ["🐢", "🐇", "🦊", "🐆", "🦅", "🐬", "🦁", "🐺"];

const RaceLane = memo(function RaceLane({ player, index, isLocal, isLeader, textLength }) {
  const progress = textLength > 0 ? player.correctChars / textLength : 0;
  const avatar = AVATARS[index % AVATARS.length];

  return (
    <div
      className={`relative flex items-center h-14 rounded-xl px-2 mb-1 ${
        isLocal ? "bg-indigo-50 border border-indigo-200" : "bg-gray-50 border border-gray-200"
      }`}
    >
      {/* Username */}
      <span className="text-xs font-medium text-gray-500 w-20 shrink-0 truncate">
        {isLeader && <span className="text-amber-500 mr-1">👑</span>}
        {player.username}
      </span>

      {/* Track */}
      <div className="flex-1 relative h-6 mx-2">
        {/* Track background */}
        <div className="absolute inset-y-0 left-0 right-0 bg-gray-200 rounded-full" />
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-indigo-300 rounded-full transition-none"
          style={{ width: `${progress * 100}%` }}
        />
        {/* Avatar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-xl"
          style={{
            left: `${progress * 100}%`,
            transition: "left 0.1s linear",
          }}
        >
          {player.finished ? "🏆" : avatar}
        </div>
        {/* Finish line */}
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gray-400" />
      </div>

      {/* Time */}
      <span className="text-xs text-gray-400 w-14 text-right shrink-0">
        {player.finished && player.finishTimeMs
          ? `${(player.finishTimeMs / 1000).toFixed(1)}s`
          : `${Math.round(progress * 100)}%`}
      </span>
    </div>
  );
});

export default RaceLane;
