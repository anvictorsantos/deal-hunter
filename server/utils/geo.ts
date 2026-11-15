import { olxApiGet } from './olxApi.ts'

export type Nearby = { regionId: number | null; cities: string[] }

type OlxLocation = {
  city: { id: number; region_id: number; name: string } | null
  district: { id: number; name: string } | null
}

type OlxCity = { id: number; region_id: number; name: string; latitude: number; longitude: number }

const CACHE_TTL_MS = 60 * 60 * 1000
const RADIUS_KM = 25
const MAX_CITIES = 60
const cache = new Map<string, { value: Nearby; expiresAt: number }>()

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLon = (bLon - aLon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export async function resolveNearby(latitude: number, longitude: number): Promise<Nearby> {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.value

  const locations = await olxApiGet<{ data: OlxLocation[] }>('/locations', { latitude, longitude })
  const regionId = locations.data?.[0]?.city?.region_id ?? null
  if (!regionId) throw new Error('OLX could not resolve a region for these coordinates')

  const cities = await olxApiGet<{ data: OlxCity[] }>('/cities', { region_id: regionId, limit: 1000 })
  const names = (cities.data ?? [])
    .filter(c => c.latitude && c.longitude && distanceKm(latitude, longitude, c.latitude, c.longitude) <= RADIUS_KM)
    .map(c => c.name)
  const value: Nearby = { regionId, cities: [...new Set(names)].slice(0, MAX_CITIES) }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

// OLX location strings look like "Arroios - Para o topo hoje às 18:18"
export function matchesNearbyLocation(location: string | null, cities: string[]) {
  if (!location) return false
  const head = location.split(' - ')[0].trim().toLowerCase()
  if (!head) return false
  return cities.some(city => head === city.toLowerCase())
}
