const { Server } = require("socket.io");
const { CLIENT_URL } = require("../config/env");
const { registerSessionHandlers } = require("./handlers/sessionHandler");
const { registerRoundHandlers } = require("./handlers/roundHandler");
const { registerPlayerHandlers } = require("./handlers/playerHandler");

function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: [CLIENT_URL].filter(Boolean),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    registerSessionHandlers(io, socket);
    registerRoundHandlers(io, socket);
    registerPlayerHandlers(io, socket);
  });

  return io;
}

module.exports = initSockets;
