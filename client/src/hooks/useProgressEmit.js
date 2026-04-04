import { useRef, useCallback } from "react";
import { socket } from "../services/socket";

export function useProgressEmit({ gameId, playerId }) {
  const lastEmitAt = useRef(0);
  const lastCorrectChars = useRef(0);

  const emit = useCallback(
    (correctChars, textLength) => {
      const now = Date.now();
      if (now - lastEmitAt.current < 100) return;

      lastEmitAt.current = now;
      lastCorrectChars.current = correctChars;

      socket.emit("round:progress", { gameId, playerId, correctChars });

      if (correctChars === textLength) {
        socket.emit("round:finish", { gameId, playerId, correctChars });
      }
    },
    [gameId, playerId]
  );

  return emit;
}
