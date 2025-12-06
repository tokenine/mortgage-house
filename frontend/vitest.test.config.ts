import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    configFiles: false, // Don't auto-discover tsconfig files
    transformMode: {
      web: [/\.[jt]sx?$/],
      ssr: [/\.vue$/]
    }
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './')
    }
  },
  define: {
    // Mock Nuxt auto-imports and globals
    global: 'globalThis'
  },
  // Override the TypeScript config detection
  server: {
    fs: {
      allow: ['..']
    }
  }
})