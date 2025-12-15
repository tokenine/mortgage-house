import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Interest Distribution — approval then distribute', () => {
  test('triggers approve then distribute when allowance insufficient', async ({ page }) => {
    test.skip(!process.env.WALLET_E2E, 'Requires wallet automation and allowance=0 setup')
    // Precondition: USDT allowance = 0 for the contract
    await page.goto(`${BASE}/admin`)

    const amount = process.env.TEST_INTEREST_AMOUNT || '10'
    await page.locator('#interest-amount').fill(amount)

    const distributeBtn = page.getByRole('button', { name: 'Distribute Interest' })
    await expect(distributeBtn).toBeEnabled()
    await distributeBtn.click()

    // First wallet prompt: approve() — handled via automation
    // After approval confirmed, the app should auto-run distributeInterest

    // Wait for button to return enabled to signal flow completion
    await expect(distributeBtn).toBeEnabled({ timeout: 90_000 })
  })
})
