<template>
  <div>
    <section class="grid grid-cols-1 items-center gap-8 py-12 sm:py-20 md:grid-cols-5 md:gap-16 lg:py-24">
      <div class="md:col-span-2">
        <h1 class="font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">Game deals, tracked hourly across OLX.pt</h1>
        <p class="mt-4 max-w-md text-lg leading-normal text-body">Search the RAWG catalog and watch the games you care about. Listings from Portuguese marketplaces, cheapest first — refreshed for watched titles every hour.</p>
        <a href="#search" class="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-7 text-lg font-semibold tracking-wide text-white transition-colors hover:bg-primary-pressed">Search catalog</a>
      </div>
      <div class="grid grid-cols-2 gap-4 md:col-span-3">
        <NuxtLink v-for="g in fanGames" :key="g.id" :to="`/game/${g.id}`" class="group">
          <div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-card">
            <img v-if="g.coverImage" :src="g.coverImage" :alt="g.name" class="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-90" @error="hideBrokenImage" />
            <span class="absolute bottom-0 left-0 p-4 font-display text-xl font-light leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{{ g.name }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section id="search" class="flex flex-col gap-3 border-t border-hairline py-8 sm:flex-row sm:items-center">
      <input v-model="q" @keyup.enter="search" placeholder="Search games" class="h-12 w-full max-w-[560px] rounded border border-ash px-4 text-base focus:border-2 focus:border-primary focus:outline-none" />
      <select v-model="platformSlug" class="h-12 rounded border border-ash px-3 text-base">
        <option value="">All platforms</option>
        <option v-for="p in platforms" :key="p.slug" :value="p.slug">{{ p.name }}</option>
      </select>
      <button @click="search" class="h-12 rounded-full bg-primary px-7 text-lg font-semibold tracking-wide text-white transition-colors hover:bg-primary-pressed">Search</button>
    </section>

    <section v-if="searched" class="full-bleed mt-8 bg-surface-card py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-8">
        <div class="mb-6 flex items-baseline justify-between">
          <h2 class="font-display text-3xl font-light">{{ q ? `Results — ${q}` : 'Results' }}</h2>
          <span v-if="games?.length" class="text-sm text-mute tabular-nums">{{ games.length }} games{{ platformName ? ` · ${platformName}` : '' }}</span>
        </div>
        <div v-if="pending" class="text-sm text-mute">Searching</div>
        <div v-else-if="games?.length === 0" class="text-sm text-mute">No games found.</div>
        <div v-else class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          <NuxtLink v-for="g in games" :key="g.id" :to="`/game/${g.id}`" class="overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)]">
            <div v-if="g.coverImage" class="aspect-[3/4] w-full overflow-hidden">
              <img :src="g.coverImage" :alt="g.name" class="h-full w-full object-cover" @error="hideBrokenImage" />
            </div>
            <div class="p-4">
              <div class="line-clamp-2 text-base font-medium">{{ g.name }}</div>
              <div class="mt-1 text-sm text-mute">{{ g.platformName }}</div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section v-if="wishlistGames.length" class="py-16">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="font-display text-3xl font-light">Watchlist</h2>
        <span class="text-sm text-mute tabular-nums">{{ wishlistGames.length }} titles · stored locally</span>
      </div>
      <div class="divide-y divide-hairline">
        <div v-for="g in wishlistGames" :key="g.id" class="flex items-center gap-4 py-4">
          <div class="h-16 w-12 shrink-0 overflow-hidden rounded bg-surface-card">
            <img v-if="g.coverImage" :src="g.coverImage" :alt="g.name" class="h-16 w-12 object-cover" @error="hideBrokenImage" />
          </div>
          <div class="min-w-0 flex-1">
            <NuxtLink :to="`/game/${g.id}`" class="text-base font-medium hover:text-primary">{{ g.name }}</NuxtLink>
            <div class="mt-0.5 text-sm text-mute">{{ g.platformName }}</div>
          </div>
          <button @click="removeWishlistGame(g.id)" class="shrink-0 text-sm font-medium text-mute transition-colors hover:text-ink">Remove</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const hideBrokenImage = useImgFallback()
const q = ref('')
const platformSlug = ref('')
const searched = ref(false)
const { data: platforms } = await useFetch('/api/platforms')
const pending = ref(false)
const games = ref<any[]>([])
const fanGames = ref<any[]>([])
const { games: wishlistGames, remove: removeWishlistGame } = useWishlistGames()

const platformName = computed(() =>
  platforms.value?.find(p => p.slug === platformSlug.value)?.name ?? ''
)

async function search() {
  searched.value = true
  pending.value = true
  try {
    games.value = await $fetch('/api/games', { query: { q: q.value, platform: platformSlug.value } })
  } finally { pending.value = false }
}

// hero fan: first catalog hits, fetched once so the hero stays stable across searches
onMounted(async () => {
  try { fanGames.value = (await $fetch<any[]>('/api/games', { query: {} })).slice(0, 4) } catch {}
})
</script>

<style scoped>
/* full-bleed band inside the centered main container */
.full-bleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}
</style>
