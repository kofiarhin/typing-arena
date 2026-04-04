import { io } from "socket.io-client";
import { store } from "../app/store";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL) {
  throw new Error("Missing VITE_SOCKET_URL environment variable");
}

export const socket = io(SOCKET_URL, { autoConnect: false });

socket.on("connect", () => {
  const { playerId, gameId } = store.getState().session;
  if (playerId && gameId) {
    socket.emit("session:reconnect", { playerId, gameId });
  }
});
