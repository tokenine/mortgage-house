import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Principal Withdrawal', () => {
  test('enabled only when funding active and prevents duplicate clicks', async ({ page }) => {
    test.skip(!process.env.WALLET_E2E, 'Requires wallet automation and fundingActive=true')
    // Precondition: isFundingActive = true, funded amount > 0
    await page.goto(`${BASE}/admin`)

    const withdrawBtn = page.getByRole('button', { name: 'Close Funding & Release Principal' })
    await expect(withdrawBtn).toBeEnabled()

    // Rapid clicks should not create multiple submissions; UI disables during processing
    await withdrawBtn.click()
    await expect(withdrawBtn).toBeDisabled()

    // Wait for flow to complete (funding becomes closed)
    await expect(withdrawBtn).toBeHidden({ timeout: 90_000 })
  })
})
