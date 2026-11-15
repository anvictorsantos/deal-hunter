<template>
  <div>
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="flex-1">
        <label class="text-sm font-medium">Search catalog (RAWG)</label>
        <input v-model="q" @keyup.enter="search" placeholder="e.g. zelda" class="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <select v-model="platformSlug" class="rounded-md border px-3 py-2 text-sm sm:w-48">
        <option value="">All platforms</option>
        <option v-for="p in platforms" :key="p.slug" :value="p.slug">{{ p.name }}</option>
      </select>
      <button @click="search" class="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">Search</button>
    </div>

    <div v-if="pending" class="text-sm text-zinc-500">Searching…</div>
    <div v-else-if="games?.length === 0" class="text-sm text-zinc-500">No games found.</div>
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <NuxtLink v-for="g in games" :key="g.id" :to="`/game/${g.id}`" class="overflow-hidden rounded-lg border bg-white hover:shadow-sm">
        <img v-if="g.coverImage" :src="g.coverImage" :alt="g.name" class="aspect-[3/4] w-full object-cover" />
        <div class="p-3">
          <div class="line-clamp-2 text-sm font-medium">{{ g.name }}</div>
          <div class="text-xs text-zinc-500">{{ g.platformName }}</div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const q = ref('')
const platformSlug = ref('')
const { data: platforms } = await useFetch('/api/platforms')
const pending = ref(false)
const games = ref<any[]>([])

async function search() {
  pending.value = true
  try {
    games.value = await $fetch('/api/games', { query: { q: q.value, platform: platformSlug.value } })
  } finally { pending.value = false }
}
onMounted(search)
</script>
