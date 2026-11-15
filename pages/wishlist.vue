<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">My wishlist <span class="text-sm font-normal text-zinc-500">(local)</span></h1>
    <div v-if="pending" class="text-sm text-zinc-500">Loading…</div>
    <div v-else-if="!games.length" class="text-sm text-zinc-500">Empty — add games from search. Stored in localStorage.</div>
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="g in games" :key="g.id" class="overflow-hidden rounded-lg border bg-white">
        <NuxtLink :to="`/game/${g.id}`">
          <img v-if="g.coverImage" :src="g.coverImage" class="aspect-[3/4] w-full object-cover" />
          <div class="p-3">
            <div class="text-sm font-medium">{{ g.name }}</div>
            <div class="text-xs text-zinc-500">{{ g.platformName }}</div>
          </div>
        </NuxtLink>
        <button @click="remove(g.id)" class="w-full border-t py-1.5 text-xs text-zinc-500 hover:bg-zinc-50">Remove</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { ids, remove } = useWishlist()
const games = ref<any[]>([])
const pending = ref(true)

async function load() {
  pending.value = true
  if (!ids.value.length) { games.value = []; pending.value = false; return }
  // fetch each game in parallel — ponytail: N+1 but N = wishlist size (small)
  const res = await Promise.all(ids.value.map(id => $fetch(`/api/games/${id}`).catch(() => null)))
  games.value = res.filter(Boolean)
  pending.value = false
}
watch(ids, load, { deep: true })
onMounted(load)
</script>
