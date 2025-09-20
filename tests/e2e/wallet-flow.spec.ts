import { test, expect } from '@playwright/test'

/**
 * End-to-end tests for Solana wallet integration
 * Tests the complete wallet connection, authentication, and transaction flow
 */

test.describe('Solana Wallet Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to wallet page
    await page.goto('/wallet')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display wallet connection interface', async ({ page }) => {
    // Check if wallet connection UI is visible
    await expect(page.locator('h1')).toContainText('Solana Wallet')
    await expect(page.locator('button')).toContainText('Connect Phantom')
    await expect(page.locator('button')).toContainText('Connect Solflare')

    // Check security information is displayed
    await expect(
      page.locator('text=Connecting your wallet only proves ownership')
    ).toBeVisible()
    await expect(
      page.locator('text=no funds can be accessed without your confirmation')
    ).toBeVisible()
  })

  test('should show security warnings and disclaimers', async ({ page }) => {
    // Check security disclaimers are present
    await expect(page.locator('text=🔒 Security & Trust')).toBeVisible()
    await expect(page.locator('text=What We Do')).toBeVisible()
    await expect(page.locator("text=What We Don't Do")).toBeVisible()

    // Check specific security points
    await expect(
      page.locator('text=Connecting only proves ownership')
    ).toBeVisible()
    await expect(
      page.locator('text=Never request access to your private keys')
    ).toBeVisible()
    await expect(page.locator('text=Never auto-connect')).toBeVisible()
  })

  test('should handle wallet not installed scenario', async ({ page }) => {
    // Mock wallet not available
    await page.addInitScript(() => {
      window.phantom = undefined
      window.solflare = undefined
    })

    // Try to connect wallet
    await page.click('button:has-text("Connect Phantom")')

    // Should show appropriate error or fallback
    await expect(page.locator('text=wallet not found')).toBeVisible()
  })

  test('should display QR code for deposits', async ({ page }) => {
    // Mock wallet connection
    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: '11111111111111111111111111111111',
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
      }
    })

    // Connect wallet
    await page.click('button:has-text("Connect Phantom")')

    // Wait for connection
    await page.waitForSelector('text=Wallet Connected', { timeout: 10000 })

    // Check if QR code is displayed
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible()
    await expect(page.locator('text=Deposit Address')).toBeVisible()
  })

  test('should handle authentication flow', async ({ page }) => {
    // Mock wallet with authentication
    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: '11111111111111111111111111111111',
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
      }
    })

    // Connect wallet
    await page.click('button:has-text("Connect Phantom")')
    await page.waitForSelector('text=Wallet Connected')

    // Check authentication step
    await expect(page.locator('text=Authentication Required')).toBeVisible()
    await expect(page.locator('text=Sign Message')).toBeVisible()

    // Sign message
    await page.click('button:has-text("Sign Message")')

    // Should show authenticated state
    await expect(page.locator('text=✅ Authenticated')).toBeVisible()
  })

  test('should validate transaction inputs', async ({ page }) => {
    // Mock authenticated wallet
    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: '11111111111111111111111111111111',
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
        sendTransaction: () => Promise.resolve('mock_signature'),
      }
    })

    // Go to transfer tab
    await page.click('button:has-text("SOL Transfer")')

    // Test invalid inputs
    await page.fill(
      'input[placeholder="Enter Solana address"]',
      'invalid-address'
    )
    await page.fill('input[placeholder="0.001"]', '-1')

    // Try to send
    await page.click('button:has-text("Send SOL")')

    // Should show validation error
    await expect(page.locator('text=Invalid recipient address')).toBeVisible()
  })

  test('should prevent self-transfers', async ({ page }) => {
    const mockPublicKey = '11111111111111111111111111111111'

    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: mockPublicKey,
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
      }
    })

    // Connect wallet
    await page.click('button:has-text("Connect Phantom")')
    await page.waitForSelector('text=Wallet Connected')

    // Go to transfer tab
    await page.click('button:has-text("SOL Transfer")')

    // Enter own address
    await page.fill('input[placeholder="Enter Solana address"]', mockPublicKey)
    await page.fill('input[placeholder="0.001"]', '0.1')

    // Try to send
    await page.click('button:has-text("Send SOL")')

    // Should show error
    await expect(page.locator('text=Cannot send SOL to yourself')).toBeVisible()
  })

  test('should handle transaction confirmation', async ({ page }) => {
    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: '11111111111111111111111111111111',
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
        sendTransaction: () => Promise.resolve('mock_transaction_signature'),
      }
    })

    // Connect and authenticate
    await page.click('button:has-text("Connect Phantom")')
    await page.waitForSelector('text=Wallet Connected')
    await page.click('button:has-text("Sign Message")')
    await page.waitForSelector('text=✅ Authenticated')

    // Go to transfer tab
    await page.click('button:has-text("SOL Transfer")')

    // Enter valid transaction
    await page.fill(
      'input[placeholder="Enter Solana address"]',
      '22222222222222222222222222222222'
    )
    await page.fill('input[placeholder="0.001"]', '0.1')

    // Send transaction
    await page.click('button:has-text("Send SOL")')

    // Should show success message
    await expect(page.locator('text=Transaction successful')).toBeVisible()
    await expect(page.locator('text=mock_transaction_signature')).toBeVisible()
  })

  test('should handle withdrawal requests', async ({ page }) => {
    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: '11111111111111111111111111111111',
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
      }
    })

    // Connect and authenticate
    await page.click('button:has-text("Connect Phantom")')
    await page.waitForSelector('text=Wallet Connected')
    await page.click('button:has-text("Sign Message")')
    await page.waitForSelector('text=✅ Authenticated')

    // Go to transfer tab
    await page.click('button:has-text("SOL Transfer")')

    // Request withdrawal
    await page.fill('input[placeholder="0.001"]', '0.5')
    await page.click('button:has-text("Request Withdrawal")')

    // Should show success message
    await expect(
      page.locator('text=Withdrawal request submitted')
    ).toBeVisible()
  })

  test('should display balance correctly', async ({ page }) => {
    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: '11111111111111111111111111111111',
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
      }
    })

    // Connect wallet
    await page.click('button:has-text("Connect Phantom")')
    await page.waitForSelector('text=Wallet Connected')

    // Check balance display
    await expect(page.locator('text=Balance:')).toBeVisible()
    await expect(page.locator('text=SOL')).toBeVisible()

    // Test balance refresh
    await page.click('button:has-text("Refresh Balance")')
    // Should not throw errors
  })

  test('should handle wallet disconnection', async ({ page }) => {
    await page.addInitScript(() => {
      window.phantom = {
        connect: () =>
          Promise.resolve({
            publicKey: '11111111111111111111111111111111',
          }),
        disconnect: () => Promise.resolve(),
        signMessage: () => Promise.resolve(new Uint8Array(64)),
      }
    })

    // Connect wallet
    await page.click('button:has-text("Connect Phantom")')
    await page.waitForSelector('text=Wallet Connected')

    // Disconnect wallet
    await page.click('button:has-text("Disconnect")')

    // Should return to connection state
    await expect(
      page.locator('button:has-text("Connect Phantom")')
    ).toBeVisible()
    await expect(page.locator('text=Wallet Connected')).not.toBeVisible()
  })
})
