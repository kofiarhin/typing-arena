export default function ConnectionStatus({ status }) {
  if (status === "connected") return null;

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-full shadow">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      Reconnecting...
    </div>
  );
}
