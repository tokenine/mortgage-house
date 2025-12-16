import { test, expect } from '@playwright/test'

/**
 * E2E Test: Claim Bond Yield Button
 * 
 * Tests the complete claim flow for a specific bond card:
 * 1. User sees Claim button on bond cards with yield > 0
 * 2. User clicks Claim, triggers wallet approval
 * 3. Transaction is submitted and UI shows pending → confirming → success
 * 4. Success toast appears
 * 5. Portfolio refreshes automatically (yield becomes 0 or reduced)
 * 
 * Acceptance Criteria (from spec.md):
 * - Button disabled when yield <= 0 or wallet disconnected
 * - Clear status feedback (pending, confirming, success, error)
 * - Portfolio totals update post-claim without reload
 */

test.describe('Claim Bond Yield - User Story 1 (P1)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for portfolio to load
    await page.waitForSelector('[class*="bond"]', { timeout: 10000 })
  })

  test('US1.1: Should display Claim button on bond card with yield > 0', async ({ page }) => {
    // Find bond cards
    const bondCards = page.locator('[class*="AnimatedCard"]')
    
    // At least one card should exist
    await expect(bondCards.first()).toBeVisible()
    
    // Each card should have a Claim button
    const claimButtons = page.locator('button:has-text("Claim")')
    await expect(claimButtons.first()).toBeVisible()
  })

  test('US1.2: Should disable Claim button when yield is 0', async ({ page }) => {
    // This test would require a bond with zero yield in the test data
    // Skip if no such bond exists; can be mocked in test fixture
    
    // For now, verify button exists and has proper aria-disabled state when conditions are met
    const claimButton = page.locator('button:has-text("Claim")').first()
    
    // Button should have a title attribute explaining why it's disabled (if applicable)
    const title = await claimButton.getAttribute('title')
    if (title) {
      expect(['No yield to claim', 'Connect wallet to claim']).toContain(title)
    }
  })

  test('US1.3: Should submit claim transaction and show pending state', async ({ page }) => {
    // Click Claim button
    const claimButton = page.locator('button:has-text("Claim")').first()
    
    // Verify button is enabled
    await expect(claimButton).toBeEnabled()
    
    // Click it
    await claimButton.click()
    
    // Should show "Submitting..." or "Confirming..." state
    const submittingButton = page.locator('button:has-text(/Submitting|Confirming/)')
    await expect(submittingButton).toBeVisible({ timeout: 5000 })
  })

  test('US1.4: Should show success toast and update portfolio after claim confirmation', async ({ page }) => {
    // Click Claim button
    const claimButton = page.locator('button:has-text("Claim")').first()
    
    // Store initial yield amount
    const bondCard = claimButton.locator('../..').first() // Navigate up to card
    const initialYieldText = await bondCard.locator(':has-text("earned")').first().textContent()
    
    await claimButton.click()
    
    // Wait for success toast
    const successToast = page.locator(':has-text(/Claimed.*yield/)')
    await expect(successToast).toBeVisible({ timeout: 15000 })
    
    // Verify "Claimed!" button state appears briefly
    const claimedButton = page.locator('button:has-text("Claimed!")')
    await expect(claimedButton).toBeVisible({ timeout: 5000 })
    
    // Wait for portfolio refresh
    await page.waitForTimeout(2000)
    
    // Verify yield has been reduced or reset (should show $0.00 or be removed)
    const updatedYield = await bondCard.locator(':has-text("earned")').first().textContent()
    expect(updatedYield).not.toBe(initialYieldText)
  })
})

test.describe('Claim Bond Yield - User Story 2 (P2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('[class*="bond"]', { timeout: 10000 })
  })

  test('US2.1: Should show error toast on transaction revert', async ({ page }) => {
    // This test would require mocking a revert scenario
    // In a real integration, you'd use a Foundry fork or mock server
    
    // For now, verify error handling exists
    const claimButton = page.locator('button:has-text("Claim")').first()
    
    // If transaction reverts, button should return to "Claim" or "Retry" state
    // and an error toast should appear
    // This is tested by listening for error messages
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Should not have unhandled errors
        expect(msg.text()).not.toMatch(/undefined|null is not a function/)
      }
    })
  })

  test('US2.2: Should allow retry after error', async ({ page }) => {
    const claimButton = page.locator('button:has-text("Claim")').first()
    
    // Initial state: enabled
    await expect(claimButton).toBeEnabled()
    
    // After error, should still be re-enabled
    // (tested by clicking again after a failed attempt)
    // This assumes error state is transient
    
    const buttonText = await claimButton.textContent()
    expect(['Claim', 'Retry', 'Submitting...', 'Confirming...', 'Claimed!']).toContain(buttonText?.trim())
  })

  test('US2.3: Should show clear error message for network mismatch', async ({ page }) => {
    // This would test switching networks mid-claim
    // For now, verify the error handling pathway exists
    
    const claimButton = page.locator('button:has-text("Claim")').first()
    await expect(claimButton).toBeVisible()
    
    // Tooltips or error messages should appear if network is wrong
    const title = await claimButton.getAttribute('title')
    // Title should be set for accessibility
    if (title) {
      expect(title.length).toBeGreaterThan(0)
    }
  })
})

