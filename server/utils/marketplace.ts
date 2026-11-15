export type MarketplaceListing = {
  externalId: string
  title: string
  price: number
  currency: string
  condition: string | null
  url: string
  imageUrl: string | null
  location: string | null
  description?: string | null
}

export type SearchOptions = { limit?: number; regionId?: number }

export interface MarketplaceSource {
  readonly id: string
  search(query: string, opts?: SearchOptions): Promise<MarketplaceListing[]>
}
