import { chromium } from 'playwright'
import type { MarketplaceListing, MarketplaceSource, SellerInfo } from './marketplace'

function parseSeller(html: string): SellerInfo | null {
  const block = html.match(/\\?"user\\?":\{[^}]*\}/s)?.[0]
  const slug = html.match(/\/ads\/user\/([A-Za-z0-9]+)\//)?.[1]
  if (!block || !slug) return null
  try {
    const user = JSON.parse(`{${block.replace(/\\"/g, '"')}}`).user
    if (!user.id) return null
    return {
      id: String(user.id),
      name: user.name || 'Unknown',
      profileUrl: `https://www.olx.pt/ads/user/${slug}/`,
      memberSince: user.created ?? null,
      lastSeen: user.lastSeen ?? null,
    }
  } catch { return null }
}

async function fetchDetail(url: string): Promise<{ description: string | null; seller: SellerInfo | null }> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'pt-PT' } })
    if (!res.ok) return { description: null, seller: null }
    const html = await res.text()
    let description: string | null = null
    // olx puts description in ld+json "description":"..." — fast to extract
    const m = html.match(/"description":"((?:\\"|[^"])+)"/)
    if (m) {
      try { description = JSON.parse(`"${m[1]}"`) } catch { description = m[1] }
    } else {
      const m2 = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
      if (m2) description = m2[1]
    }
    return { description, seller: parseSeller(html) }
  } catch { return { description: null, seller: null } }
}

// Profile data (ad count, rating) is client-rendered, so this is the one place that needs a browser per seller.
export async function fetchSellerProfiles(sellers: SellerInfo[]): Promise<Map<string, { adsCount: number | null; rating: number | null }>> {
  const out = new Map<string, { adsCount: number | null; rating: number | null }>()
  if (!sellers.length) return out
  const browser = await chromium.launch({ headless: true })
  try {
    for (const seller of sellers.slice(0, 10)) {
      const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', locale: 'pt-PT' })
      try {
        await page.goto(seller.profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
        await page.waitForTimeout(2500)
        const text = await page.locator('body').innerText()
        const ads = text.match(/Encontr[áa]mos\s+(\d+)\s+an[úu]ncios/i)
        const score = /Sem classifica/i.test(text) ? null : text.match(/\b([0-5][.,]\d)\b/)
        out.set(seller.id, {
          adsCount: ads ? Number(ads[1]) : null,
          rating: score ? Number(score[1].replace(',', '.')) : null,
        })
      } catch {} finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
  return out
}

// ponytail: single browser for search, fetch() for detail pages (no extra browsers) — add pool/parallel limit if >20 details
// Category path (videojogos 4923) keeps unrelated "space"/"dead" hits out; ?search[category_id] alone returns zero cards.
const SEARCH_BASE = 'https://www.olx.pt/tecnologia-e-informatica/videojogos-consolas/videojogos'

async function searchOlx(query: string, maxItems = 20, regionId?: number): Promise<MarketplaceListing[]> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' })
    const url = `${SEARCH_BASE}/q-${encodeURIComponent(query)}/${regionId ? `?search%5Bregion_id%5D=${regionId}` : ''}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForTimeout(1800)
    try { await page.locator('[data-testid="cookie-policy"] button').click({ timeout: 1500 }) } catch {}
    await page.waitForSelector('[data-testid="l-card"], [data-testid="listing-grid"]', { timeout: 8000 }).catch(() => {})

    const cards = await page.$$eval('[data-testid="l-card"]', (els, max) => {
      return els.slice(0, max as number).map((card: any) => {
        const linkEl = card.querySelector('a[href*="/d/anuncio/"]') as HTMLAnchorElement | null
        const href = linkEl?.href || ''
        const title = card.querySelector('[data-testid="ad-card-title"] h4, h4')?.textContent?.trim() || linkEl?.getAttribute('aria-label')?.trim() || ''
        const priceText = card.querySelector('[data-testid="ad-price"]')?.textContent?.trim() || ''
        const img = card.querySelector('img')?.src || null
        const loc = card.querySelector('[data-testid="location-date"]')?.textContent?.trim() || null
        const badgeText = card.querySelector('[data-nx-name="NexusBadge"]')?.textContent?.trim() || ''
        const m = href.match(/ID([a-zA-Z0-9]+)\.html/)
        const id = m ? m[1] : href
        return { href, title, priceText, img, loc, badgeText, id }
      })
    }, maxItems) as any[]

    const base = cards.filter(c => c.title && c.href).map(c => {
      const num = c.priceText.replace(/[^\d,.-]/g, '').replace(',', '.')
      const price = parseFloat(num) || 0
      const bt = c.badgeText.toLowerCase()
      const condition = bt.includes('novo') ? 'new' : bt.includes('usado') ? 'used' : null
      const url = c.href.startsWith('http') ? c.href : `https://www.olx.pt${c.href}`
      return {
        externalId: String(c.id),
        title: c.title,
        price,
        currency: 'EUR',
        condition,
        url,
        imageUrl: c.img && !c.img.startsWith('data:') ? c.img : null,
        location: c.loc,
        description: null as string | null,
      } as MarketplaceListing
    })

    // fetch descriptions and seller card for matching and trust — detail pages are plain HTML
    const withDetail = await Promise.all(base.map(async (b) => {
      const detail = await fetchDetail(b.url)
      return { ...b, description: detail.description, seller: detail.seller }
    }))

    return withDetail
  } finally {
    await browser.close()
  }
}

export const olxPt: MarketplaceSource = {
  id: 'olx_pt',
  search: (query, opts) => searchOlx(query, opts?.limit ?? 20, opts?.regionId),
}
