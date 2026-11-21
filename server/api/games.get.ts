import { prisma } from '../utils/prisma'

type RawgGame = {
  id: number
  slug: string
  name: string
  background_image: string | null
  platforms?: { platform: { id: number; name: string; slug: string; games_count?: number } }[]
}

// ponytail: one RAWG page per search, first 6 platforms per title. Paginate when the catalog needs >40 hits.
async function syncRawgSearch(key: string, q: string, platformId?: number) {
  const url = new URL('https://api.rawg.io/api/games')
  url.searchParams.set('key', key)
  url.searchParams.set('search', q)
  url.searchParams.set('page_size', '40')
  if (platformId) url.searchParams.set('platforms', String(platformId))

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`RAWG search failed ${res.status}`)
  const json = await res.json() as { results?: RawgGame[] }

  for (const g of json.results ?? []) {
    for (const { platform: p } of (g.platforms ?? []).slice(0, 6)) {
      const plat = await prisma.platform.upsert({
        where: { id: p.id },
        create: { id: p.id, name: p.name, slug: p.slug, gamesCount: p.games_count ?? 0 },
        update: { name: p.name, slug: p.slug },
      })
      await prisma.game.upsert({
        where: { rawgId_platformId: { rawgId: g.id, platformId: plat.id } },
        create: { rawgId: g.id, rawgSlug: g.slug, name: g.name, coverImage: g.background_image, platformId: plat.id },
        update: { name: g.name, ...(g.background_image ? { coverImage: g.background_image } : {}) },
      })
    }
  }
}

// GET /api/games?q=zelda&platform=switch
// Game is per title × platform. Search always refreshes from RAWG, then reads the local catalog.
export default defineEventHandler(async (event) => {
  const { q, platform } = getQuery(event) as { q?: string; platform?: string }
  const where: any = {}
  if (q) where.name = { contains: q, mode: 'insensitive' }
  if (platform) where.platform = { slug: platform }

  if (q) {
    const config = useRuntimeConfig(event)
    const key = config.rawgApiKey || process.env.RAWG_API_KEY
    const plat = platform ? await prisma.platform.findUnique({ where: { slug: platform } }) : null
    if (platform && !plat) return []
    if (key) {
      try {
        await syncRawgSearch(key, q, plat?.id)
      } catch (e: any) {
        console.error('[RAWG search]', e.message)
      }
    }
  }

  const games = await prisma.game.findMany({
    where,
    include: { platform: true },
    take: q ? 200 : 48,
    orderBy: { name: 'asc' }
  })

  return games.map(g => ({
    id: g.id, rawgId: g.rawgId, name: g.name, coverImage: g.coverImage,
    platformName: g.platform.name, platformSlug: g.platform.slug
  }))
})
