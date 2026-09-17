import { test, expect } from '@playwright/test'

test.describe('JSONZero JSON Convert — Phase 6 E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
  })

  test('Table: Open Convert -> select Table -> enter array JSON -> verify table headers/cells -> copy cell & row', async ({
    page,
  }) => {
    // 1. Open Convert from Toolbar
    const convertBtn = page.locator('#toolbar-convert')
    await expect(convertBtn).toBeVisible()
    await convertBtn.click()

    const workbench = page.locator('#convert-workbench')
    await expect(workbench).toBeVisible()

    // 2. Select Table
    const selector = page.locator('#convert-selector')
    await selector.selectOption('table')

    // 3. Enter array of objects JSON
    const inputEditor = page.locator('#convert-input-editor')
    await inputEditor.fill(
      JSON.stringify([
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ])
    )

    // 4. Verify table headers and cells
    await expect(page.locator('[data-testid="column-header-id"]')).toBeVisible()
    await expect(
      page.locator('[data-testid="column-header-name"]')
    ).toBeVisible()
    await expect(
      page.locator('[data-testid="column-header-active"]')
    ).toBeVisible()
    await expect(
      page.locator('[data-testid="column-header-email"]')
    ).toBeVisible()

    const cellAlice = page.locator('[data-testid="table-cell-0-name"]')
    await expect(cellAlice).toHaveText('Alice')

    // 5. Click cell to copy
    await cellAlice.click()
    await expect(page.getByText('Copied cell value')).toBeVisible()

    // 6. Copy row
    const copyRowBtn = page.locator('[data-testid="copy-row-btn-0"]')
    await copyRowBtn.click()
    await expect(page.getByText('Copied row')).toBeVisible()
  })

  test('CSV: Select CSV -> enter JSON -> verify generated CSV -> change delimiter -> Copy', async ({
    page,
  }) => {
    // Open Convert
    await page.locator('#toolbar-convert').click()

    // Select CSV
    const selector = page.locator('#convert-selector')
    await selector.selectOption('csv')

    // Enter JSON with quotes and commas
    const inputEditor = page.locator('#convert-input-editor')
    await inputEditor.fill(
      JSON.stringify([
        { name: 'Alice, Inc.', quote: 'She said "hi"' },
        { name: 'Bob Corp', quote: 'Simple' },
      ])
    )

    // Verify CSV output
    const output = page.locator('#convert-preview-output')
    await expect(output).toBeVisible()
    await expect(output).toContainText('"Alice, Inc."')
    await expect(output).toContainText('""hi""')

    // Change delimiter to semicolon
    const delimSelect = page.locator('#csv-delimiter-select')
    await delimSelect.selectOption(';')
    await expect(output).toContainText('name;quote')

    // Copy result
    const copyBtn = page.locator('#convert-copy-btn')
    await copyBtn.click()
    await expect(page.getByText('Copied CSV')).toBeVisible()
  })

  test('TypeScript: Select TypeScript -> enter JSON -> verify generated interfaces', async ({
    page,
  }) => {
    await page.locator('#toolbar-convert').click()

    const selector = page.locator('#convert-selector')
    await selector.selectOption('typescript')

    const inputEditor = page.locator('#convert-input-editor')
    await inputEditor.fill(
      JSON.stringify({
        id: 1,
        'user-name': 'Alice',
        profile: {
          city: 'Belagavi',
        },
      })
    )

    const output = page.locator('#convert-preview-output')
    await expect(output).toBeVisible()
    await expect(output).toContainText('export interface Root {')
    await expect(output).toContainText('id: number;')
    await expect(output).toContainText('"user-name": string;')
    await expect(output).toContainText('profile: Profile;')
    await expect(output).toContainText('export interface Profile {')
    await expect(output).toContainText('city: string;')
  })

  test('Dart: Select Dart -> enter JSON -> verify generated model class with fromJson & toJson', async ({
    page,
  }) => {
    await page.locator('#toolbar-convert').click()

    const selector = page.locator('#convert-selector')
    await selector.selectOption('dart')

    const inputEditor = page.locator('#convert-input-editor')
    await inputEditor.fill(
      JSON.stringify({
        id: 1,
        'full-name': 'Alice',
        user: {
          role: 'admin',
        },
      })
    )

    const output = page.locator('#convert-preview-output')
    await expect(output).toBeVisible()
    await expect(output).toContainText('class Root {')
    await expect(output).toContainText('final int id;')
    await expect(output).toContainText('final String fullName;')
    await expect(output).toContainText('final User user;')
    await expect(output).toContainText("fullName: json['full-name'] as String,")
    await expect(output).toContainText("'full-name': fullName,")
    await expect(output).toContainText('class User {')
  })

  test('JSON Schema: Select JSON Schema -> enter JSON -> verify draft and property inference', async ({
    page,
  }) => {
    await page.locator('#toolbar-convert').click()

    const selector = page.locator('#convert-selector')
    await selector.selectOption('json-schema')

    const inputEditor = page.locator('#convert-input-editor')
    await inputEditor.fill(
      JSON.stringify({
        id: 101,
        title: 'Task',
        tags: ['urgent', 'qa'],
      })
    )

    const output = page.locator('#convert-preview-output')
    await expect(output).toBeVisible()
    await expect(output).toContainText(
      'https://json-schema.org/draft/2020-12/schema'
    )
    await expect(output).toContainText('"type": "object"')
    await expect(output).toContainText('"type": "integer"')
    await expect(output).toContainText('"type": "string"')
    await expect(output).toContainText('"type": "array"')
  })

  test('Invalid JSON: Enter malformed JSON -> verify error -> fix JSON -> verify recovery', async ({
    page,
  }) => {
    await page.locator('#toolbar-convert').click()

    const selector = page.locator('#convert-selector')
    await selector.selectOption('typescript')

    const inputEditor = page.locator('#convert-input-editor')

    // Enter invalid JSON
    await inputEditor.fill('{\n  "name": "Alice",,\n}')

    const errorAlert = page.locator('[data-testid="convert-error"]')
    await expect(errorAlert).toBeVisible()
    await expect(page.getByText('Unable to convert JSON')).toBeVisible()

    // Fix JSON
    await inputEditor.fill('{\n  "name": "Alice"\n}')

    await expect(errorAlert).not.toBeVisible()
    const output = page.locator('#convert-preview-output')
    await expect(output).toBeVisible()
    await expect(output).toContainText('name: string;')
  })

  test('More menu: Click Convert -> TypeScript opens Convert workbench with TypeScript selected', async ({
    page,
  }) => {
    // Open More Menu
    const moreBtn = page.locator('#toolbar-more')
    await expect(moreBtn).toBeVisible()
    await moreBtn.click()

    // Click TypeScript option in More Menu
    const tsMenuItem = page.locator('[data-testid="more-menu-typescript"]')
    await expect(tsMenuItem).toBeVisible()
    await tsMenuItem.click()

    // Verify Convert workbench is active and target is TypeScript
    const workbench = page.locator('#convert-workbench')
    await expect(workbench).toBeVisible()

    const selector = page.locator('#convert-selector')
    await expect(selector).toHaveValue('typescript')
  })

  test('Mobile viewport: input and output tabs toggle visibility', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.locator('#toolbar-convert').click()

    const mobileTabInput = page.locator('[data-testid="mobile-tab-input"]')
    const mobileTabOutput = page.locator('[data-testid="mobile-tab-preview"]')

    await expect(mobileTabInput).toBeVisible()
    await expect(mobileTabOutput).toBeVisible()

    // Click Input tab -> Input pane is visible
    await mobileTabInput.click()
    const inputPane = page.locator('#convert-input-pane')
    await expect(inputPane).toBeVisible()

    const inputEditor = page.locator('#convert-input-editor')
    await inputEditor.fill('{"hello": "world"}')

    // Click Output tab -> Preview pane is visible
    await mobileTabOutput.click()
    await expect(page.locator('#convert-preview-pane')).toBeVisible()
  })
})
