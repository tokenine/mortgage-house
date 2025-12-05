// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
    shim: false
  },

  // CSS configuration
  css: ['~/assets/css/main.css'],

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    // Note: @web3modal/wagmi module configuration will be added when package is properly installed
  ],

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
    define: {
      global: 'globalThis'
    }
  }
})
