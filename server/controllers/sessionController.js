const Session = require("../models/Session");
const { getRoom, deleteRoom } = require("../utils/roomStore");
const { sanitizeUsername } = require("../utils/sessionHelpers");

async function createSession(req, res, next) {
  try {
    const { username } = req.body;
    const cleaned = sanitizeUsername(username);
    if (!cleaned) {
      return res
        .status(400)
        .json({ error: "Username must be 2–20 characters." });
    }

    // This route is for REST bootstrapping; actual room creation happens via socket.
    // Return 501 to direct clients to use socket instead.
    return res
      .status(501)
      .json({ error: "Use socket event session:create instead." });
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const { gameId } = req.params;
    const session = await Session.findOne({ gameId });
    if (!session || session.status === "ended") {
      return res.status(404).json({ error: "Session not found or has ended." });
    }

    return res.json({
      gameId: session.gameId,
      status: session.status,
      hostPlayerId: session.hostPlayerId,
      players: session.players,
      leaderboard: session.leaderboard,
      rounds: session.rounds,
      currentRoundNumber: session.currentRoundNumber,
    });
  } catch (err) {
    next(err);
  }
}

async function endSession(req, res, next) {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;

    const session = await Session.findOne({ gameId });
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }
    if (session.hostPlayerId !== playerId) {
      return res.status(403).json({ error: "Only the host can end the session." });
    }
    if (session.status === "ended") {
      return res.status(400).json({ error: "Session already ended." });
    }

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();
    deleteRoom(gameId);

    return res.json({ message: "Session ended." });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSession, getSession, endSession };
