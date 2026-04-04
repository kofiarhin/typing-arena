const crypto = require("crypto");

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateGameId() {
  return Array.from(crypto.randomBytes(6))
    .map((b) => CHARS[b % CHARS.length])
    .join("");
}

function sanitizeUsername(str) {
  if (typeof str !== "string") return null;
  const cleaned = str.trim().replace(/[^\w\s-]/g, "");
  if (cleaned.length < 2 || cleaned.length > 20) return null;
  return cleaned;
}

function buildSessionUpdate(room) {
  const players = Array.from(room.players.values()).map((p) => ({
    playerId: p.playerId,
    username: p.username,
    isHost: p.isHost,
    isActive: p.isActive,
  }));

  return {
    gameId: room.gameId,
    status: room.status,
    hostPlayerId: room.hostPlayerId,
    players,
  };
}

function buildLeaderboardEntry(playerId, username) {
  return {
    playerId,
    username,
    wins: 0,
    roundsPlayed: 0,
    totalTimeMs: 0,
    averageTimeMs: 0,
    bestTimeMs: null,
  };
}

module.exports = {
  generateGameId,
  sanitizeUsername,
  buildSessionUpdate,
  buildLeaderboardEntry,
};
