const { getRoom, setRoom } = require("../../utils/roomStore");
const { getRandomText } = require("../../utils/textPool");
const { buildSessionUpdate } = require("../../utils/sessionHelpers");
const { startBroadcast, stopBroadcast } = require("../../utils/broadcastManager");
const {
  endRound,
  scheduleRoundTimeout,
  clearRoundTimeout,
} = require("../../utils/roundEnd");
const { track } = require("../../utils/analytics");

// Per-room restart debounce timestamps
const lastRestartAt = new Map();

function registerRoundHandlers(io, socket) {
  socket.on("round:start", ({ gameId, playerId }) => {
    const room = getRoom(gameId);
    if (!room) {
      return socket.emit("error", { code: "ROOM_NOT_FOUND", message: "Game not found." });
    }

    if (room.hostPlayerId !== playerId) {
      return socket.emit("error", { code: "NOT_HOST", message: "Only the host can start the round." });
    }

    if (room.status !== "lobby" && room.status !== "round_results") {
      return socket.emit("error", { code: "INVALID_STATE", message: "Cannot start round now." });
    }

    const activePlayers = Array.from(room.players.values()).filter((p) => p.isActive);
    if (activePlayers.length < 2) {
      return socket.emit("error", {
        code: "NOT_ENOUGH_PLAYERS",
        message: "Need at least 2 players to start.",
      });
    }

    const text = getRandomText();
    const roundNumber = (room.currentRound?.roundNumber || 0) + 1;
    const startsAt = Date.now() + 3000;

    room.status = "countdown";
    room.currentRound = {
      roundNumber,
      text,
      startedAt: null,
      playerProgress: new Map(
        activePlayers.map((p) => [
          p.playerId,
          { correctChars: 0, finished: false, finishTimeMs: null, rank: null },
        ])
      ),
    };
    setRoom(gameId, room);

    io.to(gameId).emit("countdown:start", {
      gameId,
      roundNumber,
      countdownSeconds: 3,
      startsAt,
      text,
    });

    track("round_started", { gameId, roundNumber });

    // Transition to in_progress after countdown
    setTimeout(() => {
      const r = getRoom(gameId);
      if (!r || r.status !== "countdown") return;
      r.status = "in_progress";
      r.currentRound.startedAt = Date.now();
      setRoom(gameId, r);
      startBroadcast(gameId, io);
    }, 3000);
  });

  socket.on("round:progress", ({ gameId, playerId, correctChars }) => {
    const room = getRoom(gameId);
    if (!room || room.status !== "in_progress" || !room.currentRound) return;

    const { currentRound } = room;
    const prog = currentRound.playerProgress.get(playerId);
    if (!prog) return;

    // Validate
    if (typeof correctChars !== "number" || !Number.isInteger(correctChars)) return;
    if (correctChars < prog.correctChars) return; // monotonic
    if (correctChars > currentRound.text.length) return;

    prog.correctChars = correctChars;

    // Check if player finished
    if (correctChars === currentRound.text.length && !prog.finished) {
      prog.finished = true;
      prog.finishTimeMs = Date.now() - currentRound.startedAt;

      // Assign rank
      let rank = 1;
      for (const p of currentRound.playerProgress.values()) {
        if (p.finished && p !== prog) rank++;
      }
      prog.rank = rank;

      // Schedule 30s timeout after first finisher
      if (rank === 1) {
        scheduleRoundTimeout(gameId, io);
      }

      // Check if all active players finished
      const activePlayers = Array.from(room.players.values()).filter((p) => p.isActive);
      const allFinished = activePlayers.every((p) =>
        currentRound.playerProgress.get(p.playerId)?.finished
      );
      if (allFinished) {
        endRound(gameId, io);
      }
    }

    setRoom(gameId, room);
  });

  socket.on("round:finish", ({ gameId, playerId, correctChars }) => {
    // Belt + suspenders: same logic as progress at completion
    socket.emit("round:progress", { gameId, playerId, correctChars });
  });

  socket.on("round:restart", ({ gameId, playerId }) => {
    const room = getRoom(gameId);
    if (!room) {
      return socket.emit("error", { code: "ROOM_NOT_FOUND", message: "Game not found." });
    }

    if (room.hostPlayerId !== playerId) {
      return socket.emit("error", { code: "NOT_HOST", message: "Only the host can restart." });
    }

    if (room.status !== "round_results") {
      return socket.emit("error", { code: "INVALID_STATE", message: "Can only restart after a round ends." });
    }

    // Debounce
    const last = lastRestartAt.get(gameId) || 0;
    if (Date.now() - last < 2000) return;
    lastRestartAt.set(gameId, Date.now());

    clearRoundTimeout(gameId);
    stopBroadcast(gameId);
    room.currentRound = null;
    room.status = "lobby";
    setRoom(gameId, room);

    // Trigger start immediately
    socket.emit("round:start", { gameId, playerId });
  });
}

module.exports = { registerRoundHandlers };
