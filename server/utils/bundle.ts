export type BundleItem = { title: string; price: number; condition: string | null }

const PRICE_LINE = /^(.*?)(\d+(?:[.,]\d{1,2})?)\s*€\s*(.*)$/

// OLX lot adverts list each game and its own price in the description, e.g. "-Dead Space 2 Collector’s Edition 40€".
export function parseBundle(description: string): BundleItem[] {
  const items: BundleItem[] = []
  // OLX descriptions often lose newlines and separate items with " -Title", but titles may keep "Title - 15€".
  const lines = description.replace(/\s+[-–—•*]\s*(?=[A-Za-zÀ-ÿ])/g, '\n-').split(/\r?\n/)
  for (const raw of lines) {
    const bullet = raw.trim().match(/^[-–—•*]\s*(.+)$/)
    if (!bullet) continue
    const line = bullet[1]
    const m = line.match(PRICE_LINE)
    if (!m) continue
    const title = m[1].replace(/[\s\-–—:]+$/, '').trim()
    const price = Number(m[2].replace(',', '.'))
    if (!title || !Number.isFinite(price) || price <= 0) continue
    const suffix = m[3]
    const condition = /novo|selado|sealed/i.test(suffix) ? 'new' : /usado/i.test(suffix) ? 'used' : null
    items.push({ title, price, condition })
  }
  return items
}

export function isBundleAd(description: string | null | undefined) {
  return !!description && parseBundle(description).length >= 3
}
