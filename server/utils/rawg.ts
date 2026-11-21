// ponytail: naive RAWG sync — full platform pages but only 20 games per top platform. Upgrade to incremental sync when catalog grows.
import { brandForSlug } from './brands.ts'

export async function syncPlatformsAndGames(rawgKey: string, prisma: any) {
  const platforms: any[] = []
  for (let page = 1; ; page++) {
    const res = await fetch(`https://api.rawg.io/api/platforms?key=${rawgKey}&page_size=40&page=${page}`)
    const json: any = await res.json()
    platforms.push(...(json.results ?? []))
    if (!json.next) break
  }
  const filtered = platforms.filter((p: any) => p.games_count > 0)
  for (const p of filtered) {
    const brandName = brandForSlug(p.slug)
    const brand = await prisma.brand.upsert({ where: { name: brandName }, create: { name: brandName }, update: {} })
    await prisma.platform.upsert({
      where: { id: p.id },
      create: { id: p.id, name: p.name, slug: p.slug, gamesCount: p.games_count, brandId: brand.id },
      update: { name: p.name, gamesCount: p.games_count, brandId: brand.id }
    })
  }
  // seed a few games per platform — wire full pagination later
  for (const p of filtered.slice(0, 6)) {
    const gRes = await fetch(`https://api.rawg.io/api/games?key=${rawgKey}&platforms=${p.id}&page_size=20`)
    const { results: games } = await gRes.json()
    for (const g of games) {
      await prisma.game.upsert({
        where: { rawgId_platformId: { rawgId: g.id, platformId: p.id } },
        create: { rawgId: g.id, rawgSlug: g.slug, name: g.name, coverImage: g.background_image, platformId: p.id },
        update: { name: g.name, ...(g.background_image ? { coverImage: g.background_image } : {}) }
      })
    }
  }
}
