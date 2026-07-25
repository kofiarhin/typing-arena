const { isSocketReady } = require("../sockets");

function getSystemStatus() {
  return {
    status: "ok",
    service: "typing-arena-api",
    socketReady: isSocketReady(),
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getSystemStatus };
