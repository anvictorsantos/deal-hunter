<template>
  <div class="py-12 sm:py-20">
    <h1 class="font-display text-4xl font-light tracking-tight sm:text-5xl">Watchlist</h1>
    <p v-if="games.length" class="mt-2 text-lg text-body tabular-nums">{{ games.length }} titles · stored locally · refreshed hourly</p>

    <div v-if="pending" class="mt-12 text-sm text-mute">Loading</div>

    <div v-else-if="!games.length" class="mt-12 max-w-xl">
      <p class="text-lg leading-normal text-body">Nothing tracked yet. Search the catalog and add the games you want to watch.</p>
      <NuxtLink to="/" class="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-7 text-lg font-semibold tracking-wide text-white hover:bg-primary-pressed">Search catalog</NuxtLink>
    </div>

    <div v-else>
      <div class="mb-2 mt-12 flex items-baseline justify-between">
        <h2 class="font-display text-3xl font-light">Tracked games</h2>
        <span class="text-sm text-mute">Listings fetch hourly for these titles</span>
      </div>
      <div class="divide-y divide-hairline">
        <div v-for="g in games" :key="g.id" class="flex items-center gap-4 py-5">
          <div class="h-[72px] w-14 shrink-0 overflow-hidden rounded bg-surface-card">
            <img v-if="g.coverImage" :src="g.coverImage" :alt="g.name" class="h-[72px] w-14 object-cover" @error="hideBrokenImage" />
          </div>
          <div class="min-w-0 flex-1">
            <NuxtLink :to="`/game/${g.id}`" class="text-lg font-medium hover:text-primary">{{ g.name }}</NuxtLink>
            <div class="mt-1 text-sm text-mute">{{ g.platformName }}</div>
          </div>
          <NuxtLink :to="`/game/${g.id}`" class="shrink-0 text-sm font-medium text-link hover:underline">Listings</NuxtLink>
          <button @click="remove(g.id)" class="shrink-0 text-sm font-medium text-mute hover:text-ink">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const hideBrokenImage = useImgFallback()
const { ids, remove } = useWishlist()
const games = ref<any[]>([])
const pending = ref(true)

async function load() {
  pending.value = true
  if (!ids.value.length) { games.value = []; pending.value = false; return }
  const res = await Promise.all(ids.value.map(id => $fetch(`/api/games/${id}`).catch(() => null)))
  games.value = res.filter(Boolean)
  pending.value = false
}
watch(ids, load, { deep: true })
onMounted(load)
</script>
