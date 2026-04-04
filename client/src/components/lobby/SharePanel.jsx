import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function SharePanel({ gameId }) {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/game/${gameId}`;

  function handleCopy() {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: "Join my Typing Arena!", url: joinUrl });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <QRCodeSVG value={joinUrl} size={140} />
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-xs text-gray-500 break-all text-center">{joinUrl}</p>
        <div className="flex gap-2 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 border border-gray-300 text-gray-700 text-sm rounded-lg py-2 font-medium hover:bg-gray-100"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-indigo-600 text-white text-sm rounded-lg py-2 font-medium hover:bg-indigo-700"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