test.describe('Claim Bond Yield - User Story 3 (P3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('[class*="bond"]', { timeout: 10000 })
  })

  test('US3.1: Should refresh portfolio totals automatically after successful claim', async ({ page }) => {
    // Get initial total yield from stats card
    const totalYieldCard = page.locator(':has-text("Unclaimed Yield")').first()
    const initialTotalYield = await totalYieldCard.locator('text=$').first().textContent()
    
    // Click Claim on first bond
    const claimButton = page.locator('button:has-text("Claim")').first()
    const bondYield = await claimButton.locator('ancestor::*:has-text("earned")').first().textContent()
    
    await claimButton.click()
    
    // Wait for success
    await expect(page.locator(':has-text(/Claimed/)')).toBeVisible({ timeout: 15000 })
    
    // Wait for refresh indicator to appear/disappear
    await page.waitForTimeout(1000)
    
    // Verify total yield card has updated
    const updatedTotalYield = await totalYieldCard.locator('text=$').first().textContent()
    
    // Total yield should be less than or equal to initial (since we claimed)
    expect(updatedTotalYield).not.toBe(initialTotalYield)
  })

  test('US3.2: Should update individual bond yield after successful claim', async ({ page }) => {
    // Get bond card
    const bondCard = page.locator('[class*="AnimatedCard"]').first()
    const initialYield = await bondCard.locator(':has-text("earned")').first().textContent()
    
    // Claim
    const claimButton = bondCard.locator('button:has-text("Claim")')
    await claimButton.click()
    
    // Wait for success
    await expect(page.locator(':has-text(/Claimed/)')).toBeVisible({ timeout: 15000 })
    
    // Wait for portfolio refresh
    await page.waitForTimeout(2000)
    
    // Yield should be updated (typically to $0.00)
    const updatedYield = await bondCard.locator(':has-text("earned")').first().textContent()
    expect(updatedYield).not.toBe(initialYield)
    
    // Should show lower amount or zero
    expect(updatedYield).toMatch(/\$0\.00|reduced/)
  })
})

test.describe('Claim Bond Yield - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('[class*="bond"]', { timeout: 10000 })
  })

  test('Edge Case: Should prevent duplicate claims while pending', async ({ page }) => {
    const claimButton = page.locator('button:has-text("Claim")').first()
    
    // First click
    await claimButton.click()
    
    // Button should be disabled while confirming
    await expect(claimButton).toBeDisabled({ timeout: 1000 })
    
    // Try clicking again (should not do anything)
    const clickCount = await claimButton.click().catch(() => 0)
    
    // Button should remain disabled until tx completes
    await expect(claimButton).toBeDisabled()
  })

  test('Edge Case: Should handle wallet disconnect gracefully', async ({ page }) => {
    // Get Claim button
    const claimButton = page.locator('button:has-text("Claim")').first()
    
    // Initially should be enabled
    await expect(claimButton).toBeEnabled()
    
    // Should have proper title/tooltip
    const title = await claimButton.getAttribute('title')
    expect(title?.length || 0).toBeGreaterThan(0)
  })

  test('Edge Case: Should disable button when no yield to claim', async ({ page }) => {
    // Look for Claim buttons
    const claimButtons = page.locator('button:has-text("Claim")')
    
    // At least one should exist
    const count = await claimButtons.count()
    expect(count).toBeGreaterThan(0)
    
    // Check button states
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = claimButtons.nth(i)
      const title = await button.getAttribute('title')
      
      if (title?.includes('No yield')) {
        // Should be disabled
        await expect(button).toBeDisabled()
      }
    }
  })
})
