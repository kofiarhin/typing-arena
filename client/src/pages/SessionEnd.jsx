import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useGameSocket } from "../hooks/useGameSocket";
import { clearSession } from "../features/session/sessionSlice";
import SessionLeaderboard from "../components/results/SessionLeaderboard";
import RoundHistory from "../components/results/RoundHistory";

export default function SessionEnd() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { playerId } = useSelector((s) => s.session);
  const { roundResults } = useGameSocket({ playerId, gameId });

  function handleHome() {
    dispatch(clearSession());
    navigate("/");
  }

  const leaderboard = roundResults?.leaderboard || [];
  const history = roundResults?.history || [];
  const champion = leaderboard[0] || null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-indigo-950 to-indigo-900 flex flex-col">
      <div className="flex-1 p-4 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Champion */}
        <div className="text-center pt-8 pb-4">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-3xl font-black text-white">
            {champion ? `${champion.username} wins!` : "Session Over"}
          </h1>
          {champion && (
            <p className="text-indigo-300 mt-1">
              {champion.wins} win{champion.wins !== 1 ? "s" : ""} · best {(champion.bestTimeMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>

        {leaderboard.length > 0 && (
          <section className="bg-white rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Final Leaderboard
            </h2>
            <SessionLeaderboard leaderboard={leaderboard} localPlayerId={playerId} />
          </section>
        )}

        {history.length > 0 && (
          <section className="bg-white rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Round History
            </h2>
            <RoundHistory history={history} />
          </section>
        )}

        <button
          onClick={handleHome}
          className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-bold py-4 rounded-2xl mt-auto mb-6"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
