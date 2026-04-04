const rooms = new Map();

function getRooms() {
  return rooms;
}

function getRoom(gameId) {
  return rooms.get(gameId) || null;
}

function setRoom(gameId, data) {
  rooms.set(gameId, data);
}

function deleteRoom(gameId) {
  rooms.delete(gameId);
}

module.exports = { getRooms, getRoom, setRoom, deleteRoom };
