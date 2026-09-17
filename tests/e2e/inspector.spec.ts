import { test, expect } from '@playwright/test'

test.describe('JSONZero Inspection — Phase 3 E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
  })

  test('inspector workflow: open tree -> verify tree -> expand/collapse -> copy path -> verify toast', async ({
    page,
  }) => {
    // 1. Verify initial sample JSON is loaded in editor
    const inputEditor = page.locator('#json-input-editor')
    await expect(inputEditor).toBeVisible()
    await expect(inputEditor).toHaveValue(/CUS-1042/)

    // 2. Open Tree view via Toolbar
    const treeBtn = page.locator('#toolbar-tree')
    await expect(treeBtn).toBeVisible()
    await treeBtn.click()

    // 3. Verify tree structure container is visible
    const tree = page.getByRole('tree', { name: 'JSON Structure Tree' })
    await expect(tree).toBeVisible()
    await expect(tree.getByText('customer')).toBeVisible()
    await expect(tree.getByText('"Alex Morgan"')).toBeVisible()

    // 4. Collapse customer node
    const collapseCustomerBtn = page
      .getByRole('button', { name: 'Collapse node' })
      .nth(1)
    await collapseCustomerBtn.click()
    await expect(tree.getByText('"Alex Morgan"')).not.toBeVisible()

    // 5. Expand customer node again
    const expandCustomerBtn = page
      .getByRole('button', { name: 'Expand node' })
      .first()
    await expandCustomerBtn.click()
    await expect(tree.getByText('"Alex Morgan"')).toBeVisible()

    // 6. Copy JSON path on customer node
    // Hover on customer node row to reveal action buttons
    const customerRow = tree.getByText('customer').locator('..')
    await customerRow.hover()

    const copyPathBtn = page
      .getByRole('button', { name: 'Copy JSON path' })
      .first()
    await copyPathBtn.click()

    // 7. Verify Toast notification appears
    await expect(page.getByText('Copied JSON path')).toBeVisible()
  })

  test('tree search: search key/value -> verify match count -> navigate matches -> clear search', async ({
    page,
  }) => {
    // Open Tree view
    await page.locator('#toolbar-tree').click()
    await expect(
      page.getByRole('tree', { name: 'JSON Structure Tree' })
    ).toBeVisible()

    const searchInput = page.getByRole('searchbox', { name: 'Search tree' })
    await expect(searchInput).toBeVisible()

    // 1. Search for "ORD-"
    await searchInput.fill('ORD-')

    // 2. Verify match count: sample data has 2 orders (ORD-1001, ORD-1002)
    await expect(page.getByText('1 of 2')).toBeVisible()

    // 3. Navigate next match via Next match button
    await page.getByRole('button', { name: 'Next match' }).click()
    await expect(page.getByText('2 of 2')).toBeVisible()

    // 4. Navigate previous match via Previous match button
    await page.getByRole('button', { name: 'Previous match' }).click()
    await expect(page.getByText('1 of 2')).toBeVisible()

    // 5. Clear search via Clear button
    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect(searchInput).toHaveValue('')
  })

  test('jsonpath query: enter query -> execute -> verify results and copy', async ({
    page,
  }) => {
    // Open Tree view
    await page.locator('#toolbar-tree').click()

    const jsonPathInput = page.locator('#jsonpath-query-input')
    await expect(jsonPathInput).toBeVisible()

    // 1. Enter query: $.customer.name
    await jsonPathInput.fill('$.customer.name')
    await page.locator('#jsonpath-run-btn').click()

    // 2. Verify result
    await expect(page.getByText('1 result')).toBeVisible()
    await expect(page.getByText('$.customer.name')).toBeVisible()
    await expect(page.locator('pre').getByText('"Alex Morgan"')).toBeVisible()

    // 3. Test wildcard array query: $.orders[*].id
    await jsonPathInput.fill('$.orders[*].id')
    await page.locator('#jsonpath-run-btn').click()

    await expect(page.getByText('2 results')).toBeVisible()
    await expect(page.getByText('$.orders[0].id')).toBeVisible()
    await expect(page.getByText('$.orders[1].id')).toBeVisible()

    // 4. Test Copy All Results button
    await page.getByRole('button', { name: 'Copy all results as JSON' }).click()
    await expect(
      page.getByText('Copied all query results as JSON')
    ).toBeVisible()
  })

  test('statistics: inspect structure metrics', async ({ page }) => {
    // Open Tree view
    await page.locator('#toolbar-tree').click()

    // Verify statistics metrics
    await expect(page.getByText('Structure Statistics')).toBeVisible()
    await expect(page.getByText('OBJECT', { exact: true })).toBeVisible()
    await expect(page.getByText('Root Type')).toBeVisible()
    await expect(page.getByText('Max Depth')).toBeVisible()
    await expect(page.getByText('Total Nodes')).toBeVisible()
  })

  test('invalid JSON: graceful invalid state -> return to editor -> fix -> recovers', async ({
    page,
  }) => {
    const inputEditor = page.locator('#json-input-editor')

    // 1. Enter invalid JSON in Editor
    await inputEditor.fill('{\n  "broken": JSON\n')

    // 2. Open Tree view
    await page.locator('#toolbar-tree').click()

    // 3. Verify graceful invalid state banner
    await expect(page.getByText('Unable to inspect JSON')).toBeVisible()
    await expect(
      page.getByText('Fix the JSON in the editor to view the tree.')
    ).toBeVisible()

    // 4. Click Return to Editor
    const returnBtn = page.getByRole('button', { name: 'Return to Editor' })
    await expect(returnBtn).toBeVisible()
    await returnBtn.click()

    // Editor should be active again
    await expect(inputEditor).toBeVisible()

    // 5. Fix JSON in editor
    await inputEditor.fill('{\n  "status": "repaired"\n}')

    // 6. Switch back to Tree
    await page.locator('#toolbar-tree').click()

    // 7. Verify inspector recovers automatically
    await expect(
      page.getByRole('tree', { name: 'JSON Structure Tree' })
    ).toBeVisible()
    await expect(page.getByText('"repaired"')).toBeVisible()
    await expect(page.getByText('Structure Statistics')).toBeVisible()
  })
})
