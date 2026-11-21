import type { Game } from '@prisma/client'
import { prisma } from './prisma.ts'
import { matchesGame } from './matching.ts'
import { parseBundle } from './bundle.ts'
import { olxPt } from './olx.ts'

async function saveListing(game: Game, externalId: string, item: {
  title: string
  price: number
  condition: string | null
  url: string
  imageUrl: string | null
  location: string | null
}, currency: string) {
  const up = await prisma.listing.upsert({
    where: { marketplace_externalId: { marketplace: olxPt.id, externalId } },
    create: { externalId, marketplace: olxPt.id, title: item.title, price: item.price, currency, condition: item.condition, url: item.url, imageUrl: item.imageUrl, location: item.location, gameId: game.id },
    update: { price: item.price, title: item.title, url: item.url, imageUrl: item.imageUrl, location: item.location, condition: item.condition }
  })
  await prisma.priceSnapshot.create({ data: { listingId: up.id, price: up.price } }).catch(() => {})
}

export async function refreshListingsForGame(game: Game, opts: { regionId?: number } = {}): Promise<number> {
  const query = game.name.replace(/[:/]/g, ' ').replace(/\s*\(\d{4}\)\s*/g, ' ').trim()
  console.log(`[live scrape] query="${query}" for game="${game.name}"${opts.regionId ? ` region=${opts.regionId}` : ''}`)
  const scraped = await olxPt.search(query, { limit: 20, regionId: opts.regionId })
  console.log(`[live scrape] scraped=${scraped.length} titles=${scraped.slice(0, 3).map(s => s.title).join(' | ')}`)
  let matched = 0
  for (const s of scraped) {
    const bundle = parseBundle(s.description || '')
    if (bundle.length >= 3) {
      const adIds: string[] = []
      for (const [i, item] of bundle.entries()) {
        if (!matchesGame(item.title, game.name)) continue
        const externalId = `${s.externalId}#${i}`
        adIds.push(externalId)
        await saveListing(game, externalId, { ...item, url: s.url, imageUrl: s.imageUrl, location: s.location }, s.currency)
        matched++
      }
      // drop lines removed from the advert since the last scrape
      await prisma.listing.deleteMany({
        where: { marketplace: olxPt.id, externalId: { startsWith: `${s.externalId}#` }, NOT: { externalId: { in: adIds } } }
      }).catch(() => {})
      if (adIds.length) console.log(`[matcher] bundle "${s.title}" -> ${adIds.length} line(s)`)
      continue
    }

    const inTitle = matchesGame(s.title, game.name)
    const inDesc = matchesGame(s.description || '', game.name)
    if (!(inTitle || inDesc)) { console.log(`[matcher] skip "${s.title}" (desc ${inDesc ? 'hit' : 'miss'})`); continue }
    if (inDesc && !inTitle) console.log(`[matcher] bundle hit via description: "${s.title}" -> "${(s.description || '').slice(0, 80)}..."`)
    matched++
    await saveListing(game, s.externalId, s, s.currency)
  }
  console.log(`[live scrape] matched=${matched} -> listings now`)
  return matched
}
