import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSslMode } from '../server/utils/database-url.ts'

test('weak sslmode becomes verify-full', () => {
  for (const mode of ['prefer', 'require', 'verify-ca']) {
    const out = new URL(normalizeSslMode(`postgresql://u:p@h/db?sslmode=${mode}`)!)
    assert.equal(out.searchParams.get('sslmode'), 'verify-full')
  }
})

test('verify-full and non-ssl urls are untouched', () => {
  const full = 'postgresql://u:p@h/db?sslmode=verify-full'
  assert.equal(normalizeSslMode(full), full)
  const none = 'postgresql://u:p@h/db'
  assert.equal(normalizeSslMode(none), none)
  assert.equal(normalizeSslMode(undefined), undefined)
})

test('uselibpqcompat opts out', () => {
  const url = 'postgresql://u:p@h/db?sslmode=require&uselibpqcompat=true'
  assert.equal(normalizeSslMode(url), url)
})
