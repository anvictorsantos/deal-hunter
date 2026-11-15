<template>
  <div v-if="game">
    <section class="grid grid-cols-1 items-center gap-6 py-12 md:grid-cols-[280px,1fr] md:gap-12 md:py-20">
      <div v-if="game.coverImage" class="aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-lg bg-surface-card shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
        <img :src="game.coverImage" :alt="game.name" class="h-full w-full object-cover" @error="hideBrokenImage" />
      </div>
      <div>
        <h1 class="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">{{ game.name }}</h1>
        <p class="mt-2 text-lg text-body">{{ game.platformName }}</p>
        <div class="mt-8 flex items-center gap-4">
          <button
            @click="toggle"
            class="h-12 rounded-full px-7 text-lg font-semibold tracking-wide transition-colors"
            :class="inWishlist ? 'bg-surface-card text-ink' : 'bg-primary text-white hover:bg-primary-pressed'"
          >
            {{ inWishlist ? 'In watchlist' : 'Add to watchlist' }}
          </button>
        </div>
      </div>
    </section>

    <section class="pb-16 sm:pb-24">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="font-display text-3xl font-light">Listings — cheapest first</h2>
        <span class="text-sm text-mute">OLX.pt</span>
      </div>
      <div v-if="listingsPending" class="py-5 text-sm text-mute">Loading listings</div>
      <div v-else-if="!listings?.length" class="py-5 text-sm text-mute">No listings matched for this Game yet. Try after cron or check the OLX link.</div>
      <div v-else class="divide-y divide-hairline">
        <div v-for="(l, i) in listings" :key="l.id" class="flex items-center gap-4 py-5">
          <div class="w-10 shrink-0 font-display text-3xl font-light" :class="i === 0 ? 'text-primary' : 'text-ash'">{{ i + 1 }}</div>
          <div class="h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-card">
            <img v-if="l.imageUrl" :src="l.imageUrl" :alt="l.title" class="h-12 w-12 object-cover" @error="hideBrokenImage" />
          </div>
          <div class="min-w-0 flex-1">
            <a :href="l.url" target="_blank" class="font-medium hover:text-primary">{{ l.title }}</a>
            <div class="mt-0.5 text-sm text-mute">
              {{ l.location }}
              <span class="ml-2 inline-block rounded-full bg-surface-card px-2.5 py-0.5 text-xs font-medium text-mute">{{ l.condition || '—' }}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-medium text-commerce tabular-nums">{{ Number(l.price).toFixed(2) }} {{ l.currency }}</div>
            <div class="mt-0.5 text-sm text-mute">{{ l.marketplace }}</div>
          </div>
        </div>
      </div>
      <p v-if="listings?.length" class="mt-6 text-sm text-mute">Listings fetch live on first visit, then hourly for watched titles. Prices link to the seller on OLX.pt.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
const hideBrokenImage = useImgFallback()
const route = useRoute()
const id = route.params.id as string
const { data: game } = await useFetch(`/api/games/${id}`)
const { data: listings, pending: listingsPending } = await useFetch(`/api/games/${id}/listings`)
const { isWishlisted, toggle: toggleStore } = useWishlist()
const inWishlist = computed(() => isWishlisted(id))
function toggle() { toggleStore(id) }
</script>
