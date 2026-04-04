export function calcCorrectChars(text, input) {
  let count = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === text[i]) count++;
    else break;
  }
  return count;
}
