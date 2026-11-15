const TOKEN_URL = 'https://www.olx.pt/api/open/oauth/token'
const BASE_URL = 'https://www.olx.pt/api/partner'
const SCOPE = 'v2 read write'

type TokenResponse = { access_token: string; expires_in: number; token_type: string; scope: string }

let cached: { token: string; expiresAt: number } | null = null

export async function getOlxToken(): Promise<{ token: string; scope: string; expiresIn: number }> {
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return { token: cached.token, scope: SCOPE, expiresIn: Math.floor((cached.expiresAt - Date.now()) / 1000) }
  }
  const clientId = process.env.OLX_CLIENT_ID
  const clientSecret = process.env.OLX_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('OLX_CLIENT_ID / OLX_CLIENT_SECRET not set')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: SCOPE,
    }),
  })
  if (!res.ok) throw new Error(`OLX token request failed ${res.status}: ${await res.text()}`)

  const json = await res.json() as TokenResponse
  cached = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return { token: json.access_token, scope: json.scope, expiresIn: json.expires_in }
}

export async function olxApiGet<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<T> {
  const { token } = await getOlxToken()
  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Version: '2.0', Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`OLX GET ${path} failed ${res.status}: ${await res.text()}`)
  return await res.json() as T
}

export type OlxCategory = { id: number; name: string; parent_id: number | null; is_leaf: boolean; photos_limit?: number }

export async function getCategories(parentId?: number): Promise<OlxCategory[]> {
  const json = await olxApiGet<{ data: OlxCategory[] }>('/categories', { parent_id: parentId })
  return json.data ?? []
}
