<template>
  <div class="portfolio-page">
    <PortfolioDashboard />
  </div>
</template>

<script setup lang="ts">
import PortfolioDashboard from '~/components/portfolio/PortfolioDashboard.vue'

// SEO
definePageMeta({
  title: 'Investment Portfolio - Mortgage House',
  description: 'View and manage your mortgage investment portfolio, track earnings, and withdraw funds.',
  keywords: 'portfolio, investments, earnings, withdrawals, mortgage, real estate'
})

// Page setup
useHead({
  title: 'Investment Portfolio - Mortgage House',
  meta: [
    { name: 'description', content: 'View and manage your mortgage investment portfolio, track earnings, and withdraw funds.' },
    { name: 'keywords', content: 'portfolio, investments, earnings, withdrawals, mortgage, real estate' }
  ]
})
</script>

<style scoped>
.portfolio-page {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}
</style>