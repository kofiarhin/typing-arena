const mongoose = require("mongoose");

const PlayerSessionSnapshotSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    username: { type: String, required: true },
    socketId: { type: String },
    isHost: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now },
    disconnectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const LeaderboardEntrySchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    username: { type: String, required: true },
    wins: { type: Number, default: 0 },
    roundsPlayed: { type: Number, default: 0 },
    totalTimeMs: { type: Number, default: 0 },
    averageTimeMs: { type: Number, default: 0 },
    bestTimeMs: { type: Number, default: null },
  },
  { _id: false }
);

const RoundResultSchema = new mongoose.Schema(
  {
    playerId: { type: String },
    username: { type: String },
    finishTimeMs: { type: Number, default: null },
    rank: { type: Number, default: null },
    correctChars: { type: Number, default: 0 },
  },
  { _id: false }
);

const RoundRecordSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true },
    text: { type: String, required: true },
    textLength: { type: Number, required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    winnerPlayerId: { type: String, default: null },
    winnerUsername: { type: String, default: null },
    winnerTimeMs: { type: Number, default: null },
    results: [RoundResultSchema],
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema({
  gameId: { type: String, unique: true, required: true },
  status: {
    type: String,
    enum: ["lobby", "countdown", "in_progress", "round_results", "ended"],
    default: "lobby",
  },
  hostPlayerId: { type: String },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  currentRoundNumber: { type: Number, default: 0 },
  players: [PlayerSessionSnapshotSchema],
  leaderboard: [LeaderboardEntrySchema],
  rounds: [RoundRecordSchema],
});

module.exports = mongoose.model("Session", SessionSchema);
