import { useState, useEffect } from "react";

export default function CountdownOverlay({ startsAt, onGo }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const tick = () => {
      const remaining = Math.ceil((startsAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setDisplay("GO!");
        onGo?.();
      } else {
        setDisplay(String(remaining));
      }
    };

    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startsAt, onGo]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
      <div className="text-center">
        <div
          className={`text-8xl font-black ${
            display === "GO!" ? "text-green-400" : "text-white"
          }`}
        >
          {display}
        </div>
        {display !== "GO!" && (
          <p className="text-gray-400 mt-4 text-lg">Get ready to type!</p>
        )}
      </div>
    </div>
  );
}
