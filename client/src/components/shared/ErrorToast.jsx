const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "This game doesn't exist.",
  ROOM_ENDED: "This game has already ended.",
  DUPLICATE_USERNAME: "That username is already taken in this room.",
  NOT_HOST: "Only the host can do that.",
  GAME_IN_PROGRESS: "The game has already started.",
  NOT_ENOUGH_PLAYERS: "Need at least 2 players to start.",
  ROOM_FULL: "This room is full (max 8 players).",
  INVALID_USERNAME: "Username must be 2–20 characters.",
};

export default function ErrorToast({ errors }) {
  if (!errors || errors.length === 0) return null;

  const error = errors[0];
  const message = ERROR_MESSAGES[error.code] || error.message || "Something went wrong.";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs text-center">
      {message}
    </div>
  );
}
