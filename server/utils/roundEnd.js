const Session = require("../models/Session");
const { getRoom, setRoom } = require("./roomStore");
const { stopBroadcast } = require("./broadcastManager");
const { updateLeaderboard } = require("./updateLeaderboard");
const { track } = require("./analytics");

// Per-room timeout handles: { gameId -> timeoutId }
const roundTimeouts = new Map();

function scheduleRoundTimeout(gameId, io) {
  // Clear existing timeout if any
  clearRoundTimeout(gameId);
  const timeoutId = setTimeout(() => {
    endRound(gameId, io);
  }, 30000);
  roundTimeouts.set(gameId, timeoutId);
}

function clearRoundTimeout(gameId) {
  if (roundTimeouts.has(gameId)) {
    clearTimeout(roundTimeouts.get(gameId));
    roundTimeouts.delete(gameId);
  }
}

async function endRound(gameId, io) {
  const room = getRoom(gameId);
  if (!room || room.status !== "in_progress") return;

  stopBroadcast(gameId);
  clearRoundTimeout(gameId);

  const { currentRound } = room;
  const textLength = currentRound.text.length;
  const endedAt = Date.now();

  // Build results
  const results = [];
  let rank = 0;
  const finishers = [];
  const dnfs = [];

  for (const [playerId, prog] of currentRound.playerProgress.entries()) {
    const player = room.players.get(playerId);
    if (!player) continue;
    if (prog.finished) {
      finishers.push({ playerId, username: player.username, ...prog });
    } else {
      dnfs.push({ playerId, username: player.username, ...prog });
    }
  }

  // Sort finishers by finishTimeMs
  finishers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);

  for (const f of finishers) {
    rank += 1;
    results.push({
      playerId: f.playerId,
      username: f.username,
      position: rank,
      timeMs: f.finishTimeMs,
      status: "finished",
    });
  }
  for (const d of dnfs) {
    results.push({
      playerId: d.playerId,
      username: d.username,
      position: null,
      timeMs: null,
      status: "dnf",
    });
  }

  const winner = results.find((r) => r.position === 1) || null;

  // Update room state
  room.status = "round_results";
  setRoom(gameId, room);

  // Update DB
  try {
    const session = await Session.findOne({ gameId });
    if (session) {
      // Build round record
      const roundRecord = {
        roundNumber: currentRound.roundNumber,
        text: currentRound.text,
        textLength,
        startedAt: new Date(currentRound.startedAt),
        endedAt: new Date(endedAt),
        winnerPlayerId: winner ? winner.playerId : null,
        winnerUsername: winner ? winner.username : null,
        winnerTimeMs: winner ? winner.timeMs : null,
        results: results.map((r) => ({
          playerId: r.playerId,
          username: r.username,
          finishTimeMs: r.timeMs,
          rank: r.position,
          correctChars: currentRound.playerProgress.get(r.playerId)?.correctChars || 0,
        })),
      };
      session.rounds.push(roundRecord);
      session.currentRoundNumber = currentRound.roundNumber;
      session.status = "round_results";

      // Update leaderboard
      const lb = session.leaderboard.map((e) => e.toObject ? e.toObject() : e);
      updateLeaderboard(lb, results);
      session.leaderboard = lb;

      // Sync room leaderboard
      room.leaderboard = lb;
      setRoom(gameId, room);

      await session.save();

      const history = session.rounds.map((r) => ({
        roundNumber: r.roundNumber,
        winnerUsername: r.winnerUsername,
        winnerTimeMs: r.winnerTimeMs,
        textLength: r.textLength,
      }));

      io.to(gameId).emit("round:finished", {
        gameId,
        roundNumber: currentRound.roundNumber,
        winner: winner
          ? { playerId: winner.playerId, username: winner.username, timeMs: winner.timeMs }
          : null,
        results,
        leaderboard: lb,
        history,
      });

      track("round_finished", {
        gameId,
        roundNumber: currentRound.roundNumber,
        winnerTimeMs: winner?.timeMs,
        playerCount: results.length,
      });

      // Auto-end if only 1 or 0 active players remain
      const activePlayers = Array.from(room.players.values()).filter(
        (p) => p.isActive
      );
      if (activePlayers.length <= 1) {
        session.status = "ended";
        session.endedAt = new Date();
        await session.save();
        room.status = "ended";
        setRoom(gameId, room);
        io.to(gameId).emit("session:update", {
          gameId,
          status: "ended",
          hostPlayerId: room.hostPlayerId,
          players: Array.from(room.players.values()),
          leaderboard: lb,
        });
      }
    }
  } catch (err) {
    console.error("roundEnd DB error:", err);
  }
}

module.exports = { endRound, scheduleRoundTimeout, clearRoundTimeout };
