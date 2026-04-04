const { getRoom } = require("./roomStore");

const intervals = new Map();

function startBroadcast(gameId, io) {
  if (intervals.has(gameId)) return;

  const intervalId = setInterval(() => {
    const room = getRoom(gameId);
    if (!room || !room.currentRound) {
      stopBroadcast(gameId);
      return;
    }

    const { currentRound, gameId: gId } = room;
    const textLength = currentRound.text.length;
    const players = Array.from(room.players.values()).map((p) => {
      const prog = currentRound.playerProgress.get(p.playerId) || {
        correctChars: 0,
        finished: false,
        finishTimeMs: null,
        rank: null,
      };
      return {
        playerId: p.playerId,
        username: p.username,
        correctChars: prog.correctChars,
        progress: prog.correctChars / textLength,
        finished: prog.finished,
        finishTimeMs: prog.finishTimeMs,
        rank: prog.rank,
      };
    });

    // Find leader
    let leaderPlayerId = null;
    let maxProgress = -1;
    for (const p of players) {
      if (p.correctChars > maxProgress) {
        maxProgress = p.correctChars;
        leaderPlayerId = p.playerId;
      }
    }

    io.to(gId).emit("round:update", {
      gameId: gId,
      roundNumber: currentRound.roundNumber,
      players,
      leaderPlayerId,
    });
  }, 100);

  intervals.set(gameId, intervalId);
}

function stopBroadcast(gameId) {
  if (intervals.has(gameId)) {
    clearInterval(intervals.get(gameId));
    intervals.delete(gameId);
  }
}

module.exports = { startBroadcast, stopBroadcast };
