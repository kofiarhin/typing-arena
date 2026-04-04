const { handleDisconnect } = require("../../utils/reconnectManager");

function registerPlayerHandlers(io, socket) {
  socket.on("disconnect", () => {
    handleDisconnect(socket, io);
  });
}

module.exports = { registerPlayerHandlers };
