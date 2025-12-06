/**
 * Web3 Plugin Configuration
 * Sets up wagmi, viem, and Web3Modal for the application
 */

import { createConfig, http } from 'viem'
import { mainnet, polygon, optimism } from 'viem/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { wagmiPlugin } from '@wagmi/vue'
import { defaultWagmiConfig } from '@web3modal/wagmi/react'

// Project configuration
const projectId = process.env.NUXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id'

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, optimism],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: 'Mortage House',
        description: 'Fractional mortgage investment platform',
        url: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
        icons: ['https://your-app-icon.png']
      }
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http()
  }
})

// Create Web3Modal config
export const web3ModalConfig = defaultWagmiConfig({
  chains: [mainnet, polygon, optimism],
  projectId,
  enableEmail: false,
  enableSocials: false,
  features: {
    analytics: false,
    email: false,
    socials: false,
    onramp: true // Enable onramp for buying crypto
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': '9999'
  }
})

// Nuxt plugin
export default defineNuxtPlugin((nuxtApp) => {
  // Add wagmi plugin to Vue app
  nuxtApp.vueApp.use(wagmiPlugin(wagmiConfig))

  // Provide configurations to app
  nuxtApp.provide('wagmiConfig', wagmiConfig)
  nuxtApp.provide('web3ModalConfig', web3ModalConfig)
})