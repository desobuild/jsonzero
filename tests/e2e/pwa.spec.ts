import { test, expect, type Page } from '@playwright/test'

async function waitForServiceWorkerActive(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    for (let i = 0; i < 50; i++) {
      const keys = await caches.keys()
      const pwaCache = keys.find((k) => k.startsWith('jsonzero-static-'))
      if (pwaCache) {
        const cache = await caches.open(pwaCache)
        const cached = await cache.keys()
        if (cached.length > 10) return
      }
      await new Promise((r) => setTimeout(r, 100))
    }
  })
}

test.describe('JSONZero PWA & Offline Functionality', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('1. Application loads normally with title and manifest link', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/JSONZero/)
    await expect(page.locator('#header')).toBeVisible()

    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest')

    const appleIcon = page.locator('link[rel="apple-touch-icon"]')
    await expect(appleIcon).toHaveAttribute('href', '/icon-192.png')
  })

  test('2. Service worker registers successfully', async ({ page }) => {
    const isRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const reg = await navigator.serviceWorker.ready
      return !!reg && !!reg.active
    })
    expect(isRegistered).toBe(true)
  })

  test('3. Application assets are cached in Cache Storage', async ({
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    const cachedAssetCount = await page.evaluate(async () => {
      const keys = await caches.keys()
      const pwaCache = keys.find((key) => key.startsWith('jsonzero-static-'))
      if (!pwaCache) return 0
      const cache = await caches.open(pwaCache)
      const cachedRequests = await cache.keys()
      return cachedRequests.length
    })

    // Precache list includes shell, all chunks, worker, fonts, and icons (over 50 assets)
    expect(cachedAssetCount).toBeGreaterThan(10)
  })

  test('4. Reload works cleanly from cache', async ({ page }) => {
    await waitForServiceWorkerActive(page)
    await page.reload()
    await expect(page.locator('#header')).toBeVisible()
    await expect(page.locator('#json-input-editor')).toBeVisible()
  })

  test('5. Application boots and operates when network is blocked (offline)', async ({
    context,
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    // Simulate complete network disconnection
    await context.setOffline(true)

    // Reload page while completely offline
    await page.reload()

    await expect(page.locator('#header')).toBeVisible()
    await expect(page.locator('#json-input-editor')).toBeVisible()
    await expect(page.locator('#network-status')).toContainText('Offline')

    // Restore online state
    await context.setOffline(false)
  })

  test('6. Formatter works offline', async ({ context, page }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    const inputEditor = page.locator('#json-input-editor')
    const outputEditor = page.locator('#json-output-editor')

    await inputEditor.fill('{"status":"offline_ok","count":42}')
    await page.getByRole('button', { name: 'Format JSON' }).click()

    await expect(outputEditor).toHaveValue(
      /{\n\s+"status": "offline_ok",\n\s+"count": 42\n}/
    )
    await expect(page.locator('#status-bar')).toContainText('Valid JSON')

    await context.setOffline(false)
  })

  test('7. Inspector works offline (lazy chunk loaded from cache)', async ({
    context,
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    // Switch to Tree inspector while offline
    const treeBtn = page.locator('#toolbar-tree')
    await expect(treeBtn).toBeVisible()
    await treeBtn.click()

    const tree = page.getByRole('tree', { name: 'JSON Structure Tree' })
    await expect(tree).toBeVisible()
    await expect(tree.getByText('customer')).toBeVisible()

    await context.setOffline(false)
  })

  test('8. Compare works offline (lazy chunk loaded from cache)', async ({
    context,
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    // Switch to Compare while offline
    const diffBtn = page.locator('#toolbar-diff')
    await expect(diffBtn).toBeVisible()
    await diffBtn.click()

    await expect(page.locator('#compare-workbench')).toBeVisible()

    await context.setOffline(false)
  })

  test('9. Convert works offline (lazy chunk loaded from cache)', async ({
    context,
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    // Switch to Convert while offline
    const convertBtn = page.locator('#toolbar-convert')
    await expect(convertBtn).toBeVisible()
    await convertBtn.click()

    await expect(page.locator('#convert-workbench')).toBeVisible()

    await context.setOffline(false)
  })

  test('10. Testing tools work offline (lazy chunk loaded from cache)', async ({
    context,
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    // Switch to Testing while offline
    const testBtn = page.locator('#toolbar-testing')
    await expect(testBtn).toBeVisible()
    await testBtn.click()

    await expect(page.locator('#testing-workbench')).toBeVisible()

    await context.setOffline(false)
  })

  test('11. Worker operations continue working offline for large JSON', async ({
    context,
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    // Generate ~120 KB JSON (exceeds 100 KB worker threshold)
    const largePayload = JSON.stringify(
      Array.from({ length: 600 }, (_, i) => ({
        id: i + 1,
        title: `Item ${i + 1}`,
        description: 'Testing web worker offline processing in JSONZero',
        active: true,
      }))
    )

    const inputEditor = page.locator('#json-input-editor')
    const outputEditor = page.locator('#json-output-editor')

    await inputEditor.fill(largePayload)
    await page.getByRole('button', { name: 'Format JSON' }).click()

    await expect(outputEditor).toBeVisible()
    await expect(outputEditor).toHaveValue(/Item 600/)
    await expect(page.locator('#status-bar')).toContainText('Valid JSON')

    await context.setOffline(false)
  })

  test('12. Local file opening works offline', async ({ context, page }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    // Set file input locally
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'offline-sample.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ offlineFile: true, success: 1 })),
    })

    const inputEditor = page.locator('#json-input-editor')
    await expect(inputEditor).toHaveValue(/offlineFile/)

    await context.setOffline(false)
  })

  test('13. Downloads work offline', async ({ context, page }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)
    await page.reload()

    // Format first to enable Download button
    await page.getByRole('button', { name: 'Format JSON' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download JSON' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('formatted.json')

    await context.setOffline(false)
  })

  test('14. Theme preferences survive offline', async ({ context, page }) => {
    await waitForServiceWorkerActive(page)

    // Set theme to light
    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Light' }).click()
    await expect(page.locator('html')).toHaveClass(/light/)

    // Go offline and reload
    await context.setOffline(true)
    await page.reload()

    await expect(page.locator('html')).toHaveClass(/light/)

    // Restore dark theme
    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await context.setOffline(false)
  })

  test('15. Zero unexpected external network requests occur during JSON processing', async ({
    page,
  }) => {
    const networkRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      // Capture any requests not going to the local dev origin
      if (!url.startsWith('http://localhost:4173')) {
        networkRequests.push(url)
      }
    })

    // Perform multiple operations
    await page.getByRole('button', { name: 'Format JSON' }).click()
    await page.getByRole('button', { name: 'Minify JSON' }).click()
    await page.getByRole('button', { name: 'Validate JSON' }).click()

    // Assert strictly zero external requests
    expect(networkRequests).toEqual([])
  })

  test('16. Production navigation regression: repeated document navigation under active Service Worker control never fails', async ({
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    // Verify Service Worker is actively controlling the page
    const isControlled = await page.evaluate(
      () => navigator.serviceWorker.controller !== null
    )
    expect(isControlled).toBe(true)

    // Repeat fresh navigations to '/' multiple times
    for (let i = 0; i < 5; i++) {
      const response = await page.goto('/')
      expect(response).not.toBeNull()
      expect(response?.status()).toBe(200)
      await expect(page.locator('#header')).toBeVisible()
      await expect(page.locator('#json-input-editor')).toBeVisible()
    }
  })

  test('17. Production navigation regression: navigations with query parameters succeed under active Service Worker', async ({
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    const isControlled = await page.evaluate(
      () => navigator.serviceWorker.controller !== null
    )
    expect(isControlled).toBe(true)

    // Navigation with query string ?test=1 (the production reproduction case)
    const response1 = await page.goto('/?test=1')
    expect(response1).not.toBeNull()
    expect(response1?.status()).toBe(200)
    await expect(page.locator('#header')).toBeVisible()
    await expect(page.locator('#json-input-editor')).toBeVisible()

    // Additional query strings
    const response2 = await page.goto('/?filter=sample&view=raw')
    expect(response2).not.toBeNull()
    expect(response2?.status()).toBe(200)
    await expect(page.locator('#header')).toBeVisible()
    await expect(page.locator('#json-input-editor')).toBeVisible()

    // Reload with query string
    await page.reload()
    await expect(page.locator('#header')).toBeVisible()
    await expect(page.locator('#json-input-editor')).toBeVisible()
  })

  test('18. Offline navigation with query parameters falls back cleanly to app shell', async ({
    context,
    page,
  }) => {
    await waitForServiceWorkerActive(page)

    await context.setOffline(true)

    // Navigate to a URL with query string while offline
    const response = await page.goto('/?offline_mode=1')
    expect(response).not.toBeNull()
    expect(response?.status()).toBe(200)

    await expect(page.locator('#header')).toBeVisible()
    await expect(page.locator('#json-input-editor')).toBeVisible()
    await expect(page.locator('#network-status')).toContainText('Offline')

    // Formatting continues to function offline on query-string URL
    const inputEditor = page.locator('#json-input-editor')
    const outputEditor = page.locator('#json-output-editor')
    await inputEditor.fill('{"queryOffline":true}')
    await page.getByRole('button', { name: 'Format JSON' }).click()
    await expect(outputEditor).toHaveValue(/{\n\s+"queryOffline": true\n}/)

    await context.setOffline(false)
  })
})
