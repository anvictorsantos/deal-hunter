import type { Game } from '@prisma/client'
import { prisma } from './prisma.ts'
import { matchesGame } from './matching.ts'
import { olxPt } from './olx.ts'

export async function refreshListingsForGame(game: Game, opts: { regionId?: number } = {}): Promise<number> {
  const query = game.name.replace(/[:/]/g, ' ').trim()
  console.log(`[live scrape] query="${query}" for game="${game.name}"${opts.regionId ? ` region=${opts.regionId}` : ''}`)
  const scraped = await olxPt.search(query, { limit: 20, regionId: opts.regionId })
  console.log(`[live scrape] scraped=${scraped.length} titles=${scraped.slice(0, 3).map(s => s.title).join(' | ')}`)
  let matched = 0
  for (const s of scraped) {
    const inTitle = matchesGame(s.title, game.name)
    const inDesc = matchesGame(s.description || '', game.name)
    if (!(inTitle || inDesc)) { console.log(`[matcher] skip "${s.title}" (desc ${inDesc ? 'hit' : 'miss'})`); continue }
    if (inDesc && !inTitle) console.log(`[matcher] bundle hit via description: "${s.title}" -> "${(s.description || '').slice(0, 80)}..."`)
    matched++
    const up = await prisma.listing.upsert({
      where: { marketplace_externalId: { marketplace: olxPt.id, externalId: s.externalId } },
      create: { externalId: s.externalId, marketplace: olxPt.id, title: s.title, price: s.price, currency: s.currency, condition: s.condition, url: s.url, imageUrl: s.imageUrl, location: s.location, gameId: game.id },
      update: { price: s.price, title: s.title, url: s.url, imageUrl: s.imageUrl, location: s.location }
    })
    await prisma.priceSnapshot.create({ data: { listingId: up.id, price: up.price } }).catch(() => {})
  }
  console.log(`[live scrape] matched=${matched} -> listings now`)
  return matched
}
