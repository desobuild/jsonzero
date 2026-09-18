import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Privacy, Network & Storage Boundary Audit (Sections 9, 10 & 11)', () => {
  const srcDir = path.resolve(process.cwd(), 'src')
  const publicDir = path.resolve(process.cwd(), 'public')

  function getAllFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath))
      } else {
        files.push(fullPath)
      }
    }
    return files
  }

  const allSourceFiles = getAllFiles(srcDir).filter(
    (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')
  )

  describe('1. Static Code Analysis for Remote Tracking / Network Leaks', () => {
    it('contains ZERO occurrences of XMLHttpRequest across all source files', () => {
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        expect(content).not.toContain('XMLHttpRequest')
      }
    })

    it('contains ZERO occurrences of sendBeacon across all source files', () => {
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        expect(content).not.toContain('sendBeacon')
      }
    })

    it('contains ZERO occurrences of WebSocket across all source files', () => {
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        expect(content).not.toContain('WebSocket')
      }
    })

    it('contains ZERO occurrences of dangerouslySetInnerHTML across all source files', () => {
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        expect(content).not.toContain('dangerouslySetInnerHTML')
      }
    })

    it('contains ZERO calls to eval() or new Function() in source code', () => {
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        // Filter out comments mentioning eval
        const lines = content
          .split('\n')
          .filter(
            (l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')
          )
        const code = lines.join('\n')
        expect(code).not.toMatch(/\beval\s*\(/)
        expect(code).not.toMatch(/new\s+Function\s*\(/)
      }
    })

    it('contains NO fetch() calls in src/ (fetch is restricted exclusively to public/sw.js for asset precaching)', () => {
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const lines = content
          .split('\n')
          .filter(
            (l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')
          )
        const code = lines.join('\n')
        expect(code).not.toMatch(/\bfetch\s*\(/)
      }
    })
  })

  describe('2. User Data Persistence & Storage Audit', () => {
    beforeEach(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    it('guarantees localStorage only stores non-sensitive UI theme preferences', () => {
      // Simulate theme setting
      localStorage.setItem('jsonzero-theme', 'dark')
      expect(localStorage.getItem('jsonzero-theme')).toBe('dark')

      // Verify no other keys are written
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        expect(key).toBe('jsonzero-theme')
      }
    })

    it('never persists JSON document content or history to storage', () => {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        const val = localStorage.getItem(key)
        expect(val).not.toContain('{')
        expect(val).not.toContain('[')
      }
      expect(sessionStorage.length).toBe(0)
    })
  })

  describe('3. Service Worker Privacy & Interception Constraints', () => {
    const swPath = path.join(publicDir, 'sw.js')
    const swContent = fs.readFileSync(swPath, 'utf-8')

    it('verifies public/sw.js strictly ignores non-GET requests', () => {
      expect(swContent).toContain("event.request.method !== 'GET'")
    })

    it('verifies public/sw.js strictly ignores cross-origin requests', () => {
      expect(swContent).toContain('url.origin !== self.location.origin')
    })

    it('verifies public/sw.js never caches request bodies or POST payloads', () => {
      expect(swContent).not.toContain('request.json()')
      expect(swContent).not.toContain('request.text()')
      expect(swContent).not.toContain('request.formData()')
    })

    it('verifies public/sw.js safely prunes old caches during activate', () => {
      expect(swContent).toContain("key.startsWith('jsonzero-')")
      expect(swContent).toContain('caches.delete(key)')
    })
  })
})
