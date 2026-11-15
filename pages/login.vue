<template>
  <div class="mx-auto max-w-sm py-12 text-center">
    <p class="text-sm text-zinc-500">Login removed — wishlist is local. <NuxtLink to="/wishlist" class="underline">Go to wishlist</NuxtLink></p>
  </div>
</template>
<script setup lang="ts">
await navigateTo('/wishlist')
</script>
