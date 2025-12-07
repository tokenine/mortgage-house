// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-12-07',
  devtools: { enabled: true },

  // Auto-imports configuration
  imports: {
    dirs: ['composables/**', 'utils/**']
  },

  // CSS configuration
  css: ['~/assets/css/main.css'],

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    // Note: @web3modal/wagmi module configuration will be added when package is properly installed
  ],

  // Build configuration
  build: {
    transpile: ['@vueuse/core', '@wagmi/vue', '@wagmi/core', '@web3modal/wagmi']
  },

  // Runtime config
  runtimeConfig: {
    // Private keys (only available on server-side)
    walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID,

    // Public keys (exposed to client-side)
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      appName: 'Mortage House',
      appDescription: 'Fractional mortgage investment platform',
      mortgageContractAddress: process.env.MORTGAGE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      usdtTokenAddress: process.env.USDT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000'
    }
  },

  // Vite configuration
  vite: {
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true
      }
    },
    // Disable vite-plugin-checker to avoid vue-tsc issues
    plugins: process.env.NODE_ENV === 'development' ? [] : undefined,
    optimizeDeps: {
      include: ['@vueuse/core', '@wagmi/vue', '@wagmi/core', '@web3modal/wagmi', 'viem']
    },
    server: {
      fs: {
        strict: false
      }
  }  },

  typescript: {
    typeCheck: false, // Disable type checking during dev
    shim: false
  },

})
