import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Admin Access Control', () => {
  test('shows Access Denied when wallet not connected', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    await expect(page.getByText('Access Denied')).toBeVisible()
    await expect(page.getByText('Connected wallet')).toBeVisible()
  })

  test('issuer wallet sees admin controls (requires WALLET_E2E)', async ({ page }) => {
    test.skip(!process.env.WALLET_E2E, 'Requires wallet automation to test issuer access')
    // Precondition: wallet connected as issuer via automation
    await page.goto(`${BASE}/admin`)
    await expect(page.getByRole('heading', { name: 'Distribute Payments' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Bond Lifecycle Controls' })).toBeVisible()
  })
})
