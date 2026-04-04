import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import GameLobby from "../pages/GameLobby";
import GameRace from "../pages/GameRace";
import GameResults from "../pages/GameResults";
import SessionEnd from "../pages/SessionEnd";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game/:gameId" element={<GameLobby />} />
      <Route path="/race/:gameId" element={<GameRace />} />
      <Route path="/results/:gameId" element={<GameResults />} />
      <Route path="/end/:gameId" element={<SessionEnd />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
