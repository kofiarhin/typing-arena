const Session = require("../../models/Session");
const { getRoom, setRoom } = require("../../utils/roomStore");
const {
  generateGameId,
  sanitizeUsername,
  buildSessionUpdate,
  buildLeaderboardEntry,
} = require("../../utils/sessionHelpers");
const { registerSocket } = require("../../utils/reconnectManager");
const { track } = require("../../utils/analytics");

function registerSessionHandlers(io, socket) {
  socket.on("session:create", async ({ username }) => {
    const cleaned = sanitizeUsername(username);
    if (!cleaned) {
      return socket.emit("error", {
        code: "INVALID_USERNAME",
        message: "Username must be 2–20 characters with no special characters.",
      });
    }

    const gameId = generateGameId();
    const playerId = generateGameId(); // reuse for unique ID

    const player = {
      playerId,
      username: cleaned,
      socketId: socket.id,
      isHost: true,
      isActive: true,
      joinedAt: Date.now(),
      disconnectedAt: null,
    };

    const room = {
      gameId,
      status: "lobby",
      hostPlayerId: playerId,
      players: new Map([[playerId, player]]),
      leaderboard: [buildLeaderboardEntry(playerId, cleaned)],
      currentRound: null,
    };

    setRoom(gameId, room);
    registerSocket(socket.id, gameId, playerId);

    try {
      await Session.create({
        gameId,
        status: "lobby",
        hostPlayerId: playerId,
        players: [
          {
            playerId,
            username: cleaned,
            socketId: socket.id,
            isHost: true,
            isActive: true,
          },
        ],
        leaderboard: [buildLeaderboardEntry(playerId, cleaned)],
      });
    } catch (err) {
      console.error("session:create DB error:", err);
    }

    socket.join(gameId);

    socket.emit("session:created", {
      gameId,
      playerId,
      username: cleaned,
      isHost: true,
      joinUrl: `${process.env.CLIENT_URL}/game/${gameId}`,
    });

    io.to(gameId).emit("session:update", buildSessionUpdate(room));
    track("room_created", { gameId });
  });

  socket.on("session:join", async ({ gameId, username }) => {
    const cleaned = sanitizeUsername(username);
    if (!cleaned) {
      return socket.emit("error", {
        code: "INVALID_USERNAME",
        message: "Username must be 2–20 characters with no special characters.",
      });
    }

    const room = getRoom(gameId);
    if (!room) {
      return socket.emit("error", {
        code: "ROOM_NOT_FOUND",
        message: "This game doesn't exist.",
      });
    }

    if (room.status === "ended") {
      return socket.emit("error", {
        code: "ROOM_ENDED",
        message: "This game has already ended.",
      });
    }

    if (room.status !== "lobby") {
      return socket.emit("error", {
        code: "GAME_IN_PROGRESS",
        message: "The game has already started.",
      });
    }

    if (room.players.size >= 8) {
      return socket.emit("error", {
        code: "ROOM_FULL",
        message: "This room is full (max 8 players).",
      });
    }

    // Check duplicate username
    for (const p of room.players.values()) {
      if (p.username.toLowerCase() === cleaned.toLowerCase() && p.isActive) {
        return socket.emit("error", {
          code: "DUPLICATE_USERNAME",
          message: "That username is already taken in this room.",
        });
      }
    }

    const playerId = generateGameId();
    const player = {
      playerId,
      username: cleaned,
      socketId: socket.id,
      isHost: false,
      isActive: true,
      joinedAt: Date.now(),
      disconnectedAt: null,
    };

    room.players.set(playerId, player);

    // Add to leaderboard
    if (!room.leaderboard) room.leaderboard = [];
    room.leaderboard.push(buildLeaderboardEntry(playerId, cleaned));

    setRoom(gameId, room);
    registerSocket(socket.id, gameId, playerId);

    try {
      await Session.updateOne(
        { gameId },
        {
          $push: {
            players: {
              playerId,
              username: cleaned,
              socketId: socket.id,
              isHost: false,
              isActive: true,
            },
            leaderboard: buildLeaderboardEntry(playerId, cleaned),
          },
        }
      );
    } catch (err) {
      console.error("session:join DB error:", err);
    }

    socket.join(gameId);

    socket.emit("session:joined", {
      gameId,
      playerId,
      username: cleaned,
      isHost: false,
    });

    io.to(gameId).emit("session:update", buildSessionUpdate(room));
    track("room_joined", { gameId, playerCount: room.players.size });
  });

  socket.on("session:leave", ({ gameId, playerId }) => {
    const room = getRoom(gameId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    player.isActive = false;
    setRoom(gameId, room);

    io.to(gameId).emit("session:update", buildSessionUpdate(room));
    socket.leave(gameId);
  });

  socket.on("session:end", async ({ gameId, playerId }) => {
    const room = getRoom(gameId);
    if (!room) {
      return socket.emit("error", { code: "ROOM_NOT_FOUND", message: "Game not found." });
    }

    if (room.hostPlayerId !== playerId) {
      return socket.emit("error", { code: "NOT_HOST", message: "Only the host can do that." });
    }

    if (room.status === "ended") return;

    room.status = "ended";
    setRoom(gameId, room);

    io.to(gameId).emit("session:update", buildSessionUpdate(room));

    try {
      await Session.updateOne(
        { gameId },
        { status: "ended", endedAt: new Date() }
      );
    } catch (err) {
      console.error("session:end DB error:", err);
    }

    track("session_ended", { gameId });

    // Brief delay then disconnect all
    setTimeout(() => {
      io.in(gameId).disconnectSockets(true);
    }, 2000);
  });

  socket.on("session:reconnect", ({ playerId, gameId }) => {
    const { handleReconnect } = require("../../utils/reconnectManager");
    handleReconnect(socket, { playerId, gameId }, io);
  });
}

module.exports = { registerSessionHandlers };
