import { test, expect } from '@playwright/test'

test.describe('JSONZero Formatter MVP — Screen 01 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('application loads with title, header, and initial sample JSON', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/JSONZero/)
    await expect(page.locator('#header')).toBeVisible()

    const inputEditor = page.locator('#json-input-editor')
    await expect(inputEditor).toBeVisible()
    await expect(inputEditor).toHaveValue(/CUS-1042/)
  })

  test('core workflow: Format -> Minify -> Validate -> Error -> Clear', async ({
    page,
  }) => {
    const inputEditor = page.locator('#json-input-editor')
    const outputEditor = page.locator('#json-output-editor')

    // 1. Initial output is empty with prompt
    await expect(page.getByText('Format JSON to see the result.')).toBeVisible()

    // 2. Click Format -> output receives formatted JSON
    await page.getByRole('button', { name: 'Format JSON' }).click()
    await expect(outputEditor).toBeVisible()
    await expect(outputEditor).toHaveValue(/"customer": \{/)

    // 3. Click Minify -> output receives compact single-line JSON
    await page.getByRole('button', { name: 'Minify JSON' }).click()
    await expect(outputEditor).toHaveValue(/\{"customer":\{"id":"CUS-1042"/)

    // 4. Click Validate -> status bar confirms Valid JSON
    await page.getByRole('button', { name: 'Validate JSON' }).click()
    await expect(page.locator('#status-bar')).toContainText('Valid JSON')

    // 5. Introduce invalid JSON -> Format -> Error display appears
    await inputEditor.fill('{\n  "broken": JSON\n')
    await page.getByRole('button', { name: 'Format JSON' }).click()
    await expect(page.getByText(/Invalid JSON Syntax/i)).toBeVisible()
    await expect(page.locator('#status-bar')).toContainText('Invalid JSON')

    // Input remains intact
    await expect(inputEditor).toHaveValue('{\n  "broken": JSON\n')

    // 6. Click Clear -> resets editor and output
    await page.getByRole('button', { name: 'Clear JSON' }).click()
    await expect(inputEditor).toHaveValue('')
    await expect(page.getByText('Format JSON to see the result.')).toBeVisible()
  })
})
