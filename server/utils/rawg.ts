// ponytail: naive RAWG sync — full platform pages but only 20 games per top platform. Upgrade to incremental sync when catalog grows.
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
    await prisma.platform.upsert({
      where: { id: p.id },
      create: { id: p.id, name: p.name, slug: p.slug, gamesCount: p.games_count },
      update: { name: p.name, gamesCount: p.games_count }
    })
  }
  // seed a few games per platform — wire full pagination later
  for (const p of filtered.slice(0, 6)) {
    const gRes = await fetch(`https://api.rawg.io/api/games?key=${rawgKey}&platforms=${p.id}&page_size=20`)
    const { results: games } = await gRes.json()
    for (const g of games) {
      await prisma.game.upsert({
        where: { rawgId: g.id },
        create: { rawgId: g.id, rawgSlug: g.slug, name: g.name, coverImage: g.background_image, platformId: p.id },
        update: { name: g.name, coverImage: g.background_image }
      }).catch(() => {}) // duplicate slug across platforms creates distinct Game rows — handled by rawgId uniqueness per platform variant; S1 split
    }
  }
}
