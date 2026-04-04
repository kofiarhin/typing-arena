import RaceLane from "./RaceLane";

export default function RaceTrack({ players, textLength, localPlayerId, localCorrectChars }) {
  // Merge local player's optimistic progress into players list
  const merged = players.map((p) => {
    if (p.playerId === localPlayerId) {
      return { ...p, correctChars: Math.max(p.correctChars, localCorrectChars) };
    }
    return p;
  });

  // Find leader
  const leaderPlayerId = merged.reduce(
    (leader, p) => (p.correctChars > (leader?.correctChars ?? -1) ? p : leader),
    null
  )?.playerId;

  return (
    <div className="flex flex-col gap-0.5">
      {merged.map((player, i) => (
        <RaceLane
          key={player.playerId}
          player={player}
          index={i}
          isLocal={player.playerId === localPlayerId}
          isLeader={player.playerId === leaderPlayerId}
          textLength={textLength}
        />
      ))}
    </div>
  );
}
