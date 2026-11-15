export type WishlistId = string // Game.id

const KEY = 'deal-hunter:wishlist'

export function useWishlist() {
  const ids = ref<WishlistId[]>([])

  function load() {
    if (process.client) {
      try { ids.value = JSON.parse(localStorage.getItem(KEY) || '[]') } catch { ids.value = [] }
    }
  }
  function save() {
    if (process.client) localStorage.setItem(KEY, JSON.stringify(ids.value))
  }
  function isWishlisted(gameId: string) { return ids.value.includes(gameId) }
  function add(gameId: string) {
    if (!isWishlisted(gameId)) { ids.value.push(gameId); save() }
  }
  function remove(gameId: string) {
    ids.value = ids.value.filter(id => id !== gameId); save()
  }
  function toggle(gameId: string) {
    if (isWishlisted(gameId)) remove(gameId); else add(gameId)
    return isWishlisted(gameId)
  }
  onMounted(load)
  return { ids, isWishlisted, add, remove, toggle, load }
}
