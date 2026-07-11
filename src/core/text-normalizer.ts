export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
}

export function linesOf(text: string): string[] {
  return normalizeText(text).split('\n')
}
