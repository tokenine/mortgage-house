import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Interest Distribution — sufficient allowance', () => {
  test('distributes interest in a single tx when allowance sufficient', async ({ page }) => {
    test.skip(!process.env.WALLET_E2E, 'Requires wallet automation and seeded allowance')
    // Precondition: USDT allowance >= entered interest amount
    await page.goto(`${BASE}/admin`)

    // Fill interest amount
    const amount = process.env.TEST_INTEREST_AMOUNT || '10'
    await page.locator('#interest-amount').fill(amount)

    // Click Distribute Interest
    const distributeBtn = page.getByRole('button', { name: 'Distribute Interest' })
    await expect(distributeBtn).toBeEnabled()
    await distributeBtn.click()

    // Expect processing state
    await expect(distributeBtn).toBeDisabled()

    // Optional: observe toast messages if app exposes them as role/aria
    // await expect(page.getByText('Distributing interest...')).toBeVisible()

    // Wait for success state indicators to clear and button re-enable
    await expect(distributeBtn).toBeEnabled({ timeout: 60_000 })

    // UI should reflect updated state eventually (event-driven refresh)
    // This is app-specific; we minimally assert page is still responsive
    await expect(page).toHaveURL(/\/admin/)
  })
})
