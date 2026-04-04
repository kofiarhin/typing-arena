export default function TextDisplay({ text, correctChars, inputValue }) {
  if (!text) return null;

  return (
    <div className="font-mono text-lg leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-200 select-none">
      {text.split("").map((char, i) => {
        let className = "text-gray-400"; // remaining

        if (i < correctChars) {
          className = "text-green-600"; // correct
        } else if (i === correctChars) {
          className = "bg-indigo-200 text-indigo-900 rounded"; // cursor
        } else if (i < inputValue.length) {
          className = "text-red-500 bg-red-50"; // error chars beyond correctChars
        }

        return (
          <span key={i} className={className}>
            {char}
          </span>
        );
      })}
    </div>
  );
}
