import { test, expect } from '@playwright/test'

test.describe('JSONZero Structural Diff / Compare — Phase 4 E2E', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
  })

  test('basic comparison: open compare -> enter JSON A -> enter JSON B -> verify changes', async ({
    page,
  }) => {
    // 1. Click Diff on primary toolbar
    const diffBtn = page.locator('#toolbar-diff')
    await expect(diffBtn).toBeVisible()
    await diffBtn.click()

    // 2. Verify Compare Workbench is loaded
    const workbench = page.locator('#compare-workbench')
    await expect(workbench).toBeVisible()

    // 3. Clear both inputs using Clear All
    const clearAllBtn = page.getByRole('button', { name: /Clear both inputs/i })
    await clearAllBtn.click()

    // 4. Fill JSON A and JSON B
    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    await editorA.fill('{\n  "name": "Alice",\n  "age": 25\n}')
    await editorB.fill('{\n  "name": "Alice",\n  "age": 26\n}')

    // 5. Verify change summary
    const summary = page.locator('#diff-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('1 total change')
    await expect(
      page.locator('[data-testid="summary-changed-badge"]')
    ).toContainText('~ 1 Changed')

    // 6. Verify diff row
    const diffRow = page.locator('[data-testid="diff-row"]')
    await expect(diffRow).toHaveCount(1)
    await expect(page.locator('[data-testid="diff-path"]')).toHaveText('$.age')
    await expect(diffRow).toContainText('25')
    await expect(diffRow).toContainText('26')
  })

  test('key ordering: JSON A and B contain same properties in different order -> verify structurally identical', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    // Enter same data with different key orders
    await editorA.fill('{\n  "name": "Anirudh",\n  "age": 25\n}')
    await editorB.fill('{\n  "age": 25,\n  "name": "Anirudh"\n}')

    // Must be structurally identical
    const identicalNotice = page.locator('#diff-identical-state')
    await expect(identicalNotice).toBeVisible()
    await expect(identicalNotice).toContainText('Structurally Identical')
    await expect(identicalNotice).toContainText('No differences were found')
  })

  test('added, removed, and changed: verify summary and individual diff entries', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    const docA = JSON.stringify(
      {
        id: 1,
        title: 'Draft',
        tags: ['tech'],
        removedKey: 'oldValue',
      },
      null,
      2
    )

    const docB = JSON.stringify(
      {
        id: 1,
        title: 'Published',
        tags: ['tech', 'featured'],
        newKey: 'newValue',
      },
      null,
      2
    )

    await editorA.fill(docA)
    await editorB.fill(docB)

    // Verify summary counts: 2 added (newKey, tags[1]), 1 removed (removedKey), 1 changed (title)
    const summary = page.locator('#diff-summary')
    await expect(summary).toBeVisible()
    await expect(
      page.locator('[data-testid="summary-added-badge"]')
    ).toContainText('+ 2 Added')
    await expect(
      page.locator('[data-testid="summary-removed-badge"]')
    ).toContainText('- 1 Removed')
    await expect(
      page.locator('[data-testid="summary-changed-badge"]')
    ).toContainText('~ 1 Changed')

    // Verify diff entries
    const entries = page.locator('[data-testid="diff-row"]')
    await expect(entries).toHaveCount(4)

    // Check specific paths
    const paths = page.locator('[data-testid="diff-path"]')
    await expect(paths.filter({ hasText: '$.title' })).toBeVisible()
    await expect(paths.filter({ hasText: '$.newKey' })).toBeVisible()
    await expect(paths.filter({ hasText: '$.removedKey' })).toBeVisible()
    await expect(paths.filter({ hasText: '$.tags[1]' })).toBeVisible()
  })

  test('invalid JSON: make JSON A invalid -> verify error shown -> fix JSON -> verify diff recovers', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    await editorA.fill('{\n  "title": "Good"\n}')
    await editorB.fill('{\n  "title": "Better"\n}')

    // Verify valid diff initially
    await expect(page.locator('[data-testid="diff-row"]')).toHaveCount(1)

    // Introduce syntax error into JSON A
    await editorA.fill('{\n  "title": broken,\n}')

    // JSON A error notification should appear
    const errorNotice = page.locator('[data-testid="compare-json-a-error"]')
    await expect(errorNotice).toBeVisible()
    await expect(errorNotice).toContainText('JSON A syntax error')

    // Diff view should state that documents cannot be compared
    await expect(page.getByText('Cannot compare documents')).toBeVisible()

    // Fix JSON A syntax error
    await editorA.fill('{\n  "title": "Fixed"\n}')

    // Error should disappear and diff should recompute
    await expect(errorNotice).not.toBeVisible()
    await expect(page.locator('[data-testid="diff-row"]')).toHaveCount(1)
  })

  test('clipboard actions: copy path and copy summary trigger notifications', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    // Click Copy Summary
    const copySummaryBtn = page
      .getByRole('button', { name: /Copy summary/i })
      .first()
    await expect(copySummaryBtn).toBeVisible()
    await copySummaryBtn.click()

    // Toast notification should show success
    const toast = page.locator('#toast')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('Copied diff summary to clipboard')

    // Copy single path
    const copyPathBtn = page
      .locator('button[aria-label*="Copy JSON path"]')
      .first()
    await copyPathBtn.click()
    await expect(toast).toContainText('Copied JSON path to clipboard')
  })

  test('mobile responsive view: switches between JSON A, JSON B, and Diff tabs', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    // On mobile, Diff tab is active by default
    await expect(page.locator('#diff-view')).toBeVisible()

    // Switch to JSON A tab
    const tabA = page.locator('#mobile-tab-json-a')
    await tabA.click()

    const editorA = page.locator('#compare-json-a-editor')
    await expect(editorA).toBeVisible()
    await editorA.fill('{\n  "mobile": true\n}')

    // Switch to JSON B tab
    const tabB = page.locator('#mobile-tab-json-b')
    await tabB.click()

    const editorB = page.locator('#compare-json-b-editor')
    await expect(editorB).toBeVisible()
    await editorB.fill('{\n  "mobile": false\n}')

    // Switch to Diff tab and verify comparison result
    const tabDiff = page.locator('#mobile-tab-diff')
    await tabDiff.click()

    await expect(page.locator('#diff-view')).toBeVisible()
    const paths = page.locator('[data-testid="diff-path"]')
    await expect(paths.filter({ hasText: '$.mobile' })).toBeVisible()
  })
})
