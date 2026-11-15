import { prisma } from '../utils/prisma'

// GET /api/games?q=zelda&platform=switch
// S1: Game is per title × platform. Search is catalog-only (RAWG-synced into DB) with RAWG fallback when local empty.
export default defineEventHandler(async (event) => {
  const { q, platform } = getQuery(event) as { q?: string; platform?: string }
  const where: any = {}
  if (q) where.name = { contains: q } // ponytail: SQLite has no mode; LIKE is case-insensitive for ASCII
  if (platform) where.platform = { slug: platform }

  let games = await prisma.game.findMany({
    where,
    include: { platform: true },
    take: 48,
    orderBy: { name: 'asc' }
  })

  // fallback to RAWG when local search empty and q present — syncs top result into DB
  if (q && games.length === 0) {
    const config = useRuntimeConfig(event)
    const key = config.rawgApiKey || process.env.RAWG_API_KEY
    if (key) {
      try {
        const url = `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(q)}&page_size=12`
        const r = await fetch(url)
        const j: any = await r.json()
        for (const g of (j.results || [])) {
          // RAWG platforms may be empty — skip those
          for (const p of (g.platforms || []).slice(0, 3)) {
            const plat = p.platform
            // upsert platform
            await prisma.platform.upsert({
              where: { id: plat.id },
              create: { id: plat.id, name: plat.name, slug: plat.slug, gamesCount: 0 },
              update: {}
            })
            // upsert game per platform (S1 split)
            await prisma.game.upsert({
              where: { rawgId: g.id }, // note: rawgId is unique, but we need per-platform variant — for fallback use first platform only
              create: { rawgId: g.id, rawgSlug: g.slug, name: g.name, coverImage: g.background_image, platformId: plat.id },
              update: {}
            }).catch(() => {})
            break // only first platform for search fallback to avoid duplicate rawgId conflict
          }
        }
        // re-query after sync
        games = await prisma.game.findMany({
          where,
          include: { platform: true },
          take: 48,
          orderBy: { name: 'asc' }
        })
      } catch (e) { console.error('[RAWG fallback]', (e as any).message) }
    }
  }

  return games.map(g => ({
    id: g.id, rawgId: g.rawgId, name: g.name, coverImage: g.coverImage,
    platformName: g.platform.name, platformSlug: g.platform.slug
  }))
})
