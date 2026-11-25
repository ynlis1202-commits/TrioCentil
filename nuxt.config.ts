export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt'
  ],

  build: {
    transpile: ['lucide-vue-next']
  },

  vite: {
    ssr: {
      noExternal: ['lucide-vue-next']
    }
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'id'
      },
      titleTemplate: '%s | Warung Makan TrioCentil',
      title: 'Warung Makan TrioCentil — Rasa Nikmat, Harga Bersahabat, Bikin Nagih!',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'Pesan Sate Ayam favoritmu secara online di Warung Makan TrioCentil. Sate ayam lezat, nasi hangat, lontong lembut, dan aneka minuman es segar.'
        },
        { name: 'theme-color', content: '#F472B6' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap'
        }
      ]
    }
  },

  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'triocentil-dev-secret-change-in-production-min-32-chars',
    databaseUrl: process.env.DATABASE_URL || '',
    storeWhatsappNumber: process.env.STORE_WHATSAPP_NUMBER || '6281234567890',
    qrisEnabled: process.env.QRIS_ENABLED === 'true',
    qrisMerchantName: process.env.QRIS_MERCHANT_NAME || 'WARUNG MAKAN TRIOCENTIL',
    qrisStaticPayload: process.env.QRIS_STATIC_PAYLOAD || '',
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Warung Makan TrioCentil',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'https://trio-centil.vercel.app',
      storeWhatsappNumber: process.env.STORE_WHATSAPP_NUMBER || '62882020898753',
      timezone: 'Asia/Jakarta',
      currency: 'IDR'
    }
  },

  nitro: {
    externals: {
      inline: ['lucide-vue-next']
    },
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      },
      '/uploads/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      }
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  }
})
