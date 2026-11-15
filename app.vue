<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900">
    <header class="sticky top-0 z-10 border-b bg-white">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="text-lg font-bold tracking-tight">Deal Hunter</NuxtLink>
        <div class="flex items-center gap-3">
          <NuxtLink to="/wishlist" class="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50">
            Wishlist <span v-if="wishlistCount" class="ml-1 rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-white">{{ wishlistCount }}</span>
          </NuxtLink>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const { ids } = useWishlist()
const wishlistCount = computed(() => ids.value.length)
</script>
