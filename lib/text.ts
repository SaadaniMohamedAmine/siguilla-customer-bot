export function cleanText(input: string): string {
  const NUL = String.fromCharCode(0);
  return input
    .split(NUL)
    .join("")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
