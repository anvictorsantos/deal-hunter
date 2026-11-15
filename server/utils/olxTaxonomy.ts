// Resolved from GET /api/partner/categories on 2026-11-15; video-game leaves only (ADR 0005).
export const OLX_CATEGORY_VIDEOJOGOS = 4923

export const OLX_GAME_CATEGORY = {
  playstation: 5359,
  xbox: 5360,
  nintendo: 5361,
  retro: 5362,
  pc: 5363,
  other: 5364,
} as const

export const OLX_CONDITION_ATTRIBUTE = {
  code: 'state',
  values: { new: 'new', used: 'used' },
} as const
