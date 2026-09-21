import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { WorkbenchOverview } from '@/features/formatter/components/WorkbenchOverview'

describe('SEO Foundation Unit & Static Analysis Tests', () => {
  const rootDir = process.cwd()
  const indexHtmlPath = path.resolve(rootDir, 'index.html')
  const robotsPath = path.resolve(rootDir, 'public/robots.txt')
  const sitemapPath = path.resolve(rootDir, 'public/sitemap.xml')

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')

  describe('1. Document Title & Description', () => {
    it('contains the descriptive page title', () => {
      expect(indexHtml).toContain(
        '<title>JSONZero — Privacy-First JSON Developer Workbench</title>'
      )
    })

    it('contains the concise meta description', () => {
      expect(indexHtml).toMatch(
        /<meta\s+name="description"\s+content="JSONZero is a privacy-first, client-side JSON developer workbench for formatting, validating, comparing, transforming and converting JSON directly in your browser."/
      )
    })
  })

  describe('2. Canonical URL', () => {
    it('contains exactly one canonical link pointing to production homepage', () => {
      const canonicalMatches = indexHtml.match(/<link\s+rel="canonical"[^>]*>/g)
      expect(canonicalMatches).toHaveLength(1)
      expect(canonicalMatches![0]).toBe(
        '<link rel="canonical" href="https://jsonzero.desobuild.workers.dev/" />'
      )
    })
  })

  describe('3. Open Graph Metadata', () => {
    it('defines og:title, og:description, og:url, og:type, and og:site_name', () => {
      expect(indexHtml).toMatch(
        /<meta\s+property="og:title"\s+content="JSONZero — Privacy-First JSON Developer Workbench"\s*\/>/
      )
      expect(indexHtml).toMatch(
        /<meta\s+property="og:description"\s+content="JSONZero is a privacy-first, client-side JSON developer workbench for formatting, validating, comparing, transforming and converting JSON directly in your browser."\s*\/>/
      )
      expect(indexHtml).toMatch(
        /<meta\s+property="og:url"\s+content="https:\/\/jsonzero\.desobuild\.workers\.dev\/"\s*\/>/
      )
      expect(indexHtml).toMatch(
        /<meta\s+property="og:type"\s+content="website"\s*\/>/
      )
      expect(indexHtml).toMatch(
        /<meta\s+property="og:site_name"\s+content="JSONZero"\s*\/>/
      )
    })
  })

  describe('4. Twitter / X Card Metadata', () => {
    it('defines twitter:card, twitter:title, and twitter:description without inventing fake images', () => {
      expect(indexHtml).toMatch(
        /<meta\s+name="twitter:card"\s+content="summary_large_image"\s*\/>/
      )
      expect(indexHtml).toMatch(
        /<meta\s+name="twitter:title"\s+content="JSONZero — Privacy-First JSON Developer Workbench"\s*\/>/
      )
      expect(indexHtml).toMatch(
        /<meta\s+name="twitter:description"\s+content="JSONZero is a privacy-first, client-side JSON developer workbench for formatting, validating, comparing, transforming and converting JSON directly in your browser."\s*\/>/
      )
      expect(indexHtml).not.toContain('twitter:image')
      expect(indexHtml).not.toContain('og:image')
    })
  })

  describe('5. WebApplication Structured Data (JSON-LD)', () => {
    it('contains valid Schema.org WebApplication JSON-LD script', () => {
      const jsonLdMatch = indexHtml.match(
        /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/
      )
      expect(jsonLdMatch).not.toBeNull()

      const parsed = JSON.parse(jsonLdMatch![1])
      expect(parsed['@context']).toBe('https://schema.org')
      expect(parsed['@type']).toBe('WebApplication')
      expect(parsed.name).toBe('JSONZero')
      expect(parsed.url).toBe('https://jsonzero.desobuild.workers.dev/')
      expect(parsed.description).toBe(
        'Privacy-first, client-side JSON developer workbench.'
      )
      expect(parsed.applicationCategory).toBe('DeveloperApplication')
      expect(parsed.operatingSystem).toBe('Any')

      // Ensure no fake ratings, pricing, reviews, or unverified claims
      expect(parsed.aggregateRating).toBeUndefined()
      expect(parsed.offers).toBeUndefined()
      expect(parsed.review).toBeUndefined()
    })
  })

  describe('6. robots.txt and sitemap.xml Static Files', () => {
    it('has public/robots.txt with public crawl permissions and canonical sitemap link', () => {
      expect(fs.existsSync(robotsPath)).toBe(true)
      const robotsContent = fs.readFileSync(robotsPath, 'utf-8')
      expect(robotsContent).toContain('User-agent: *')
      expect(robotsContent).toContain('Allow: /')
      expect(robotsContent).toContain(
        'Sitemap: https://jsonzero.desobuild.workers.dev/sitemap.xml'
      )
    })

    it('has public/sitemap.xml with canonical homepage', () => {
      expect(fs.existsSync(sitemapPath)).toBe(true)
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8')
      expect(sitemapContent).toContain(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
      )
      expect(sitemapContent).toContain(
        '<loc>https://jsonzero.desobuild.workers.dev/</loc>'
      )
    })
  })

  describe('7. Preserves Favicon, Icons and Privacy Architecture', () => {
    it('preserves existing favicon, touch icon, and webmanifest links', () => {
      expect(indexHtml).toContain(
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'
      )
      expect(indexHtml).toContain(
        '<link rel="apple-touch-icon" href="/icon-192.png" />'
      )
      expect(indexHtml).toContain(
        '<link rel="manifest" href="/manifest.webmanifest" />'
      )
    })

    it('contains ZERO external tracking scripts, CDNs, or telemetry in index.html', () => {
      expect(indexHtml).not.toContain('google-analytics')
      expect(indexHtml).not.toContain('googletagmanager')
      expect(indexHtml).not.toContain('hotjar')
      expect(indexHtml).not.toContain('cdnjs.cloudflare.com')
      expect(indexHtml).not.toContain('unpkg.com')
      expect(indexHtml).not.toContain('cdn.jsdelivr.net')
    })
  })

  describe('8. Crawlable Page Overview Component', () => {
    it('renders descriptive workbench information and capability list', () => {
      render(<WorkbenchOverview />)

      expect(
        screen.getByText('JSONZero — Privacy-First JSON Developer Workbench')
      ).toBeDefined()
      expect(
        screen.getByText(
          /Your JSON stays in your browser\. No accounts\. No ads\. No tracking\./i
        )
      ).toBeDefined()

      // Major capabilities
      expect(screen.getByText('JSON Formatter')).toBeDefined()
      expect(screen.getByText('JSON Validator')).toBeDefined()
      expect(screen.getByText('JSON Diff')).toBeDefined()
      expect(screen.getByText('JSON Inspection')).toBeDefined()
      expect(screen.getByText('JSON Transformation')).toBeDefined()
      expect(screen.getByText('JSON Conversion')).toBeDefined()
      expect(screen.getByText('Developer & Testing Tools')).toBeDefined()
    })
  })
})
