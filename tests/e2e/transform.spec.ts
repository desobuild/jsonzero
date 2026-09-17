import { test, expect } from '@playwright/test'

test.describe('JSONZero JSON Transform — Phase 5 E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
  })

  test('Recursive Sort: Open Transform -> enter JSON -> select Recursive Sort -> verify preview -> Apply -> verify editor content', async ({
    page,
  }) => {
    // 1. Open Transform from Toolbar
    const transformBtn = page.locator('#toolbar-transform')
    await expect(transformBtn).toBeVisible()
    await transformBtn.click()

    const workbench = page.locator('#transform-workbench')
    await expect(workbench).toBeVisible()

    // 2. Enter unordered nested JSON
    const inputEditor = page.locator('#transform-input-editor')
    await inputEditor.fill(
      '{\n  "z": {\n    "b": 1,\n    "a": 2\n  },\n  "a": {\n    "d": 4,\n    "c": 3\n  }\n}'
    )

    // 3. Select Recursive Sort
    const selector = page.locator('#transform-selector')
    await selector.selectOption('sort-recursive')

    // 4. Verify preview shows keys sorted in ascending order
    const preview = page.locator('#transform-preview-output')
    await expect(preview).toBeVisible()
    const previewText = (await preview.textContent()) || ''
    expect(previewText.indexOf('"a"')).toBeLessThan(previewText.indexOf('"z"'))
    expect(previewText.indexOf('"c"')).toBeLessThan(previewText.indexOf('"d"'))

    // 5. Apply transformation
    const applyBtn = page.locator('#transform-apply-btn')
    await expect(applyBtn).toBeEnabled()
    await applyBtn.click()

    await expect(
      page.getByText('Applied transformed JSON to editor')
    ).toBeVisible()

    // 6. Verify input in Transform is updated
    await expect(inputEditor).toHaveValue(previewText)

    // 7. Toggle back to Editor and verify active editor content
    await transformBtn.click()
    const mainEditor = page.locator('#json-input-editor')
    await expect(mainEditor).toBeVisible()
    await expect(mainEditor).toHaveValue(previewText)
  })

  test('Flatten / Unflatten round trip: Flatten JSON -> verify preview -> Apply -> Unflatten -> verify original structure recovered', async ({
    page,
  }) => {
    // Open Transform
    await page.locator('#toolbar-transform').click()
    const inputEditor = page.locator('#transform-input-editor')
    const selector = page.locator('#transform-selector')
    const preview = page.locator('#transform-preview-output')

    // 1. Enter nested JSON
    await inputEditor.fill(
      '{\n  "user": {\n    "name": "Alice",\n    "age": 25\n  }\n}'
    )

    // 2. Select Flatten
    await selector.selectOption('flatten')

    // 3. Verify preview
    await expect(preview).toContainText('"user.name": "Alice"')
    await expect(preview).toContainText('"user.age": 25')

    // 4. Apply
    await page.locator('#transform-apply-btn').click()
    await expect(
      page.getByText('Applied transformed JSON to editor')
    ).toBeVisible()

    // 5. Select Unflatten
    await selector.selectOption('unflatten')

    // 6. Verify original structure recovered in preview
    await expect(preview).toContainText('"user": {')
    await expect(preview).toContainText('"name": "Alice"')
    await expect(preview).toContainText('"age": 25')
  })

  test('Escape / Unescape: Escape JSON -> verify escaped result -> Apply -> Unescape -> verify valid JSON restored', async ({
    page,
  }) => {
    await page.locator('#toolbar-transform').click()
    const inputEditor = page.locator('#transform-input-editor')
    const selector = page.locator('#transform-selector')
    const preview = page.locator('#transform-preview-output')

    // 1. Enter JSON
    await inputEditor.fill('{\n  "name": "Alice",\n  "message": "Hello"\n}')

    // 2. Select Escape
    await selector.selectOption('escape')

    // 3. Verify escaped representation
    await expect(preview).toContainText(
      '{\\"name\\":\\"Alice\\",\\"message\\":\\"Hello\\"'
    )

    // 4. Apply
    await page.locator('#transform-apply-btn').click()

    // 5. Select Unescape
    await selector.selectOption('unescape')

    // 6. Verify valid formatted JSON is restored
    await expect(preview).toContainText('"name": "Alice"')
    await expect(preview).toContainText('"message": "Hello"')
  })

  test('Collision Handling: Provide ambiguous flatten/unflatten input -> verify error -> verify original input preserved', async ({
    page,
  }) => {
    await page.locator('#toolbar-transform').click()
    const inputEditor = page.locator('#transform-input-editor')
    const selector = page.locator('#transform-selector')

    // Ambiguous input where a.b is both a primitive and an object container
    const ambiguousJson = '{\n  "a.b": 1,\n  "a.b.c": 2\n}'
    await inputEditor.fill(ambiguousJson)

    // Select Unflatten
    await selector.selectOption('unflatten')

    // Verify error display
    const errorAlert = page.locator('[data-testid="transform-error"]')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText('Path collision')
    await expect(errorAlert).toContainText('a.b.c')

    // Verify original input preserved
    await expect(inputEditor).toHaveValue(ambiguousJson)

    // Verify Apply button is disabled
    const applyBtn = page.locator('#transform-apply-btn')
    await expect(applyBtn).toBeDisabled()
  })

  test('Invalid JSON: Enter invalid JSON -> select structural transform -> verify actionable error -> fix JSON -> verify transform works', async ({
    page,
  }) => {
    await page.locator('#toolbar-transform').click()
    const inputEditor = page.locator('#transform-input-editor')
    const selector = page.locator('#transform-selector')

    // 1. Enter invalid JSON
    await inputEditor.fill('{\n  "broken": invalid_syntax\n')
    await selector.selectOption('sort-keys')

    // 2. Actionable error is visible
    const errorAlert = page.locator('[data-testid="transform-error"]')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText('Invalid JSON syntax')

    // 3. Fix JSON
    await inputEditor.fill('{\n  "zebra": 1,\n  "apple": 2\n}')

    // 4. Verify transform recovers automatically
    const preview = page.locator('#transform-preview-output')
    await expect(preview).toBeVisible()
    await expect(preview).toContainText('"apple": 2')
    await expect(preview).toContainText('"zebra": 1')
  })

  test('More Menu integration: selecting tool in More menu opens Transform with tool selected', async ({
    page,
  }) => {
    // Open More Menu
    const moreBtn = page.locator('#toolbar-more')
    await expect(moreBtn).toBeVisible()
    await moreBtn.click()

    // Click Flatten item in dropdown
    const flattenItem = page.locator('[data-testid="more-menu-flatten"]')
    await expect(flattenItem).toBeVisible()
    await flattenItem.click()

    // Verify Transform workbench is active and Flatten is selected
    await expect(page.locator('#transform-workbench')).toBeVisible()
    const selector = page.locator('#transform-selector')
    await expect(selector).toHaveValue('flatten')
  })

  test('Copy transformed JSON button triggers toast notification', async ({
    page,
  }) => {
    await page.locator('#toolbar-transform').click()
    const inputEditor = page.locator('#transform-input-editor')
    await inputEditor.fill('{\n  "b": 2,\n  "a": 1\n}')

    const copyBtn = page.locator('#transform-copy-btn')
    await expect(copyBtn).toBeEnabled()
    await copyBtn.click()

    await expect(page.getByText('Copied transformed JSON')).toBeVisible()
  })

  test('Escaped JSON detection banner suggests Unescape & Format', async ({
    page,
  }) => {
    await page.locator('#toolbar-transform').click()
    const inputEditor = page.locator('#transform-input-editor')

    // Enter raw escaped JSON
    await inputEditor.fill('{\\"user\\":{\\"name\\":\\"Alice\\"}}')

    // Banner should appear
    const banner = page.locator('[data-testid="escaped-json-banner"]')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Looks like escaped JSON')

    // Click Unescape & Format
    const unescapeBtn = page.locator('[data-testid="unescape-detected-btn"]')
    await unescapeBtn.click()

    // Selector switches to Unescape and preview formats JSON
    const selector = page.locator('#transform-selector')
    await expect(selector).toHaveValue('unescape')
    const preview = page.locator('#transform-preview-output')
    await expect(preview).toContainText('"user": {')
    await expect(preview).toContainText('"name": "Alice"')
  })
})
