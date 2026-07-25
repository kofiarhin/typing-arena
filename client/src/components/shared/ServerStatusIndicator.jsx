import { useSystemStatus } from "../../hooks/queries/useSystemStatus";

export default function ServerStatusIndicator() {
  const { data, isPending, isError } = useSystemStatus();

  let label = "Checking server…";
  let dotClass = "bg-yellow-300 animate-pulse";

  if (isError) {
    label = "Server unavailable";
    dotClass = "bg-red-300";
  } else if (!isPending && data?.status === "ok") {
    label = "Server online";
    dotClass = "bg-green-300";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur"
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      {label}
    </div>
  );
}
