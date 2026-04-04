const texts = [
  "The quick brown fox jumps over the lazy dog near the river bank.",
  "Practice makes perfect, and perfection is what we are aiming for today.",
  "Speed and accuracy are the two pillars of great typing performance.",
  "Every keystroke counts when you are racing against the clock and your rivals.",
  "A good typist knows that consistency beats bursts of frantic speed.",
  "Focus on the words ahead, not the mistakes you have already made.",
  "The best way to get faster is to type every day without looking at the keys.",
  "Champions are made in the moments when they want to quit but choose to keep going.",
  "Typing is a skill that rewards patience, repetition, and calm concentration.",
  "Push your limits a little further with every race and you will surprise yourself.",
  "Words flow faster when your fingers know exactly where each key lives.",
  "Stay calm under pressure and your fingers will find their rhythm naturally.",
  "Great things are built one character at a time, just like great typing speed.",
];

function getRandomText() {
  return texts[Math.floor(Math.random() * texts.length)];
}

module.exports = { getRandomText };
