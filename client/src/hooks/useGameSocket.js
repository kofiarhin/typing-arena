import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../services/socket";
import { updateHost, setRaceData, clearRaceData } from "../features/session/sessionSlice";

export function useGameSocket({ playerId, gameId } = {}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const storedRaceData = useSelector((s) => s.session.raceData);

  const [sessionData, setSessionData] = useState(null);
  // Seed raceState from Redux so it survives the GameLobby → GameRace route transition
  const [raceState, setRaceState] = useState(() =>
    storedRaceData
      ? { ...storedRaceData, players: [], phase: "countdown" }
      : null
  );
  const [roundResults, setRoundResults] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [errors, setErrors] = useState([]);

  const pushError = useCallback((err) => {
    setErrors((prev) => [...prev, err]);
    setTimeout(() => setErrors((prev) => prev.slice(1)), 4000);
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    function onSessionUpdate(data) {
      setSessionData(data);
      if (data.status === "ended") {
        navigate(`/end/${data.gameId}`);
      }
      // Update host status in Redux if it changed
      const me = data.players?.find((p) => p.playerId === playerId);
      if (me) {
        dispatch(updateHost(me.isHost));
      }
    }

    function onCountdownStart(data) {
      const racePayload = {
        text: data.text,
        startsAt: data.startsAt,
        roundNumber: data.roundNumber,
      };
      dispatch(setRaceData(racePayload));
      setRaceState({ ...racePayload, players: [], phase: "countdown" });
      navigate(`/race/${data.gameId}`);
    }

    function onRoundUpdate(data) {
      setRaceState((prev) => {
        if (!prev) return prev;
        return { ...prev, players: data.players, leaderPlayerId: data.leaderPlayerId };
      });
    }

    function onRoundFinished(data) {
      dispatch(clearRaceData());
      setRoundResults(data);
      navigate(`/results/${data.gameId}`);
    }

    function onPlayerDisconnected(data) {
      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players?.map((p) =>
            p.playerId === data.playerId ? { ...p, isActive: false } : p
          ),
        };
      });
    }

    function onPlayerReconnected(data) {
      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players?.map((p) =>
            p.playerId === data.playerId ? { ...p, isActive: true } : p
          ),
        };
      });
    }

    function onError(err) {
      pushError(err);
    }

    function onDisconnect() {
      setConnectionStatus("reconnecting");
    }

    function onConnect() {
      setConnectionStatus("connected");
    }

    socket.on("session:update", onSessionUpdate);
    socket.on("countdown:start", onCountdownStart);
    socket.on("round:update", onRoundUpdate);
    socket.on("round:finished", onRoundFinished);
    socket.on("player:disconnected", onPlayerDisconnected);
    socket.on("player:reconnected", onPlayerReconnected);
    socket.on("error", onError);
    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);

    return () => {
      socket.off("session:update", onSessionUpdate);
      socket.off("countdown:start", onCountdownStart);
      socket.off("round:update", onRoundUpdate);
      socket.off("round:finished", onRoundFinished);
      socket.off("player:disconnected", onPlayerDisconnected);
      socket.off("player:reconnected", onPlayerReconnected);
      socket.off("error", onError);
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
    };
  }, [navigate, dispatch, playerId, pushError]);

  return { sessionData, raceState, setRaceState, roundResults, connectionStatus, errors };
}
