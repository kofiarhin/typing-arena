export default function WinnerBanner({ winner, localPlayerId }) {
  if (!winner) {
    return (
      <div className="text-center p-6 bg-gray-100 rounded-2xl">
        <p className="text-gray-500 text-lg">No winner this round.</p>
      </div>
    );
  }

  const isMe = winner.playerId === localPlayerId;

  return (
    <div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-2xl">
      <div className="text-5xl mb-2">👑</div>
      <h2 className="text-2xl font-black text-amber-900">
        {isMe ? "You won!" : `${winner.username} wins!`}
      </h2>
      <p className="text-amber-700 mt-1 text-lg">
        {(winner.timeMs / 1000).toFixed(2)}s
      </p>
    </div>
  );
}
