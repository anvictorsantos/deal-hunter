export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'], // supabase removed — wishlist is localStorage for now
  runtimeConfig: {
    rawgApiKey: process.env.RAWG_API_KEY,
    olxClientId: process.env.OLX_CLIENT_ID,
    olxClientSecret: process.env.OLX_CLIENT_SECRET,
    cronSecret: process.env.CRON_SECRET,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
    }
  },
  postcss: {
    plugins: {
      // module re-adds this key; false disables it — ESM import of the dir-shaped subpath fails (ERR_UNSUPPORTED_DIR_IMPORT) and project CSS uses no nesting
      'tailwindcss/nesting': false,
    },
  },
  app: {
    head: {
      title: 'Deal Hunter',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Search the RAWG catalog and track game deals across OLX.pt — cheapest listings first, refreshed hourly for watched titles.' },
        { property: 'og:title', content: 'Deal Hunter — game deals across OLX.pt' },
        { property: 'og:description', content: 'Search the RAWG catalog and track game deals across OLX.pt — cheapest listings first, refreshed hourly for watched titles.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/logo.png' },
        { name: 'theme-color', content: '#0070d1' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icon-180.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300&family=Inter:wght@400;500;600&display=swap' },
      ],
    },
  },
})
