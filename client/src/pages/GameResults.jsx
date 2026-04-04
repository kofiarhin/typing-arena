import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { socket } from "../services/socket";
import { useGameSocket } from "../hooks/useGameSocket";
import WinnerBanner from "../components/results/WinnerBanner";
import RoundStandings from "../components/results/RoundStandings";
import SessionLeaderboard from "../components/results/SessionLeaderboard";
import RoundHistory from "../components/results/RoundHistory";
import HostResultsControls from "../components/results/HostResultsControls";
import ConnectionStatus from "../components/shared/ConnectionStatus";
import ErrorToast from "../components/shared/ErrorToast";

export default function GameResults() {
  const { gameId } = useParams();
  const { playerId, isHost } = useSelector((s) => s.session);
  const { roundResults, connectionStatus, errors } = useGameSocket({ playerId, gameId });

  function handleRestart() {
    socket.emit("round:restart", { gameId, playerId });
  }

  function handleEnd() {
    socket.emit("session:end", { gameId, playerId });
  }

  if (!roundResults) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading results...</p>
      </div>
    );
  }

  const { winner, results, leaderboard, history } = roundResults;

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <ConnectionStatus status={connectionStatus} />
      <ErrorToast errors={errors} />

      <div className="bg-indigo-900 text-white px-4 py-4 text-center">
        <h1 className="font-bold text-lg">Round Results</h1>
        <p className="text-indigo-300 text-xs">{gameId}</p>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 max-w-lg mx-auto w-full">
        <WinnerBanner winner={winner} localPlayerId={playerId} />

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Round Standings
          </h2>
          <RoundStandings results={results} localPlayerId={playerId} />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Session Leaderboard
          </h2>
          <SessionLeaderboard leaderboard={leaderboard} localPlayerId={playerId} />
        </section>

        {history?.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Round History
            </h2>
            <RoundHistory history={history} />
          </section>
        )}

        <div className="mt-auto pb-6">
          <HostResultsControls
            isHost={isHost}
            onRestart={handleRestart}
            onEnd={handleEnd}
          />
        </div>
      </div>
    </div>
  );
}
