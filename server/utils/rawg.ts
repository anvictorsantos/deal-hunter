// ponytail: naive RAWG sync — paginates once, filters gamesCount>200. Upgrade to incremental sync when catalog grows.
export async function syncPlatformsAndGames(rawgKey: string, prisma: any) {
  const platRes = await fetch(`https://api.rawg.io/api/platforms?key=${rawgKey}`)
  const { results } = await platRes.json()
  const filtered = results.filter((p: any) => p.games_count > 200)
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
