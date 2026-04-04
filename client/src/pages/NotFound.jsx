import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-indigo-950 flex flex-col items-center justify-center gap-4 p-6">
      <div className="text-6xl">🌐</div>
      <h1 className="text-3xl font-black text-white">Page Not Found</h1>
      <p className="text-indigo-300">This page doesn't exist.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl"
      >
        Back to Home
      </button>
    </div>
  );
}
