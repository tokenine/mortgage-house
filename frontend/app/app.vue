<template>
  <div class="min-h-screen bg-gray-50">
    <NuxtRouteAnnouncer />

    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">Mortage House</h1>
            <span class="ml-2 text-sm text-gray-500">Fractional Mortgage Investment</span>
          </div>

          <!-- Wallet Components -->
          <div class="flex items-center gap-4">
            <NetworkDisplay />
            <WalletButton />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Mortage House
        </h2>
        <p class="text-lg text-gray-600 mb-8">
          Invest in fractional mortgages on the blockchain
        </p>

        <!-- Status Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Secure Investment</h3>
            <p class="text-gray-600">
              Invest in mortgage-backed assets with smart contract security
            </p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Fractional Ownership</h3>
            <p class="text-gray-600">
              Own fractions of premium mortgage investments with as little as 0.01 ETH
            </p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Passive Income</h3>
            <p class="text-gray-600">
              Earn regular returns from mortgage interest payments
            </p>
          </div>
        </div>

        <!-- CTA Section -->
        <div v-if="!isConnected" class="mt-12">
          <div class="bg-blue-50 rounded-lg p-8">
            <h3 class="text-2xl font-bold text-blue-900 mb-4">
              Get Started Today
            </h3>
            <p class="text-blue-800 mb-6">
              Connect your wallet to start investing in fractional mortgages
            </p>
            <WalletButton />
          </div>
        </div>

        <!-- Dashboard Preview for Connected Users -->
        <div v-else class="mt-12">
          <div class="bg-green-50 rounded-lg p-8">
            <h3 class="text-2xl font-bold text-green-900 mb-4">
              Ready to Invest
            </h3>
            <p class="text-green-800 mb-6">
              Your wallet is connected and ready to invest in mortgage opportunities
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div class="bg-white rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Available Features</h4>
                <ul class="space-y-1 text-sm text-gray-600">
                  <li>• Browse mortgage investment opportunities</li>
                  <li>• View detailed investment analytics</li>
                  <li>• Track your investment portfolio</li>
                  <li>• Receive regular interest payments</li>
                </ul>
              </div>
              <div class="bg-white rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Network Status</h4>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Connected:</span>
                    <span class="text-green-600 font-medium">Yes</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Network:</span>
                    <span :class="isSupportedChain ? 'text-green-600' : 'text-yellow-600'">
                      {{ currentChain?.name || 'Unknown' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Balance:</span>
                    <span class="text-gray-900 font-medium">{{ formattedBalance }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-500">
          <p>&copy; 2024 Mortage House. All rights reserved.</p>
          <p class="mt-2 text-sm">
            Built with Nuxt 3, Viem, and modern Web3 technologies
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useWallet } from '~/composables/useWallet'

// Composables
const {
  isConnected,
  currentChain,
  isSupportedChain,
  formattedBalance
} = useWallet()

// Set page metadata
useHead({
  title: 'Mortage House - Fractional Mortgage Investment',
  meta: [
    {
      name: 'description',
      content: 'Invest in fractional mortgages on the blockchain with Mortage House platform'
    }
  ]
})
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200 text-left;
}
</style>
