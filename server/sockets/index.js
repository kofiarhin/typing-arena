const { Server } = require("socket.io");
const { CLIENT_URL } = require("../config/env");
const { registerSessionHandlers } = require("./handlers/sessionHandler");
const { registerRoundHandlers } = require("./handlers/roundHandler");
const { registerPlayerHandlers } = require("./handlers/playerHandler");

let ioInstance = null;

function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: [CLIENT_URL].filter(Boolean),
      credentials: true,
    },
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    registerSessionHandlers(io, socket);
    registerRoundHandlers(io, socket);
    registerPlayerHandlers(io, socket);
  });

  return io;
}

function isSocketReady() {
  return Boolean(ioInstance && ioInstance.engine);
}

module.exports = initSockets;
module.exports.isSocketReady = isSocketReady;
