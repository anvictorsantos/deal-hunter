import assert from 'node:assert/strict'
import test from 'node:test'
import { trustLabel, trustScore } from '../server/utils/sellerTrust.ts'

const now = new Date('2026-11-21T00:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)

test('long-standing rated active seller scores high', () => {
  const score = trustScore({ memberSince: daysAgo(3650), lastSeen: daysAgo(2), adsCount: 150, rating: 4.8 }, now)
  assert.equal(score, 100)
  assert.equal(trustLabel(score), 'Trusted seller')
})

test('brand-new unrated seller scores low', () => {
  const score = trustScore({ memberSince: daysAgo(3), lastSeen: daysAgo(2), adsCount: 1, rating: null }, now)
  assert.ok(score < 40, `expected < 40, got ${score}`)
  assert.equal(trustLabel(score), 'New seller')
})

test('inactive unrated seller is not trusted', () => {
  const score = trustScore({ memberSince: daysAgo(200), lastSeen: daysAgo(400), adsCount: 3, rating: null }, now)
  assert.equal(trustLabel(score), 'Check seller')
})

test('score stays within 0..100', () => {
  assert.equal(trustScore({ memberSince: daysAgo(9999), lastSeen: daysAgo(0), adsCount: 1, rating: 5, isBusiness: true }, now), 100)
  assert.equal(trustScore({ memberSince: daysAgo(1), lastSeen: daysAgo(999), adsCount: 0, rating: 1 }, now), 0)
})
