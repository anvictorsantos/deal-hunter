import type { Game } from '@prisma/client'
import { prisma } from './prisma.ts'
import { matchesGame } from './matching.ts'
import { parseBundle } from './bundle.ts'
import { fetchSellerProfiles, olxPt } from './olx.ts'
import { trustScore } from './sellerTrust.ts'
import type { SellerInfo } from './marketplace.ts'

type Matched = {
  externalId: string
  title: string
  price: number
  condition: string | null
  url: string
  imageUrl: string | null
  location: string | null
  currency: string
  seller: SellerInfo | null
}

const SELLER_TTL_MS = 24 * 60 * 60 * 1000

function toDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

async function resolveSellers(sellers: SellerInfo[]) {
  const byId = new Map<string, SellerInfo>()
  for (const s of sellers) if (s && !byId.has(s.id)) byId.set(s.id, s)
  if (!byId.size) return

  const existing = await prisma.seller.findMany({ where: { id: { in: [...byId.keys()] } } })
  const fresh = new Map(existing.filter(s => Date.now() - s.updatedAt.getTime() < SELLER_TTL_MS).map(s => [s.id, s]))
  const stale = [...byId.values()].filter(s => !fresh.has(s.id))
  const profiles = await fetchSellerProfiles(stale)

  for (const info of byId.values()) {
    if (fresh.has(info.id)) continue
    const profile = profiles.get(info.id)
    const memberSince = toDate(info.memberSince)
    const lastSeen = toDate(info.lastSeen)
    const adsCount = profile?.adsCount ?? null
    const rating = profile?.rating ?? null
    const data = {
      name: info.name,
      profileUrl: info.profileUrl,
      memberSince,
      lastSeen,
      adsCount,
      rating,
      trustScore: trustScore({ memberSince, lastSeen, adsCount, rating }),
    }
    await prisma.seller.upsert({ where: { id: info.id }, create: { id: info.id, ...data }, update: data })
  }
}

async function saveListing(game: Game, item: Matched) {
  const up = await prisma.listing.upsert({
    where: { marketplace_externalId: { marketplace: olxPt.id, externalId: item.externalId } },
    create: { externalId: item.externalId, marketplace: olxPt.id, title: item.title, price: item.price, currency: item.currency, condition: item.condition, url: item.url, imageUrl: item.imageUrl, location: item.location, gameId: game.id, sellerId: item.seller?.id ?? null },
    update: { price: item.price, title: item.title, url: item.url, imageUrl: item.imageUrl, location: item.location, condition: item.condition, sellerId: item.seller?.id ?? null }
  })
  await prisma.priceSnapshot.create({ data: { listingId: up.id, price: up.price } }).catch(() => {})
}

export async function refreshListingsForGame(game: Game, opts: { regionId?: number } = {}): Promise<number> {
  const query = game.name.replace(/[:/]/g, ' ').replace(/\s*\(\d{4}\)\s*/g, ' ').trim()
  console.log(`[live scrape] query="${query}" for game="${game.name}"${opts.regionId ? ` region=${opts.regionId}` : ''}`)
  const scraped = await olxPt.search(query, { limit: 20, regionId: opts.regionId })
  console.log(`[live scrape] scraped=${scraped.length} titles=${scraped.slice(0, 3).map(s => s.title).join(' | ')}`)

  const matched: Matched[] = []
  for (const s of scraped) {
    const bundle = parseBundle(s.description || '')
    if (bundle.length >= 3) {
      const adItems: Matched[] = []
      for (const [i, item] of bundle.entries()) {
        if (!matchesGame(item.title, game.name)) continue
        adItems.push({ ...item, externalId: `${s.externalId}#${i}`, url: s.url, imageUrl: s.imageUrl, location: s.location, currency: s.currency, seller: s.seller ?? null })
      }
      matched.push(...adItems)
      // drop lines removed from the advert since the last scrape
      await prisma.listing.deleteMany({
        where: { marketplace: olxPt.id, externalId: { startsWith: `${s.externalId}#` }, NOT: { externalId: { in: adItems.map(i => i.externalId) } } }
      }).catch(() => {})
      if (adItems.length) console.log(`[matcher] bundle "${s.title}" -> ${adItems.length} line(s)`)
      continue
    }

    const inTitle = matchesGame(s.title, game.name)
    const inDesc = matchesGame(s.description || '', game.name)
    if (!(inTitle || inDesc)) { console.log(`[matcher] skip "${s.title}" (desc ${inDesc ? 'hit' : 'miss'})`); continue }
    if (inDesc && !inTitle) console.log(`[matcher] bundle hit via description: "${s.title}" -> "${(s.description || '').slice(0, 80)}..."`)
    matched.push({ ...s, seller: s.seller ?? null })
  }

  await resolveSellers(matched.map(m => m.seller).filter((s): s is SellerInfo => !!s))
  for (const item of matched) await saveListing(game, item)

  console.log(`[live scrape] matched=${matched.length} -> listings now`)
  return matched.length
}
