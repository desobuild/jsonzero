import { test, expect } from '@playwright/test'

test.describe('JSONZero Developer & Testing Tools — Phase 7 E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
  })

  test('1. Open Testing tool from toolbar', async ({ page }) => {
    const testBtn = page.locator('#toolbar-testing')
    await expect(testBtn).toBeVisible()
    await testBtn.click()

    const workbench = page.locator('#testing-workbench')
    await expect(workbench).toBeVisible()
    await expect(page.locator('#testing-selector')).toBeVisible()
  })

  test('2. Generate API assertions and Generic assertions', async ({
    page,
  }) => {
    await page.locator('#toolbar-testing').click()

    // Load sample data
    await page.locator('[data-testid="testing-input-sample-btn"]').click()

    // Default is API assertions
    const codeOutput = page.locator('[data-testid="assertions-code-output"]')
    await expect(codeOutput).toBeVisible()
    await expect(codeOutput).toContainText('// API Assertions')
    await expect(codeOutput).toContainText('expect(body.id).toBe(42);')

    // Switch to Generic assertions
    const selector = page.locator('#testing-selector')
    await selector.selectOption('generic-assertions')
    await expect(codeOutput).toContainText('ASSERT $.id EQUALS 42')
  })

  test('3. Generate Playwright assertions', async ({ page }) => {
    await page.locator('#toolbar-testing').click()
    await page.locator('[data-testid="testing-input-sample-btn"]').click()

    const selector = page.locator('#testing-selector')
    await selector.selectOption('playwright-assertions')

    const codeOutput = page.locator('[data-testid="assertions-code-output"]')
    await expect(codeOutput).toBeVisible()
    await expect(codeOutput).toContainText('// Playwright API Test')
    await expect(codeOutput).toContainText(
      "const response = await request.get('<YOUR_ENDPOINT>');"
    )
    await expect(codeOutput).toContainText(
      'expect(response.ok()).toBeTruthy();'
    )
    await expect(codeOutput).toContainText('expect(body.id).toBe(42);')
  })

  test('4. Validate JSON against Schema (Valid case)', async ({ page }) => {
    await page.locator('#toolbar-testing').click()

    const selector = page.locator('#testing-selector')
    await selector.selectOption('schema-validation')

    // Schema editor should be visible
    await expect(page.locator('#schema-editor-pane')).toBeVisible()

    // Load sample data for schema
    await page.locator('[data-testid="testing-input-sample-btn"]').click()

    // Verify valid result
    await expect(
      page.locator('[data-testid="schema-valid-result"]')
    ).toBeVisible()
    await expect(page.getByText('Schema Validation: Valid')).toBeVisible()
  })

  test('5. Show schema validation errors (Invalid case)', async ({ page }) => {
    await page.locator('#toolbar-testing').click()

    const selector = page.locator('#testing-selector')
    await selector.selectOption('schema-validation')

    // Fill invalid data and strict schema
    const inputArea = page.locator('#testing-input-textarea')
    await inputArea.fill('{"id": "not-an-integer", "name": "A"}')

    const schemaArea = page.locator('#schema-textarea')
    await schemaArea.fill(
      JSON.stringify({
        type: 'object',
        required: ['id', 'name', 'email'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string', minLength: 3 },
        },
      })
    )

    await expect(
      page.locator('[data-testid="schema-invalid-result"]')
    ).toBeVisible()
    const errorItems = page.locator('[data-testid="schema-error-item"]')
    await expect(errorItems.first()).toBeVisible()
  })

  test('6. Generate mock JSON', async ({ page }) => {
    await page.locator('#toolbar-testing').click()

    const selector = page.locator('#testing-selector')
    await selector.selectOption('mock-json')

    await page.locator('[data-testid="testing-input-sample-btn"]').click()

    const mockOutput = page.locator('[data-testid="mock-json-output"]')
    await expect(mockOutput).toBeVisible()
    await expect(mockOutput).toContainText('"id": 0')
  })

  test('7. Expected vs Actual identical case', async ({ page }) => {
    await page.locator('#toolbar-testing').click()

    const selector = page.locator('#testing-selector')
    await selector.selectOption('expected-actual')

    // Enter identical JSON
    const expectedArea = page.locator('#testing-input-textarea')
    await expectedArea.fill('{"status": "ok", "count": 10}')

    const actualArea = page.locator('#testing-actual-textarea')
    await actualArea.fill('{"status": "ok", "count": 10}')

    await expect(page.locator('[data-testid="diff-match-badge"]')).toBeVisible()
    await expect(page.getByText('Responses Match')).toBeVisible()
  })

  test('8. Expected vs Actual changed case and Diff -> Assertions workflow', async ({
    page,
  }) => {
    await page.locator('#toolbar-testing').click()

    const selector = page.locator('#testing-selector')
    await selector.selectOption('expected-actual')

    // Enter differing JSON
    const expectedArea = page.locator('#testing-input-textarea')
    await expectedArea.fill('{"id": 42, "role": "admin"}')

    const actualArea = page.locator('#testing-actual-textarea')
    await actualArea.fill('{"id": 41, "role": "user"}')

    await expect(
      page.locator('[data-testid="diff-mismatch-badge"]')
    ).toBeVisible()

    // Click Generate Assertions
    const genBtn = page.locator('[data-testid="generate-diff-assertions-btn"]')
    await expect(genBtn).toBeVisible()
    await genBtn.click()

    // Assertions view should now be active
    const codeOutput = page.locator('[data-testid="assertions-code-output"]')
    await expect(codeOutput).toBeVisible()
    await expect(codeOutput).toContainText(
      'Diff Assertions (Expected Response)'
    )
    await expect(codeOutput).toContainText('expect(body.id).toBe(42);')
  })

  test('9. Copy output and Download output', async ({ page }) => {
    await page.locator('#toolbar-testing').click()
    await page.locator('[data-testid="testing-input-sample-btn"]').click()

    // Copy action
    const copyBtn = page.locator('#testing-copy-btn')
    await copyBtn.click()
    await expect(page.getByText('Copied to clipboard')).toBeVisible()

    // Download action
    const downloadPromise = page.waitForEvent('download')
    await page.locator('#testing-download-btn').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('jsonzero-assertions.ts')
  })

  test('10. Invalid input recovery', async ({ page }) => {
    await page.locator('#toolbar-testing').click()

    const inputArea = page.locator('#testing-input-textarea')
    await inputArea.fill('{ invalid: json, }')

    const errorAlert = page.locator('[data-testid="testing-error-alert"]')
    await expect(errorAlert).toBeVisible()

    // Recover with valid JSON
    await inputArea.fill('{"valid": true}')
    await expect(errorAlert).not.toBeVisible()
    await expect(
      page.locator('[data-testid="assertions-code-output"]')
    ).toBeVisible()
  })

  test('11. More menu: click Developer tool opens Testing workbench', async ({
    page,
  }) => {
    const moreBtn = page.locator('#toolbar-more')
    await moreBtn.click()

    const playwrightItem = page.locator('[data-testid="more-menu-playwright"]')
    await expect(playwrightItem).toBeVisible()
    await playwrightItem.click()

    await expect(page.locator('#testing-workbench')).toBeVisible()
    await expect(page.locator('#testing-selector')).toHaveValue(
      'playwright-assertions'
    )
  })

  test('12. Mobile viewport: tabs toggle visibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.locator('#toolbar-testing').click()

    const selector = page.locator('#testing-selector')
    await selector.selectOption('schema-validation')

    const mobileTabInput = page.locator('[data-testid="mobile-tab-input"]')
    const mobileTabSchema = page.locator('[data-testid="mobile-tab-schema"]')
    const mobileTabPreview = page.locator('[data-testid="mobile-tab-preview"]')

    await expect(mobileTabInput).toBeVisible()
    await expect(mobileTabSchema).toBeVisible()
    await expect(mobileTabPreview).toBeVisible()

    // Toggle to Schema tab
    await mobileTabSchema.click()
    await expect(page.locator('#schema-editor-pane')).toBeVisible()

    // Toggle to Preview tab
    await mobileTabPreview.click()
    await expect(page.locator('#testing-preview-pane')).toBeVisible()
  })
})
