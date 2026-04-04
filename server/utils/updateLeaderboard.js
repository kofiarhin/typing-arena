/**
 * Updates leaderboard entries in-place given final round results.
 * results: [{ playerId, username, position, timeMs, status }]
 * leaderboard: array of LeaderboardEntry objects (plain JS, not Mongoose docs)
 */
function updateLeaderboard(leaderboard, results) {
  for (const result of results) {
    let entry = leaderboard.find((e) => e.playerId === result.playerId);
    if (!entry) {
      entry = {
        playerId: result.playerId,
        username: result.username,
        wins: 0,
        roundsPlayed: 0,
        totalTimeMs: 0,
        averageTimeMs: 0,
        bestTimeMs: null,
      };
      leaderboard.push(entry);
    }

    entry.roundsPlayed += 1;

    if (result.status === "finished" && result.timeMs != null) {
      if (result.position === 1) entry.wins += 1;
      entry.totalTimeMs += result.timeMs;
      entry.averageTimeMs = Math.round(entry.totalTimeMs / entry.roundsPlayed);
      entry.bestTimeMs =
        entry.bestTimeMs == null
          ? result.timeMs
          : Math.min(entry.bestTimeMs, result.timeMs);
    }
  }

  // Sort: wins desc, averageTimeMs asc (null last), bestTimeMs asc (null last)
  leaderboard.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.averageTimeMs == null && b.averageTimeMs == null) return 0;
    if (a.averageTimeMs == null) return 1;
    if (b.averageTimeMs == null) return -1;
    if (a.averageTimeMs !== b.averageTimeMs)
      return a.averageTimeMs - b.averageTimeMs;
    if (a.bestTimeMs == null && b.bestTimeMs == null) return 0;
    if (a.bestTimeMs == null) return 1;
    if (b.bestTimeMs == null) return -1;
    return a.bestTimeMs - b.bestTimeMs;
  });
}

module.exports = { updateLeaderboard };
