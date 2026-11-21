function normalize(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() }

// RAWG titles often carry a disambiguation year: "Dead Space (2008)".
export function matchesGame(text: string, gameName: string) {
  if (!text) return false
  const haystack = normalize(text)
  const needle = normalize(gameName.replace(/\s*\(\d{4}\)\s*/g, ' '))
  return !!needle && haystack.includes(needle)
}
