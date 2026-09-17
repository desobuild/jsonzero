import { test, expect } from '@playwright/test'

test.describe('JSONZero Smoke Tests', () => {
  test('application loads successfully', async ({ page }) => {
    await page.goto('/')

    // Page title is correct
    await expect(page).toHaveTitle(/JSONZero/)
  })

  test('header is visible with branding', async ({ page }) => {
    await page.goto('/')

    // Header branding
    const header = page.locator('#header')
    await expect(header).toBeVisible()
    await expect(header.getByText('JSONZero')).toBeVisible()
  })

  test('toolbar renders primary actions', async ({ page }) => {
    await page.goto('/')

    const toolbar = page.locator('#toolbar')
    await expect(toolbar).toBeVisible()
    await expect(toolbar.getByText('Format')).toBeVisible()
    await expect(toolbar.getByText('Validate')).toBeVisible()
  })

  test('privacy indicator is displayed', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByText('Your JSON stays in your browser.')
    ).toBeVisible()
  })

  test('status bar is present', async ({ page }) => {
    await page.goto('/')

    const statusBar = page.locator('#status-bar')
    await expect(statusBar).toBeVisible()
  })
})
