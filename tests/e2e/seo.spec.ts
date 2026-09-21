import { test, expect } from '@playwright/test'

test.describe('SEO Foundation E2E Audit', () => {
  test('1. Head metadata: Title, Description, and Canonical URL', async ({
    page,
  }) => {
    await page.goto('/')

    // Exact Title
    await expect(page).toHaveTitle(
      'JSONZero — Privacy-First JSON Developer Workbench'
    )

    // Meta Description
    const metaDesc = page.locator('meta[name="description"]')
    await expect(metaDesc).toHaveAttribute(
      'content',
      'JSONZero is a privacy-first, client-side JSON developer workbench for formatting, validating, comparing, transforming and converting JSON directly in your browser.'
    )

    // Canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]')
    await expect(canonicalLink).toHaveCount(1)
    await expect(canonicalLink).toHaveAttribute(
      'href',
      'https://jsonzero.desobuild.workers.dev/'
    )
  })

  test('2. Open Graph Protocol metadata', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'JSONZero — Privacy-First JSON Developer Workbench'
    )
    await expect(
      page.locator('meta[property="og:description"]')
    ).toHaveAttribute(
      'content',
      'JSONZero is a privacy-first, client-side JSON developer workbench for formatting, validating, comparing, transforming and converting JSON directly in your browser.'
    )
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://jsonzero.desobuild.workers.dev/'
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website'
    )
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'JSONZero'
    )
  })

  test('3. Twitter / X Card metadata', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    )
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'JSONZero — Privacy-First JSON Developer Workbench'
    )
    await expect(
      page.locator('meta[name="twitter:description"]')
    ).toHaveAttribute(
      'content',
      'JSONZero is a privacy-first, client-side JSON developer workbench for formatting, validating, comparing, transforming and converting JSON directly in your browser.'
    )
  })

  test('4. WebApplication Structured Data (JSON-LD)', async ({ page }) => {
    await page.goto('/')

    const jsonLdLocator = page.locator('script[type="application/ld+json"]')
    await expect(jsonLdLocator).toHaveCount(1)

    const rawJson = await jsonLdLocator.textContent()
    expect(rawJson).toBeTruthy()

    const data = JSON.parse(rawJson!)
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('WebApplication')
    expect(data.name).toBe('JSONZero')
    expect(data.url).toBe('https://jsonzero.desobuild.workers.dev/')
    expect(data.description).toBe(
      'Privacy-first, client-side JSON developer workbench.'
    )
    expect(data.applicationCategory).toBe('DeveloperApplication')
    expect(data.operatingSystem).toBe('Any')
  })

  test('5. Crawlable Page Content is present and visible in rendered DOM', async ({
    page,
  }) => {
    await page.goto('/')

    // Section title
    await expect(
      page.getByText('JSONZero — Privacy-First JSON Developer Workbench')
    ).toBeVisible()

    // Privacy proposition
    await expect(
      page.getByText(
        'Your JSON stays in your browser. No accounts. No ads. No tracking.'
      )
    ).toBeVisible()

    // Core tool capabilities
    await expect(
      page.getByRole('heading', { name: 'JSON Formatter' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'JSON Validator' })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'JSON Diff' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'JSON Inspection' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'JSON Transformation' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'JSON Conversion' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Developer & Testing Tools' })
    ).toBeVisible()
  })

  test('6. Static routes: /robots.txt and /sitemap.xml are served properly', async ({
    request,
  }) => {
    // robots.txt
    const robotsRes = await request.get('/robots.txt')
    expect(robotsRes.status()).toBe(200)
    const robotsText = await robotsRes.text()
    expect(robotsText).toContain('User-agent: *')
    expect(robotsText).toContain('Allow: /')
    expect(robotsText).toContain(
      'Sitemap: https://jsonzero.desobuild.workers.dev/sitemap.xml'
    )

    // sitemap.xml
    const sitemapRes = await request.get('/sitemap.xml')
    expect(sitemapRes.status()).toBe(200)
    const sitemapText = await sitemapRes.text()
    expect(sitemapText).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    )
    expect(sitemapText).toContain(
      '<loc>https://jsonzero.desobuild.workers.dev/</loc>'
    )
  })

  test('7. Privacy validation: Zero external network requests on load and crawl', async ({
    page,
  }) => {
    const externalRequests: string[] = []

    page.on('request', (req) => {
      const url = req.url()
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('http://127.0.0.1')
      ) {
        externalRequests.push(url)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(externalRequests).toEqual([])
  })
})
