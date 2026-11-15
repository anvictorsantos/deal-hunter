import { chromium } from 'playwright'
import type { MarketplaceListing, MarketplaceSource } from './marketplace'

async function fetchDescription(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'pt-PT' } })
    if (!res.ok) return null
    const html = await res.text()
    // olx puts description in ld+json "description":"..." — fast to extract
    const m = html.match(/"description":"((?:\\"|[^"])+)"/)
    if (m) {
      try { return JSON.parse(`"${m[1]}"`) } catch { return m[1] }
    }
    // fallback: meta description
    const m2 = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (m2) return m2[1]
    return null
  } catch { return null }
}

// ponytail: single browser for search, fetch() for detail pages (no extra browsers) — add pool/parallel limit if >20 details
async function searchOlx(query: string, maxItems = 20, regionId?: number): Promise<MarketplaceListing[]> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' })
    const url = `https://www.olx.pt/d/q-${encodeURIComponent(query)}/${regionId ? `?search%5Bregion_id%5D=${regionId}` : ''}`
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

    // fetch descriptions for bundle-aware matching — only if title doesn't already hint, but cheap to fetch all 20 via fetch()
    const withDesc = await Promise.all(base.map(async (b) => {
      const desc = await fetchDescription(b.url)
      return { ...b, description: desc }
    }))

    return withDesc
  } finally {
    await browser.close()
  }
}

export const olxPt: MarketplaceSource = {
  id: 'olx_pt',
  search: (query, opts) => searchOlx(query, opts?.limit ?? 20, opts?.regionId),
}
