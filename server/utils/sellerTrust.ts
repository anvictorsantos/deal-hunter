export type SellerSignals = {
  memberSince?: Date | null
  lastSeen?: Date | null
  adsCount?: number | null
  rating?: number | null
  isBusiness?: boolean
}

const DAY = 24 * 60 * 60 * 1000

// Heuristic 0–100. Age and rating carry most weight; a missing rating is neutral, not bad.
export function trustScore(s: SellerSignals, now = new Date()) {
  let score = 40
  if (s.memberSince) {
    const days = (now.getTime() - s.memberSince.getTime()) / DAY
    if (days >= 730) score += 25
    else if (days >= 365) score += 20
    else if (days >= 90) score += 10
    else if (days >= 30) score += 0
    else score -= 20
  } else score -= 5

  if (s.rating != null) {
    if (s.rating >= 4.5) score += 20
    else if (s.rating >= 4) score += 12
    else if (s.rating >= 3) score += 5
    else score -= 10
  }

  if (s.lastSeen) {
    const days = (now.getTime() - s.lastSeen.getTime()) / DAY
    if (days <= 30) score += 10
    else if (days <= 90) score += 5
    else if (days > 365) score -= 10
  }

  if (s.adsCount != null) {
    if (s.adsCount <= 0) score -= 10
    else if (s.adsCount <= 2000) score += 5
  }

  if (s.isBusiness) score += 5
  return Math.max(0, Math.min(100, score))
}

export function trustLabel(score: number) {
  return score >= 70 ? 'Trusted seller' : score >= 40 ? 'Check seller' : 'New seller'
}
