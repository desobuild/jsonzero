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

  test('Scenario 1: verify changed value is visually highlighted in both editors', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    await editorA.fill('{\n  "name": "Ani",\n  "age": 77\n}')
    await editorB.fill('{\n  "name": "Ani",\n  "age": 73\n}')

    const summary = page.locator('#diff-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Found 1 difference')
    await expect(summary).toContainText('Unequal values (1)')

    const paneA = page.locator('#compare-json-a-pane')
    const paneB = page.locator('#compare-json-b-pane')

    const highlightA = paneA.locator('[data-testid="diff-highlight-changed"]')
    const highlightB = paneB.locator('[data-testid="diff-highlight-changed"]')

    await expect(highlightA).toBeVisible()
    await expect(highlightA).toHaveText('77')

    await expect(highlightB).toBeVisible()
    await expect(highlightB).toHaveText('73')
  })

  test('Scenario 2: verify added value is highlighted on right editor only', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    await editorA.fill('{\n  "name": "Ani"\n}')
    await editorB.fill('{\n  "name": "Ani",\n  "role": "engineer"\n}')

    const summary = page.locator('#diff-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Found 1 difference')
    await expect(summary).toContainText('Added values (1)')

    const paneA = page.locator('#compare-json-a-pane')
    const paneB = page.locator('#compare-json-b-pane')

    await expect(
      paneA.locator('[data-testid="diff-highlight-added"]')
    ).toHaveCount(0)

    const highlightsB = paneB.locator('[data-testid="diff-highlight-added"]')
    await expect(highlightsB.first()).toBeVisible()
    await expect(highlightsB.filter({ hasText: 'engineer' })).toBeVisible()
    await expect(highlightsB.filter({ hasText: 'role' })).toBeVisible()
  })

  test('Scenario 3: verify removed value is highlighted on left editor only', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    await editorA.fill('{\n  "name": "Ani",\n  "role": "engineer"\n}')
    await editorB.fill('{\n  "name": "Ani"\n}')

    const summary = page.locator('#diff-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Found 1 difference')
    await expect(summary).toContainText('Removed values (1)')

    const paneA = page.locator('#compare-json-a-pane')
    const paneB = page.locator('#compare-json-b-pane')

    const highlightsA = paneA.locator('[data-testid="diff-highlight-removed"]')
    await expect(highlightsA.first()).toBeVisible()
    await expect(highlightsA.filter({ hasText: 'engineer' })).toBeVisible()
    await expect(highlightsA.filter({ hasText: 'role' })).toBeVisible()

    await expect(
      paneB.locator('[data-testid="diff-highlight-removed"]')
    ).toHaveCount(0)
  })

  test('Scenario 4: toggle difference category filters and verify highlights update', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    await editorA.fill('{\n  "age": 77,\n  "role": "engineer"\n}')
    await editorB.fill(
      '{\n  "age": 73,\n  "role": "engineer",\n  "active": true\n}'
    )

    const summary = page.locator('#diff-summary')
    await expect(summary).toContainText('Found 2 differences')
    await expect(summary).toContainText('Unequal values (1)')
    await expect(summary).toContainText('Added values (1)')

    const paneA = page.locator('#compare-json-a-pane')
    const paneB = page.locator('#compare-json-b-pane')

    // Initially both changed and added highlights exist
    await expect(
      paneA.locator('[data-testid="diff-highlight-changed"]')
    ).toHaveCount(1)
    await expect(
      paneB.locator('[data-testid="diff-highlight-changed"]')
    ).toHaveCount(1)
    await expect(
      paneB.locator('[data-testid="diff-highlight-added"]').first()
    ).toBeVisible()

    // Uncheck "Unequal values"
    const filterChanged = page.locator('[data-testid="filter-changed"]')
    await filterChanged.uncheck()

    // Changed highlights should disappear
    await expect(
      paneA.locator('[data-testid="diff-highlight-changed"]')
    ).toHaveCount(0)
    await expect(
      paneB.locator('[data-testid="diff-highlight-changed"]')
    ).toHaveCount(0)
    // Added highlight remains visible
    await expect(
      paneB.locator('[data-testid="diff-highlight-added"]').first()
    ).toBeVisible()

    // Uncheck "Added values"
    const filterAdded = page.locator('[data-testid="filter-added"]')
    await filterAdded.uncheck()

    // Added highlights should disappear
    await expect(
      paneB.locator('[data-testid="diff-highlight-added"]')
    ).toHaveCount(0)

    // Summary count stays accurate
    await expect(summary).toContainText('Found 2 differences')

    // Re-check "Unequal values"
    await filterChanged.check()
    await expect(
      paneA.locator('[data-testid="diff-highlight-changed"]')
    ).toHaveCount(1)
    await expect(
      paneB.locator('[data-testid="diff-highlight-changed"]')
    ).toHaveCount(1)
  })

  test('Scenario 5: nested difference highlighting targets deep value without whole doc highlight', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    const docA = JSON.stringify(
      {
        user: {
          profile: {
            age: 77,
          },
        },
      },
      null,
      2
    )

    const docB = JSON.stringify(
      {
        user: {
          profile: {
            age: 73,
          },
        },
      },
      null,
      2
    )

    await editorA.fill(docA)
    await editorB.fill(docB)

    const summary = page.locator('#diff-summary')
    await expect(summary).toContainText('Found 1 difference')

    const paneA = page.locator('#compare-json-a-pane')
    const paneB = page.locator('#compare-json-b-pane')

    const highlightA = paneA.locator('[data-testid="diff-highlight-changed"]')
    const highlightB = paneB.locator('[data-testid="diff-highlight-changed"]')

    await expect(highlightA).toHaveCount(1)
    await expect(highlightA).toHaveText('77')

    await expect(highlightB).toHaveCount(1)
    await expect(highlightB).toHaveText('73')
  })

  test('Final Verification Scenario: Ani and Belgaum exact test case', async ({
    page,
  }) => {
    await page.locator('#toolbar-diff').click()
    await expect(page.locator('#compare-workbench')).toBeVisible()

    const editorA = page.locator('#compare-json-a-editor')
    const editorB = page.locator('#compare-json-b-editor')

    const inputA = JSON.stringify(
      {
        age: 77,
        name: 'Ani',
        address: {
          city: 'Belgaum',
        },
      },
      null,
      2
    )

    const inputB = JSON.stringify(
      {
        age: 73,
        name: 'Ani',
        address: {
          city: 'Belgaum',
        },
      },
      null,
      2
    )

    await editorA.fill(inputA)
    await editorB.fill(inputB)

    // Expected result:
    // - "Found 1 difference"
    // - "Unequal values (1)"
    const summary = page.locator('#diff-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Found 1 difference')
    await expect(summary).toContainText('Unequal values (1)')

    const paneA = page.locator('#compare-json-a-pane')
    const paneB = page.locator('#compare-json-b-pane')

    // - The age value/line is visibly highlighted on the LEFT.
    const highlightA = paneA.locator('[data-testid="diff-highlight-changed"]')
    await expect(highlightA).toHaveCount(1)
    await expect(highlightA).toHaveText('77')

    // - The age value/line is visibly highlighted on the RIGHT.
    const highlightB = paneB.locator('[data-testid="diff-highlight-changed"]')
    await expect(highlightB).toHaveCount(1)
    await expect(highlightB).toHaveText('73')

    // - name remains unhighlighted.
    // - address remains unhighlighted.
    // Verify no other highlights exist in either pane
    await expect(paneA.locator('[data-testid^="diff-highlight-"]')).toHaveCount(
      1
    )
    await expect(paneB.locator('[data-testid^="diff-highlight-"]')).toHaveCount(
      1
    )
  })
})
