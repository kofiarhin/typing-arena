import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateGameModal from "../components/shared/CreateGameModal";

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  function handleJoin(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      navigate(`/game/${code}`);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-indigo-950 to-indigo-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-3">⌨️</div>
          <h1 className="text-4xl font-black text-white tracking-tight">Typing Arena</h1>
          <p className="text-indigo-300 mt-2 text-base">
            Real-time multiplayer typing races
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-bold py-4 rounded-2xl shadow-lg"
          >
            Create Game
          </button>

          <div className="relative flex items-center gap-2">
            <div className="flex-1 h-px bg-indigo-800" />
            <span className="text-indigo-400 text-sm">or join</span>
            <div className="flex-1 h-px bg-indigo-800" />
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={8}
              className="w-full bg-indigo-800/50 border border-indigo-700 text-white placeholder-indigo-400 rounded-xl px-4 py-4 text-base text-center tracking-widest font-mono focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={joinCode.trim().length < 4}
              className="w-full border border-indigo-400 text-indigo-200 text-base font-bold py-4 rounded-2xl hover:bg-indigo-800 disabled:opacity-40"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>

      {showCreate && <CreateGameModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
