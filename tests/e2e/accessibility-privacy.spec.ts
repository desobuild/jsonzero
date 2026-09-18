import { test, expect } from '@playwright/test'

test.describe('JSONZero Phase 10 — Accessibility, Viewport & Privacy E2E Audit', () => {
  test('1. Full keyboard-only workflow: Format, Tab navigation, and Search Escape', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('#header')).toBeVisible()

    // Focus input editor and type JSON
    const inputArea = page.locator('#json-input-editor')
    await inputArea.focus()
    await inputArea.fill('{"audit": "keyboard", "active": true}')

    // Trigger Format via keyboard shortcut (Control+Shift+F or clicking toolbar format via keyboard)
    const formatBtn = page.locator('#toolbar-format')
    await formatBtn.focus()
    await page.keyboard.press('Enter')

    // Verify output populated
    const outputArea = page.locator('#json-output-editor')
    await expect(outputArea).toContainText('"audit": "keyboard"')

    // Open Search via shortcut
    await page.keyboard.press('Control+F')
    const searchInput = page.getByPlaceholder(/search json/i)
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeFocused()

    // Close Search via Escape
    await page.keyboard.press('Escape')
    await expect(searchInput).not.toBeVisible()
  })

  test('2. Responsive Viewports: No horizontal overflow and reachable controls', async ({
    page,
  }) => {
    const viewports = [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]

    for (const vp of viewports) {
      await page.setViewportSize(vp)
      await page.goto('/')

      await expect(page.locator('#header')).toBeVisible()
      await expect(page.locator('#toolbar')).toBeVisible()
      await expect(page.locator('#status-bar')).toBeVisible()

      // Check for accidental page horizontal overflow
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      )
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth
      )
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    }
  })

  test('3. Privacy Audit: ZERO external network requests during full workbench execution', async ({
    page,
  }) => {
    const externalRequests: string[] = []

    page.on('request', (req) => {
      const url = req.url()
      // Ignore same-origin requests (localhost / vite assets)
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('http://127.0.0.1')
      ) {
        externalRequests.push(url)
      }
      // Strictly verify no POST / PUT request sends JSON to any server
      if (req.method() !== 'GET' && req.method() !== 'HEAD') {
        externalRequests.push(`Unexpected ${req.method()} request: ${url}`)
      }
    })

    await page.goto('/')

    // Exercise Formatter
    const inputArea = page.locator('#json-input-editor')
    await inputArea.fill('{"test": 123, "privacy": "guaranteed"}')
    await page.locator('#toolbar-format').click()

    // Exercise Tree Inspector
    await page.locator('#toolbar-tree').click()
    await expect(page.getByRole('tree')).toBeVisible()

    // Exercise Diff
    await page.locator('#toolbar-diff').click()
    await expect(page.getByTestId('compare-workbench')).toBeVisible()

    // Exercise Transform
    await page.locator('#toolbar-transform').click()
    await expect(page.getByTestId('transform-workbench')).toBeVisible()

    // Exercise Convert
    await page.locator('#toolbar-convert').click()
    await expect(page.getByTestId('convert-workbench')).toBeVisible()

    // Exercise Testing Tools
    await page.locator('#toolbar-testing').click()
    await expect(page.getByTestId('testing-workbench')).toBeVisible()

    // Verify zero external or mutating requests occurred
    expect(externalRequests).toEqual([])
  })
})
