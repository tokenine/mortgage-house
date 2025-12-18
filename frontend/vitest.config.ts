import { defineConfig } from 'vitest'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Add setupFiles if you later include Testing Library DOM matchers
    // setupFiles: ['./__tests__/setup.ts']
  },
})
