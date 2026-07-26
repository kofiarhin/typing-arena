import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  playerId: null,
  username: null,
  gameId: null,
  isHost: false,
  raceData: null, // { text, startsAt, roundNumber } — persists across route transitions
  roundResults: null, // persists the completed round payload for the results route
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action) {
      const { playerId, username, gameId, isHost } = action.payload;
      state.playerId = playerId;
      state.username = username;
      state.gameId = gameId;
      state.isHost = isHost;
    },
    updateHost(state, action) {
      state.isHost = action.payload;
    },
    setRaceData(state, action) {
      state.raceData = action.payload;
      state.roundResults = null;
    },
    clearRaceData(state) {
      state.raceData = null;
    },
    setRoundResults(state, action) {
      state.roundResults = action.payload;
    },
    clearRoundResults(state) {
      state.roundResults = null;
    },
    clearSession(state) {
      state.playerId = null;
      state.username = null;
      state.gameId = null;
      state.isHost = false;
      state.raceData = null;
      state.roundResults = null;
    },
  },
});

export const {
  setSession,
  updateHost,
  setRaceData,
  clearRaceData,
  setRoundResults,
  clearRoundResults,
  clearSession,
} = sessionSlice.actions;
export default sessionSlice.reducer;
