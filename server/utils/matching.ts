function normalize(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() }

export function matchesGame(text: string, gameName: string) {
  if (!text) return false
  return normalize(text).includes(normalize(gameName))
}
