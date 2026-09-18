import { test, expect } from '@playwright/test'

test.describe('JSONZero Performance & Scalability — Phase 8 E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await expect(page.locator('#header')).toBeVisible()
  })

  test('1. Load medium JSON document, format it, and verify responsive status bar', async ({
    page,
  }) => {
    // Generate ~100 KB JSON with items
    const mediumArray = Array.from({ length: 400 }, (_, i) => ({
      id: i + 1,
      sku: `SKU-${(i + 1).toString().padStart(5, '0')}`,
      title: `Product Title ${i + 1}`,
      active: i % 2 === 0,
    }))
    const mediumJson = JSON.stringify(mediumArray)

    const inputEditor = page.locator('#json-input-editor')
    await inputEditor.fill(mediumJson)

    // Format
    const formatBtn = page.locator('#toolbar-format')
    await formatBtn.click()

    // Formatted output populated
    const outputEditor = page.locator('#json-output-editor')
    await expect(outputEditor).toContainText('SKU-00001')
    await expect(outputEditor).toContainText('Product Title 1')

    // Status bar shows valid
    await expect(page.locator('#status-bar')).toContainText('Valid JSON')
  })

  test('2. Inspect medium JSON in Tree View, verify windowing and tree search', async ({
    page,
  }) => {
    const items = Array.from({ length: 120 }, (_, i) => ({
      id: i + 1,
      name: `Entity ${i + 1}`,
      code: `CODE-${i + 1}`,
    }))
    const jsonStr = JSON.stringify(items)

    const inputEditor = page.locator('#json-input-editor')
    await inputEditor.fill(jsonStr)

    // Open Tree View
    const treeToggle = page.locator('#toolbar-tree')
    await treeToggle.click()

    // Verify Inspector workbench rendered
    await expect(
      page.locator('[data-testid="inspector-workbench"]')
    ).toBeVisible()

    // Verify root array shows item count badge
    await expect(page.getByText('120 items', { exact: true })).toBeVisible()

    // Verify large array windowing indicator
    await expect(page.getByText(/Showing 1–50 of 120 items/i)).toBeVisible()

    // Click Show next 50
    const showNextBtn = page.getByRole('button', { name: /Show next 50/i })
    await showNextBtn.click()
    await expect(page.getByText(/Showing 1–100 of 120 items/i)).toBeVisible()

    // Tree search for Entity 12
    const searchInput = page.getByRole('searchbox', { name: /Search tree/i })
    await searchInput.fill('Entity 12')
    await expect(page.locator('span.px-1', { hasText: /of/ })).toBeVisible()
  })

  test('3. Large document high-performance mode in CodeEditor', async ({
    page,
  }) => {
    // Generate > 150 KB JSON with 300 items of 600 chars each (~185 KB)
    const largeArray = Array.from({ length: 300 }, (_, i) => ({
      id: i + 1,
      payload: 'X'.repeat(600),
    }))
    const largeJson = JSON.stringify(largeArray, null, 2)

    const inputEditor = page.locator('#json-input-editor')
    await inputEditor.fill(largeJson)

    // High performance mode indicator appears
    const indicator = page
      .locator('[data-testid="large-doc-indicator"]')
      .first()
    await expect(indicator).toBeVisible()
    await expect(indicator).toContainText('High-performance mode')

    // Format works with large document
    const formatBtn = page.locator('#toolbar-format')
    await formatBtn.click()

    const outputEditor = page.locator('#json-output-editor')
    await expect(outputEditor).toHaveValue(/"id": 1/, { timeout: 10000 })
  })

  test('4. Large Table pagination in Convert workbench preserves full copy', async ({
    page,
  }) => {
    const tableItems = Array.from({ length: 80 }, (_, i) => ({
      id: i + 1,
      label: `Row Item ${i + 1}`,
      active: true,
    }))
    const jsonStr = JSON.stringify(tableItems)

    const inputEditor = page.locator('#json-input-editor')
    await inputEditor.fill(jsonStr)

    // Switch to Convert workbench
    const convertBtn = page.locator('#toolbar-convert')
    await convertBtn.click()

    // Table view rendered with pagination
    await expect(
      page.locator('[data-testid="convert-table-container"]')
    ).toBeVisible()
    await expect(page.getByText(/Rows 1–50 of 80/i)).toBeVisible()

    // Navigate to next page
    const nextBtn = page.getByRole('button', { name: 'Next Page' })
    await nextBtn.click()
    await expect(page.getByText(/Rows 51–80 of 80/i)).toBeVisible()

    // Copy table button triggers toast
    const copyTableBtn = page.locator('[data-testid="copy-table-btn"]')
    await copyTableBtn.click()
    await expect(page.locator('#toast')).toContainText(
      'Copied table data (TSV)'
    )
  })

  test('5. Error recovery with malformed JSON input', async ({ page }) => {
    // Malformed JSON
    const malformed = '{\n  "data": [\n    {"id": 1},\n    {"id": 2,\n  ]\n}'
    const inputEditor = page.locator('#json-input-editor')
    await inputEditor.fill(malformed)

    // Format attempts
    const formatBtn = page.locator('#toolbar-format')
    await formatBtn.click()

    // Error display shown
    await expect(page.locator('#status-bar')).toContainText('Invalid JSON')
    await expect(page.getByText(/Invalid JSON Syntax/i)).toBeVisible()

    // Fix JSON
    const validJson = '{\n  "data": [\n    {"id": 1},\n    {"id": 2}\n  ]\n}'
    await inputEditor.fill(validJson)
    await formatBtn.click()

    // Error cleared, formatted successfully
    await expect(page.locator('#status-bar')).toContainText('Valid JSON')
    const outputEditor = page.locator('#json-output-editor')
    await expect(outputEditor).toHaveValue(/"id": 1/)
  })
})
