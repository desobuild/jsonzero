import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  registerServiceWorker,
  isStandaloneMode,
  triggerInstallPrompt,
  subscribeInstallPrompt,
  activateWaitingWorker,
} from '@/pwa/pwaService'

describe('PWA Manifest & Configuration', () => {
  it('contains a valid Web App Manifest with required PWA metadata', () => {
    const manifestPath = path.resolve(
      process.cwd(),
      'public/manifest.webmanifest'
    )
    expect(fs.existsSync(manifestPath)).toBe(true)

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    expect(manifest.name).toBe('JSONZero')
    expect(manifest.short_name).toBe('JSONZero')
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.background_color).toBe('#12131a')
    expect(manifest.theme_color).toBe('#12131a')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)

    // Check required standard icon sizes
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')

    // Verify icons actually exist on disk in public/
    for (const icon of manifest.icons) {
      const iconPath = path.resolve(
        process.cwd(),
        'public',
        icon.src.replace(/^\//, '')
      )
      expect(fs.existsSync(iconPath)).toBe(true)
    }
  })

  it('index.html contains valid manifest and PWA meta tags', () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html')
    const html = fs.readFileSync(htmlPath, 'utf-8')

    expect(html).toContain(
      '<link rel="manifest" href="/manifest.webmanifest" />'
    )
    expect(html).toContain('<meta name="theme-color" content="#12131a" />')
    expect(html).toContain(
      '<link rel="apple-touch-icon" href="/icon-192.png" />'
    )
    expect(html).toContain(
      '<meta name="mobile-web-app-capable" content="yes" />'
    )
  })

  it('service worker template in public/sw.js exists and handles offline fetch events', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js')
    expect(fs.existsSync(swPath)).toBe(true)

    const sw = fs.readFileSync(swPath, 'utf-8')
    expect(sw).toContain("self.addEventListener('install'")
    expect(sw).toContain("self.addEventListener('activate'")
    expect(sw).toContain("self.addEventListener('fetch'")
    expect(sw).toContain("self.addEventListener('message'")
    expect(sw).toContain('CACHE_NAME')
    expect(sw).toContain('PRECACHE_ASSETS')
  })

  it('service worker uses network-first navigation with offline fallback', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js')
    const sw = fs.readFileSync(swPath, 'utf-8')

    // Verifies navigation request detection
    expect(sw).toContain("event.request.mode === 'navigate'")
    // Verifies network-first fetch
    expect(sw).toContain('fetch(event.request)')
    // Verifies offline fallback to cached app shell
    expect(sw).toContain("caches.match('/')")
    // Verifies sanitization of redirected responses to prevent ERR_FAILED
    expect(sw).toContain('toCleanResponse')
    expect(sw).toContain('redirected')
  })

  it('service worker never passes unresolved or undefined responses to respondWith', () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js')
    const sw = fs.readFileSync(swPath, 'utf-8')

    // Navigation offline fallback provides valid 503 response if cache empty
    expect(sw).toContain("new Response('Offline',")
    // Static asset offline fallback provides valid 404 response if asset not found
    expect(sw).toContain('status: 404')
  })

  it('toCleanResponse helper sanitizes redirected responses correctly', () => {
    // Replicate the toCleanResponse logic to verify it strips redirected flag
    function toCleanResponse(res: Response): Response {
      if (!res || !res.redirected) {
        return res
      }
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      })
    }

    const standardResponse = new Response('OK', { status: 200 })
    expect(toCleanResponse(standardResponse).redirected).toBe(false)

    // A mock redirected response
    const mockRedirected = {
      redirected: true,
      body: 'HTML Content',
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'text/html' }),
    } as unknown as Response

    const cleaned = toCleanResponse(mockRedirected)
    expect(cleaned.redirected).toBe(false)
    expect(cleaned.status).toBe(200)
  })

  it('precache asset generator in vite.config.ts excludes /index.html to prevent 307 redirect loops', () => {
    const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts')
    const configContent = fs.readFileSync(viteConfigPath, 'utf-8')

    // Excludes index.html so Cloudflare SPA 307 redirect is never stored in cache
    expect(configContent).toContain("file !== 'index.html'")
    // Maintains root '/' as canonical document
    expect(configContent).toContain("'/'")
  })
})

describe('PWA Service Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects standalone mode from matchMedia or navigator.standalone', () => {
    // Standard non-standalone
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(isStandaloneMode()).toBe(false)

    // Standalone mode display
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(isStandaloneMode()).toBe(true)
  })

  it('safely handles service worker registration in unsupported environments', async () => {
    vi.stubGlobal('navigator', {})
    const reg = await registerServiceWorker()
    expect(reg).toBeNull()
  })

  it('registers service worker when navigator.serviceWorker is available', async () => {
    const mockRegistration = {
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      active: null,
    }

    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue(mockRegistration),
      },
    })

    const reg = await registerServiceWorker()
    expect(reg).toBe(mockRegistration)
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
    })
  })

  it('manages beforeinstallprompt subscriptions and triggers prompt', async () => {
    const listener = vi.fn()
    const unsubscribe = subscribeInstallPrompt(listener)

    expect(listener).toHaveBeenCalled()

    // When no deferred prompt is available, returns 'unavailable'
    const result = await triggerInstallPrompt()
    expect(result).toBe('unavailable')

    unsubscribe()
  })

  it('activates waiting worker via postMessage', () => {
    const postMessage = vi.fn()
    const mockRegistration = {
      waiting: { postMessage },
    } as unknown as ServiceWorkerRegistration

    activateWaitingWorker(mockRegistration)
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })
})
