export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'], // supabase removed — wishlist is localStorage for now
  runtimeConfig: {
    rawgApiKey: process.env.RAWG_API_KEY,
    olxClientId: process.env.OLX_CLIENT_ID,
    olxClientSecret: process.env.OLX_CLIENT_SECRET,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
    }
  }
})
