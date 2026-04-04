const { getRooms, getRoom, setRoom } = require("./roomStore");
const { buildSessionUpdate } = require("./sessionHelpers");
const { track } = require("./analytics");

// Grace timers: socketId -> timeoutId
const graceTimers = new Map();

// socketId -> { gameId, playerId }
const socketToPlayer = new Map();

function registerSocket(socketId, gameId, playerId) {
  socketToPlayer.set(socketId, { gameId, playerId });
}

function unregisterSocket(socketId) {
  socketToPlayer.delete(socketId);
}

function findPlayerBySocketId(socketId) {
  return socketToPlayer.get(socketId) || null;
}

function findPlayerByPlayerId(playerId) {
  for (const room of getRooms().values()) {
    const player = room.players.get(playerId);
    if (player) return { room, player };
  }
  return null;
}

function startGraceTimer(socketId, gameId, playerId, io, onExpired) {
  clearGraceTimer(socketId);
  const timerId = setTimeout(() => {
    graceTimers.delete(socketId);
    onExpired({ gameId, playerId });
  }, 25000);
  graceTimers.set(socketId, timerId);
}

function clearGraceTimer(socketId) {
  if (graceTimers.has(socketId)) {
    clearTimeout(graceTimers.get(socketId));
    graceTimers.delete(socketId);
  }
}

function handleDisconnect(socket, io) {
  const info = findPlayerBySocketId(socket.id);
  if (!info) return;

  const { gameId, playerId } = info;
  unregisterSocket(socket.id);

  const room = getRoom(gameId);
  if (!room) return;

  const player = room.players.get(playerId);
  if (!player) return;

  player.isActive = false;
  player.disconnectedAt = Date.now();
  setRoom(gameId, room);

  io.to(gameId).emit("player:disconnected", { gameId, playerId, username: player.username });
  track("player_disconnected", { gameId, playerId });

  startGraceTimer(socket.id, gameId, playerId, io, ({ gameId, playerId }) => {
    const room = getRoom(gameId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player || player.isActive) return;

    // Grace expired — handle based on role
    if (player.isHost) {
      promoteNewHost(room, io);
    }

    // If in_progress, mark as DNF (progress already won't update)
    track("player_disconnected", { gameId, reconnected: false });

    // Update session update to reflect removal
    io.to(gameId).emit("session:update", buildSessionUpdate(room));
  });
}

function promoteNewHost(room, io) {
  // Find oldest active player by joinedAt
  let oldest = null;
  for (const p of room.players.values()) {
    if (p.isActive && !p.isHost) {
      if (!oldest || p.joinedAt < oldest.joinedAt) {
        oldest = p;
      }
    }
  }

  if (!oldest) return;

  // Demote current host
  for (const p of room.players.values()) {
    p.isHost = false;
  }
  oldest.isHost = true;
  room.hostPlayerId = oldest.playerId;
  setRoom(room.gameId, room);

  io.to(room.gameId).emit("session:update", buildSessionUpdate(room));
}

function handleReconnect(socket, { playerId, gameId }, io) {
  const result = findPlayerByPlayerId(playerId);
  if (!result) {
    socket.emit("error", { code: "ROOM_NOT_FOUND", message: "Game not found." });
    return;
  }

  const { room, player } = result;
  if (room.gameId !== gameId) {
    socket.emit("error", { code: "ROOM_NOT_FOUND", message: "Game not found." });
    return;
  }

  // Clear any grace timer that was started for the old socketId
  for (const [sid, timerId] of graceTimers.entries()) {
    const info = socketToPlayer.get(sid);
    if (info && info.playerId === playerId) {
      clearGraceTimer(sid);
      break;
    }
  }

  // Restore player
  player.isActive = true;
  player.socketId = socket.id;
  player.disconnectedAt = null;
  setRoom(gameId, room);

  registerSocket(socket.id, gameId, playerId);
  socket.join(gameId);

  // Send current state
  if (room.status === "lobby" || room.status === "round_results") {
    socket.emit("session:update", buildSessionUpdate(room));
  } else if (room.status === "in_progress" && room.currentRound) {
    const { currentRound } = room;
    socket.emit("countdown:start", {
      gameId,
      roundNumber: currentRound.roundNumber,
      countdownSeconds: 0,
      startsAt: currentRound.startedAt,
      text: currentRound.text,
    });

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
    socket.emit("round:update", { gameId, roundNumber: currentRound.roundNumber, players, leaderPlayerId: null });
  }

  io.to(gameId).emit("player:reconnected", { gameId, playerId, username: player.username });
  io.to(gameId).emit("session:update", buildSessionUpdate(room));

  track("player_reconnected", { gameId, playerId });
}

module.exports = {
  registerSocket,
  unregisterSocket,
  findPlayerBySocketId,
  handleDisconnect,
  handleReconnect,
};
