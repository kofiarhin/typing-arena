import { useState } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../services/socket";
import { setSession } from "../../features/session/sessionSlice";

export default function JoinGameModal({ gameId, sessionError }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("Username must be 2–20 characters.");
      return;
    }

    setLoading(true);
    setError("");

    if (!socket.connected) socket.connect();

    socket.emit("session:join", { gameId, username: trimmed });

    socket.once("session:joined", (data) => {
      setLoading(false);
      dispatch(
        setSession({
          playerId: data.playerId,
          username: data.username,
          gameId: data.gameId,
          isHost: false,
        })
      );
    });

    socket.once("error", (err) => {
      setLoading(false);
      setError(err.message || "Failed to join game.");
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Join Game</h2>
        <p className="text-sm text-gray-500 mb-4">Room: {gameId}</p>
        {sessionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
            {sessionError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              placeholder="e.g. SpeedTyper"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !!sessionError}
            className="bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Game"}
          </button>
        </form>
      </div>
    </div>
  );
}
