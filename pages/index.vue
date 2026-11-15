<template>
  <div>
    <section class="py-12 sm:py-20">
      <h1 class="font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">Game deals, tracked hourly across OLX.pt</h1>
      <p class="mt-4 max-w-xl text-lg leading-normal text-body">Search the RAWG catalog and watch the games you care about. Listings from Portuguese marketplaces, cheapest first — refreshed for watched titles every hour.</p>
      <form class="mt-8 flex flex-col gap-3 sm:flex-row" @submit.prevent="search">
        <input v-model="q" placeholder="Search games" class="h-12 w-full max-w-[560px] rounded border border-ash px-4 text-base focus:border-2 focus:border-primary focus:outline-none" />
        <select v-model="platformSlug" class="h-12 rounded border border-ash px-3 text-base">
          <option value="">All platforms</option>
          <option v-for="p in platforms" :key="p.slug" :value="p.slug">{{ p.name }}</option>
        </select>
        <button type="submit" class="h-12 rounded-full bg-primary px-7 text-lg font-semibold tracking-wide text-white hover:bg-primary-pressed">Search</button>
      </form>
    </section>

    <section v-if="searched" class="pb-16 sm:pb-24">
      <div class="mb-6 flex items-baseline justify-between">
        <h2 class="font-display text-3xl font-light">{{ q ? `Results — ${q}` : 'Results' }}</h2>
        <span v-if="games?.length" class="text-sm text-mute tabular-nums">{{ games.length }} games{{ platformName ? ` · ${platformName}` : '' }}</span>
      </div>
      <div v-if="pending" class="text-sm text-mute">Searching</div>
      <div v-else-if="games?.length === 0" class="text-sm text-mute">No games found.</div>
      <div v-else class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        <NuxtLink v-for="g in games" :key="g.id" :to="`/game/${g.id}`" class="overflow-hidden rounded-lg bg-surface-card transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.16)]">
          <div v-if="g.coverImage" class="aspect-[3/4] w-full overflow-hidden">
            <img :src="g.coverImage" :alt="g.name" class="h-full w-full object-cover" @error="hideBrokenImage" />
          </div>
          <div class="p-4">
            <div class="line-clamp-2 text-base font-medium">{{ g.name }}</div>
            <div class="mt-1 text-sm text-mute">{{ g.platformName }}</div>
          </div>
        </NuxtLink>
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
onMounted(search)
</script>
