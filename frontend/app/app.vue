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
      <NuxtPage />
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


