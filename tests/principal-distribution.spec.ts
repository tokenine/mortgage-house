import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Principal Repayment Distribution', () => {
  test('approval then distribute when allowance insufficient', async ({ page }) => {
    test.skip(!process.env.WALLET_E2E, 'Requires wallet automation and allowance control')
    // Precondition: USDT allowance = 0
    await page.goto(`${BASE}/admin`)

    const amount = process.env.TEST_PRINCIPAL_AMOUNT || '25'
    await page.locator('#principal-amount').fill(amount)

    const distributeBtn = page.getByRole('button', { name: 'Distribute Principal' })
    await expect(distributeBtn).toBeEnabled()
    await distributeBtn.click()

    // Expect approve then distributePrincipalRepayment sequence
    await expect(distributeBtn).toBeDisabled()
    await expect(distributeBtn).toBeEnabled({ timeout: 90_000 })
  })
})
