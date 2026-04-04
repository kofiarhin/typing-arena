import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { socket } from "../services/socket";
import { clearSession } from "../features/session/sessionSlice";
import { useGameSocket } from "../hooks/useGameSocket";
import { useSession } from "../hooks/queries/useSession";
import PlayerList from "../components/lobby/PlayerList";
import SharePanel from "../components/lobby/SharePanel";
import HostControls from "../components/lobby/HostControls";
import JoinGameModal from "../components/shared/JoinGameModal";
import ErrorToast from "../components/shared/ErrorToast";
import ConnectionStatus from "../components/shared/ConnectionStatus";

export default function GameLobby() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { playerId, isHost } = useSelector((s) => s.session);
  const hasIdentity = !!playerId;

  const { sessionData, connectionStatus, errors } = useGameSocket({ playerId, gameId });

  // Fetch session to validate room before showing join form
  const { data: sessionInfo, isLoading, isError } = useSession(!hasIdentity ? gameId : null);

  const players = sessionData?.players || [];
  const activePlayers = players.filter((p) => p.isActive);

  function handleStart() {
    socket.emit("round:start", { gameId, playerId });
  }

  function handleEnd() {
    socket.emit("session:end", { gameId, playerId });
  }

  function handleLeave() {
    socket.emit("session:leave", { gameId, playerId });
    dispatch(clearSession());
    navigate("/");
  }

  const sessionError =
    isError
      ? "This game doesn't exist or has already ended."
      : sessionData?.status === "ended"
      ? "This game has already ended."
      : null;

  // Show join modal if no identity
  if (!hasIdentity) {
    if (isLoading) {
      return (
        <div className="min-h-dvh bg-indigo-950 flex items-center justify-center">
          <p className="text-indigo-300">Loading room...</p>
        </div>
      );
    }
    return (
      <JoinGameModal
        gameId={gameId}
        sessionError={sessionError}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <ConnectionStatus status={connectionStatus} />
      <ErrorToast errors={errors} />

      {/* Header */}
      <div className="bg-indigo-900 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={handleLeave} className="text-indigo-300 text-sm">
          ← Leave
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-bold text-lg">Typing Arena</h1>
          <p className="text-indigo-300 text-xs font-mono">Room: {gameId}</p>
        </div>
        <div className="w-14" />
      </div>

      <div className="flex-1 flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
        {/* Share panel */}
        <SharePanel gameId={gameId} />

        {/* Players */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Players ({activePlayers.length}/8)
          </h2>
          <PlayerList players={players} localPlayerId={playerId} />
        </div>

        {/* Controls */}
        <div className="mt-auto">
          {isHost ? (
            <HostControls
              isHost={isHost}
              canStart={activePlayers.length >= 2}
              onStart={handleStart}
              onEnd={handleEnd}
            />
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">
              Waiting for host to start...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
