// One-off discovery: resolves OLX video-game category ids and condition attribute codes.
// Prints JSON only; paste the result into server/utils/olxTaxonomy.ts.
import 'dotenv/config'
import { getOlxToken, getCategories, olxApiGet } from '../server/utils/olxApi.ts'

const GAME_CATEGORY = /videojogo|jogos?\b|gaming|consolas?/i

const { scope, expiresIn } = await getOlxToken()
console.error(`[auth] ok scope="${scope}" expires_in=${expiresIn}s`)

const roots = await getCategories()
const branches = roots.filter(c => GAME_CATEGORY.test(c.name))

async function subtree(category, depth = 0) {
  const node = { id: category.id, name: category.name, is_leaf: category.is_leaf, children: [] }
  if (category.is_leaf || depth >= 3) return node
  const children = await getCategories(category.id)
  for (const child of children) node.children.push(await subtree(child, depth + 1))
  return node
}

const tree = []
for (const branch of branches) tree.push(await subtree(branch))

async function attributes(leafId) {
  const json = await olxApiGet(`/categories/${leafId}/attributes`)
  const rows = json.data ?? json
  return (Array.isArray(rows) ? rows : []).map(a => ({ code: a.code, label: a.label, values: a.values }))
}

const leaves = []
const walk = nodes => nodes.forEach(n => (n.children.length ? walk(n.children) : leaves.push(n)))
walk(tree)

const conditionAttributes = {}
for (const leaf of leaves.slice(0, 12)) {
  const attrs = await attributes(leaf.id)
  const hit = attrs.filter(a => /estado|state|condi/i.test(`${a.code} ${a.label}`))
  if (hit.length) conditionAttributes[leaf.id] = hit
}

console.log(JSON.stringify({ tree, conditionAttributes }, null, 2))
