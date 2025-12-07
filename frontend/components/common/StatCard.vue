<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          <slot name="label" />
        </p>
        <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          <slot name="value" />
        </p>
      </div>
      <div class="flex-shrink-0">
        <slot name="icon" />
      </div>
    </div>
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Common stat card component
</script>
