import { test, expect } from '@playwright/test'

test.describe('JSONZero Search & Replace E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('search workflow: open with Ctrl+F -> query -> count -> navigate -> toggles -> close', async ({
    page,
  }) => {
    const inputEditor = page.locator('#json-input-editor')
    await expect(inputEditor).toBeVisible()
    await expect(inputEditor).toHaveValue(/CUS-1042/)

    // 1. Press Ctrl+F / Cmd+F to open search
    await page.keyboard.press('ControlOrMeta+f')

    const searchPanel = page.getByRole('search', {
      name: 'Editor Search and Replace',
    })
    await expect(searchPanel).toBeVisible()

    const searchInput = page.getByPlaceholder('Search JSON')
    await expect(searchInput).toBeFocused()

    // 2. Enter search query
    await searchInput.fill('id')

    // 3. Verify match count (sample JSON has 3 "id" occurrences: CUS-1042, ORD-1001, ORD-1002)
    await expect(searchPanel.getByText('1 of 3')).toBeVisible()

    // 4. Navigate next match via Enter
    await page.keyboard.press('Enter')
    await expect(searchPanel.getByText('2 of 3')).toBeVisible()

    // Navigate next match via Next button
    await page.getByRole('button', { name: 'Next match' }).click()
    await expect(searchPanel.getByText('3 of 3')).toBeVisible()

    // Navigate previous match via Shift+Enter inside search input
    await searchInput.focus()
    await page.keyboard.press('Shift+Enter')
    await expect(searchPanel.getByText('2 of 3')).toBeVisible()

    // Also test Previous match button
    await page.getByRole('button', { name: 'Previous match' }).click()
    await expect(searchPanel.getByText('1 of 3')).toBeVisible()

    // 5. Enable Match Case toggle
    await searchInput.fill('CUSTOMER')
    await expect(searchPanel.getByText('1 of 1')).toBeVisible()

    const matchCaseBtn = page.getByRole('button', { name: 'Match Case' })
    await matchCaseBtn.click()
    await expect(searchPanel.getByText('No results')).toBeVisible()

    // Reset Match Case
    await matchCaseBtn.click()
    await expect(searchPanel.getByText('1 of 1')).toBeVisible()

    // 6. Enable Whole Word toggle
    await searchInput.fill('cust')
    await expect(searchPanel.getByText('1 of 1')).toBeVisible()

    const wholeWordBtn = page.getByRole('button', { name: 'Whole Word' })
    await wholeWordBtn.click()
    // "cust" is not a whole word in "customer"
    await expect(searchPanel.getByText('No results')).toBeVisible()

    // 7. Close search via Escape
    await page.keyboard.press('Escape')
    await expect(searchPanel).not.toBeVisible()
  })

  test('replace workflow: open replace -> replace current -> replace all', async ({
    page,
  }) => {
    const inputEditor = page.locator('#json-input-editor')
    await expect(inputEditor).toBeVisible()

    // 1. Open Search & Replace via Ctrl+H / Cmd+H
    await page.keyboard.press('ControlOrMeta+h')

    const searchPanel = page.getByRole('search', {
      name: 'Editor Search and Replace',
    })
    await expect(searchPanel).toBeVisible()

    const replaceInput = page.getByPlaceholder('Replace with...')
    await expect(replaceInput).toBeVisible()

    const searchInput = page.getByPlaceholder('Search JSON')

    // 2. Enter search text and replacement
    await searchInput.fill('Morgan')
    await expect(searchPanel.getByText('1 of 1')).toBeVisible()

    await replaceInput.fill('Smith')

    // 3. Replace current
    await page.getByRole('button', { name: 'Replace', exact: true }).click()

    // Verify document changed
    await expect(inputEditor).toHaveValue(/Alex Smith/)
    await expect(inputEditor).not.toHaveValue(/Alex Morgan/)

    // 4. Test Replace All
    await searchInput.fill('ORD-')
    await replaceInput.fill('ORDER-')
    await expect(searchPanel.getByText(/of 2/)).toBeVisible()

    await page.getByRole('button', { name: 'Replace All' }).click()

    // Verify all matching text changed
    await expect(inputEditor).toHaveValue(/ORDER-1001/)
    await expect(inputEditor).toHaveValue(/ORDER-1002/)
    await expect(inputEditor).not.toHaveValue(/ORD-1001/)
  })

  test('toolbar Search button indicates active state and toggles panel', async ({
    page,
  }) => {
    const searchToolbarBtn = page.locator('#toolbar-search')
    await expect(searchToolbarBtn).toBeVisible()

    // Click toolbar button -> opens search
    await searchToolbarBtn.click()
    const searchPanel = page.getByRole('search', {
      name: 'Editor Search and Replace',
    })
    await expect(searchPanel).toBeVisible()

    // Toolbar button has active accent style
    await expect(searchToolbarBtn).toHaveClass(/text-accent/)

    // Click toolbar button again -> closes search
    await searchToolbarBtn.click()
    await expect(searchPanel).not.toBeVisible()
    await expect(searchToolbarBtn).not.toHaveClass(/text-accent/)
  })

  test('word wrap toggle switches visual wrapping without altering document text', async ({
    page,
  }) => {
    const inputEditor = page.locator('#json-input-editor')
    const originalText = await inputEditor.inputValue()

    const wrapBtn = page.getByRole('button', { name: 'Toggle Word Wrap' })
    await expect(wrapBtn).toBeVisible()

    // Toggle wrap ON
    await wrapBtn.click()
    await expect(inputEditor).toHaveClass(/whitespace-pre-wrap/)
    expect(await inputEditor.inputValue()).toBe(originalText)

    // Toggle wrap OFF
    await wrapBtn.click()
    await expect(inputEditor).toHaveClass(/whitespace-pre/)
    expect(await inputEditor.inputValue()).toBe(originalText)
  })
})
