import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGameSocket } from "../hooks/useGameSocket";
import { useProgressEmit } from "../hooks/useProgressEmit";
import { calcCorrectChars } from "../utils/progressCalc";
import CountdownOverlay from "../components/race/CountdownOverlay";
import TextDisplay from "../components/race/TextDisplay";
import RaceTrack from "../components/race/RaceTrack";
import TypingInput from "../components/race/TypingInput";
import ConnectionStatus from "../components/shared/ConnectionStatus";
import ErrorToast from "../components/shared/ErrorToast";

export default function GameRace() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { playerId } = useSelector((s) => s.session);
  const { raceState, setRaceState, connectionStatus, errors } = useGameSocket({ playerId, gameId });

  const [inputValue, setInputValue] = useState("");
  const [correctChars, setCorrectChars] = useState(0);
  const [phase, setPhase] = useState("countdown"); // countdown | racing | finished

  const emitProgress = useProgressEmit({ gameId, playerId });

  // If no raceState, redirect home (navigated here incorrectly)
  useEffect(() => {
    if (!raceState && !playerId) {
      navigate("/");
    }
  }, [raceState, playerId, navigate]);

  const handleGo = useCallback(() => {
    setPhase("racing");
    setRaceState((prev) => prev ? { ...prev, phase: "racing" } : prev);
  }, [setRaceState]);

  function handleInputChange(value) {
    if (phase !== "racing") return;
    setInputValue(value);
    const text = raceState?.text || "";
    const correct = calcCorrectChars(text, value);
    setCorrectChars(correct);
    emitProgress(correct, text.length);

    if (correct === text.length) {
      setPhase("finished");
    }
  }

  const text = raceState?.text || "";
  const players = raceState?.players || [];
  const startsAt = raceState?.startsAt;
  const showCountdown = phase === "countdown" && !!startsAt;

  return (
    <div
      className="flex flex-col bg-gray-50"
      style={{ height: "100dvh" }}
    >
      <ConnectionStatus status={connectionStatus} />
      <ErrorToast errors={errors} />

      {showCountdown && (
        <CountdownOverlay startsAt={startsAt} onGo={handleGo} />
      )}

      {/* Track area — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Race track */}
        {players.length > 0 && (
          <RaceTrack
            players={players}
            textLength={text.length}
            localPlayerId={playerId}
            localCorrectChars={correctChars}
          />
        )}

        {/* Text display */}
        <TextDisplay
          text={text}
          correctChars={correctChars}
          inputValue={inputValue}
        />

        {phase === "finished" && (
          <div className="text-center py-4 text-green-600 font-bold text-xl">
            Finished! Waiting for results...
          </div>
        )}
      </div>

      {/* Fixed bottom input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <TypingInput
          value={inputValue}
          onChange={handleInputChange}
          disabled={phase !== "racing"}
        />
      </div>
    </div>
  );
}
