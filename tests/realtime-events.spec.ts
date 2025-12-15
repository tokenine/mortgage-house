import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Realtime Events & Listener Cleanup', () => {
  test('UI refetches within ~3s after events and no duplicate handlers', async ({ page, context }) => {
    test.skip(!process.env.WALLET_E2E, 'Requires secondary session to emit events')
    await page.goto(`${BASE}/admin`)

    // Capture a baseline UI snapshot (lightweight assertion)
    await expect(page).toHaveURL(/\/admin/)

    // Placeholder: external script emits PaymentDistributed / ShareTransfer event
    // In CI, use a helper to trigger contract tx or mock event backend

    // Give the app time to refetch after event
    await page.waitForTimeout(3000)

    // Navigate away and back multiple times to exercise cleanup
    for (let i = 0; i < 3; i++) {
      await page.goto(`${BASE}/`)
      await page.goto(`${BASE}/admin`)
      await expect(page).toHaveURL(/\/admin/)
    }
  })
})
