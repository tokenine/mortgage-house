import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom', // Use happy-dom instead of jsdom
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './')
    }
  },
  optimizeDeps: {
    include: ['vue', '@vue/test-utils']
  }
})