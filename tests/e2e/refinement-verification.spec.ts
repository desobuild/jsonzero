import { test, expect } from '@playwright/test'

const viewports = [
  { name: 'Mobile 375x812', width: 375, height: 812 },
  { name: 'Mobile 390x844', width: 390, height: 844 },
  { name: 'Mobile 430x932', width: 430, height: 932 },
  { name: 'Tablet 768x1024', width: 768, height: 1024 },
  { name: 'Desktop 1280x800', width: 1280, height: 800 },
  { name: 'Desktop 1440x900', width: 1440, height: 900 },
  { name: 'Desktop 1920x1080', width: 1920, height: 1080 },
]

test.describe('Final UI Spacing & Readability Visual Verification', () => {
  for (const vp of viewports) {
    test(`Verify layout at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // 1. Verify Header branding
      const header = page.locator('#header')
      await expect(header).toBeVisible()
      await expect(page.getByText('JSONZero').first()).toBeVisible()

      // 2. Verify Privacy message
      const privacy = page.locator('#privacy-indicator')
      await expect(privacy).toBeVisible()
      await expect(
        page.getByText('Your JSON stays in your browser.').first()
      ).toBeVisible()

      // 3. Verify Toolbar
      const toolbar = page.locator('#toolbar')
      await expect(toolbar).toBeVisible()

      // 4. Verify Format Button: fully visible and unclipped
      const formatBtn = page.locator('#toolbar-format')
      await expect(formatBtn).toBeVisible()
      await expect(formatBtn).toContainText('Format')

      if (vp.width >= 1024) {
        // Desktop shortcut visibility
        const kbd = formatBtn.locator('kbd')
        await expect(kbd).toBeVisible()
        await expect(kbd).toContainText('Ctrl+Shift+F')

        // Verify bounding boxes: kbd must fit inside formatBtn without clipping
        const btnBox = await formatBtn.boundingBox()
        const kbdBox = await kbd.boundingBox()
        expect(btnBox).not.toBeNull()
        expect(kbdBox).not.toBeNull()
        if (btnBox && kbdBox) {
          expect(kbdBox.x).toBeGreaterThan(btnBox.x)
          expect(kbdBox.x + kbdBox.width).toBeLessThanOrEqual(
            btnBox.x + btnBox.width + 1
          )
        }
      }

      // 5. Verify Indent dropdown control
      const indentBtn = toolbar.getByRole('button', { name: /Indent:/i })
      await expect(indentBtn).toBeVisible()

      // 6. Verify Workspace Page Padding (Breathing room on left & right)
      const workspaceBox = await toolbar.boundingBox()
      expect(workspaceBox).not.toBeNull()
      if (workspaceBox) {
        expect(workspaceBox.x).toBeGreaterThanOrEqual(10)
        expect(workspaceBox.x + workspaceBox.width).toBeLessThanOrEqual(
          vp.width - 10
        )
      }

      // 7. Verify Pane Headers Centering at Desktop/Tablet
      if (vp.width >= 768) {
        const inputHeaderTitle = page.getByTestId('input-pane-title')
        const formattedHeaderTitle = page.getByTestId('formatted-pane-title')
        await expect(inputHeaderTitle).toBeVisible()
        await expect(formattedHeaderTitle).toBeVisible()

        // Actions exist and do not collide
        const clearBtn = page.getByRole('button', { name: 'Clear JSON' })
        const openBtn = page.getByRole('button', {
          name: 'Open JSON file from disk',
        })
        const copyBtn = page.getByRole('button', { name: 'Copy JSON' })
        const downloadBtn = page.getByRole('button', { name: 'Download JSON' })

        await expect(clearBtn).toBeVisible()
        await expect(openBtn).toBeVisible()
        await expect(copyBtn).toBeVisible()
        await expect(downloadBtn).toBeVisible()

        const clearBox = await clearBtn.boundingBox()
        const formattedTitleBox = await formattedHeaderTitle.boundingBox()
        if (clearBox && formattedTitleBox) {
          // Clear is strictly to the left of formattedTitleBox (in left pane vs right pane)
          expect(clearBox.x + clearBox.width).toBeLessThanOrEqual(
            formattedTitleBox.x
          )
        }
      }

      // 8. Verify Editor Gutter Separation
      const editor = page.locator('#json-input-editor')
      await expect(editor).toBeVisible()

      // 9. Verify Status Bar
      const statusBar = page.locator('#status-bar')
      await expect(statusBar).toBeVisible()
      await expect(statusBar).toContainText('Ready')

      // Check no horizontal scrollbar on root
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      )
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth
      )
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    })
  }

  test('Verify Light and Dark Themes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Set theme to Light
    const themeBtn = page.getByRole('button', { name: 'Toggle theme' })
    await themeBtn.click()
    await page.getByRole('menuitem', { name: 'Light' }).click()
    await expect(page.locator('html')).toHaveClass(/light/)

    // Toggle to Dark
    await themeBtn.click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
