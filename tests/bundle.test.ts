import assert from 'node:assert/strict'
import test from 'node:test'
import { isBundleAd, parseBundle } from '../server/utils/bundle.ts'
import { matchesGame } from '../server/utils/matching.ts'

const sample = `Jogos Playstation 3 Ps3
-Absolute Supercars 12€
-Borderlands 2 - 6€
-Binary Domain 25€ Novo/Selado
-Chaves Kart €
-F1 Formula 2014 - 15€
-WipEout HD Fury 30€`

test('parses each priced line', () => {
  assert.deepEqual(parseBundle(sample), [
    { title: 'Absolute Supercars', price: 12, condition: null },
    { title: 'Borderlands 2', price: 6, condition: null },
    { title: 'Binary Domain', price: 25, condition: 'new' },
    { title: 'F1 Formula 2014', price: 15, condition: null },
    { title: 'WipEout HD Fury', price: 30, condition: null },
  ])
})

test('parses inline descriptions that lost their newlines', () => {
  const inline = 'Jogos Playstation 3 Ps3 -Absolute Supercars 12€ -Borderlands 2 - 6€ -F1 Formula 2014 - 15€ -Spider-Man Web of Shadows 120€'
  assert.deepEqual(parseBundle(inline), [
    { title: 'Absolute Supercars', price: 12, condition: null },
    { title: 'Borderlands 2', price: 6, condition: null },
    { title: 'F1 Formula 2014', price: 15, condition: null },
    { title: 'Spider-Man Web of Shadows', price: 120, condition: null },
  ])
})

test('ignores prose and missing prices', () => {
  assert.deepEqual(parseBundle('Jogos em bom estado, veja as fotos 10€\n-Chaves Kart €'), [])
})

test('detects bundle only with at least three priced lines', () => {
  assert.equal(isBundleAd('-A 1€\n-B 2€'), false)
  assert.equal(isBundleAd(sample), true)
})

test('matches a game name inside a bundle line', () => {
  assert.equal(matchesGame('Dead Space 2 Collector’s Edition', 'Dead Space 2'), true)
  assert.equal(matchesGame('Dead Space 2', 'Dead Space'), true)
  assert.equal(matchesGame('Dead Space', 'Dead Space (2008)'), true)
})
