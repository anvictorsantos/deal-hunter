<template>
  <div class="min-h-screen bg-white text-ink">
    <header class="border-b border-hairline">
      <nav class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <NuxtLink to="/" class="font-display text-[22px] font-light">Deal<span class="text-primary">Hunter</span></NuxtLink>
        <div class="flex items-center gap-8 text-sm font-medium">
          <NuxtLink to="/" class="text-mute hover:text-ink">Search</NuxtLink>
          <NuxtLink to="/wishlist" class="text-mute hover:text-ink">
            Watchlist <span v-if="wishlistCount" class="text-primary tabular-nums">{{ wishlistCount }}</span>
          </NuxtLink>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-7xl px-4 sm:px-8">
      <NuxtPage />
    </main>
    <footer class="border-t border-hairline">
      <div class="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div class="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <span class="font-display text-xl font-light">Deal<span class="text-primary">Hunter</span></span>
          <div class="flex gap-8 text-sm">
            <a href="https://rawg.com" class="text-link">RAWG</a>
            <a href="https://www.olx.pt" class="text-link">OLX.pt</a>
          </div>
        </div>
        <p class="mt-6 text-xs text-mute">Catalog data from RAWG. Listings scraped from OLX.pt. Not affiliated with either.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { ids } = useWishlist()
const wishlistCount = computed(() => ids.value.length)
</script>
