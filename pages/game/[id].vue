<template>
  <div v-if="game">
    <div class="mb-4 flex gap-4">
      <img v-if="game.coverImage" :src="game.coverImage" class="h-32 w-24 rounded object-cover" />
      <div class="flex-1">
        <h1 class="text-xl font-bold">{{ game.name }}</h1>
        <p class="text-sm text-zinc-500">{{ game.platformName }}</p>
        <button @click="toggle" class="mt-3 rounded-md px-3 py-1.5 text-sm" :class="inWishlist ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white'">
          {{ inWishlist ? '★ In wishlist' : '+ Add to wishlist' }}
        </button>
      </div>
    </div>

    <h2 class="mb-2 text-sm font-semibold">Listings — cheapest first (OLX.pt)</h2>
    <div v-if="listingsPending" class="text-sm text-zinc-500">Loading listings…</div>
    <div v-else-if="!listings?.length" class="text-sm text-zinc-500">No listings matched for this Game yet. Try after cron or check the OLX link.</div>
    <ul v-else class="divide-y rounded-lg border bg-white">
      <li v-for="l in listings" :key="l.id" class="flex items-center gap-3 p-3">
        <img v-if="l.imageUrl" :src="l.imageUrl" class="h-12 w-12 rounded object-cover" />
        <div class="flex-1">
          <a :href="l.url" target="_blank" class="text-sm font-medium hover:underline">{{ l.title }}</a>
          <div class="text-xs text-zinc-500">{{ l.location }} · <span class="rounded bg-zinc-100 px-1.5 py-0.5">{{ l.condition || '—' }}</span></div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold">{{ Number(l.price).toFixed(2) }} {{ l.currency }}</div>
          <div class="text-xs text-zinc-400">{{ l.marketplace }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const { data: game } = await useFetch(`/api/games/${id}`)
const { data: listings, pending: listingsPending } = await useFetch(`/api/games/${id}/listings`)
const { isWishlisted, toggle: toggleStore } = useWishlist()
const inWishlist = computed(() => isWishlisted(id))
function toggle() { toggleStore(id) }
</script>
