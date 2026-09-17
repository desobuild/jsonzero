import { describe, it, expect } from 'vitest'
import {
  generateAssertions,
  generateDiffAssertions,
  formatJsAccessor,
} from '@/lib/json/assertions'
import { compareJson } from '@/lib/json/diff'

describe('Assertions Generator Engine', () => {
  describe('formatJsAccessor helper', () => {
    it('handles standard identifier keys', () => {
      expect(formatJsAccessor('response', ['user', 'name'])).toBe(
        'response.user.name'
      )
    })

    it('handles keys with special characters, dots, and hyphens safely', () => {
      expect(formatJsAccessor('response', ['first-name'])).toBe(
        'response["first-name"]'
      )
      expect(formatJsAccessor('response', ['user.address'])).toBe(
        'response["user.address"]'
      )
      expect(formatJsAccessor('response', ['hello"world'])).toBe(
        'response["hello\\"world"]'
      )
    })

    it('handles array index segments', () => {
      expect(formatJsAccessor('body', ['users', 0, 'id'])).toBe(
        'body.users[0].id'
      )
    })
  })

  describe('Generic assertion style', () => {
    it('generates generic assertions with types, values, and existence', () => {
      const data = {
        id: 42,
        name: 'Anirudh',
        active: true,
        score: null,
      }

      const res = generateAssertions(data, { style: 'generic' })
      expect(res.style).toBe('generic')
      expect(res.items.some((i) => i.code === 'ASSERT $.id EXISTS')).toBe(true)
      expect(res.items.some((i) => i.code === 'ASSERT $.id TYPE number')).toBe(
        true
      )
      expect(res.items.some((i) => i.code === 'ASSERT $.id EQUALS 42')).toBe(
        true
      )
      expect(
        res.items.some((i) => i.code === 'ASSERT $.name EQUALS "Anirudh"')
      ).toBe(true)
      expect(
        res.items.some((i) => i.code === 'ASSERT $.active EQUALS true')
      ).toBe(true)
      expect(
        res.items.some((i) => i.code === 'ASSERT $.score EQUALS null')
      ).toBe(true)
    })
  })

  describe('API assertion style', () => {
    it('generates TypeScript expect assertions for objects and primitives', () => {
      const data = {
        id: 42,
        name: 'Anirudh',
        active: true,
      }

      const res = generateAssertions(data, {
        style: 'api',
        responseVariable: 'res',
      })

      expect(res.style).toBe('api')
      expect(res.code).toContain('// API Assertions')
      expect(
        res.items.some((i) => i.code === 'expect(res.id).toBeDefined();')
      ).toBe(true)
      expect(
        res.items.some(
          (i) => i.code === "expect(typeof res.id).toBe('number');"
        )
      ).toBe(true)
      expect(res.items.some((i) => i.code === 'expect(res.id).toBe(42);')).toBe(
        true
      )
    })

    it('handles arrays and respect maxArrayItems sampling limit', () => {
      const data = {
        tags: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      }

      const res = generateAssertions(data, {
        style: 'api',
        includeArrayLength: true,
        maxArrayItems: 3,
      })

      expect(
        res.items.some(
          (i) => i.code === 'expect(response.tags).toHaveLength(10);'
        )
      ).toBe(true)
      // Check that only 3 sample items are traversed
      expect(
        res.items.some((i) => i.code === 'expect(response.tags[0]).toBe(1);')
      ).toBe(true)
      expect(
        res.items.some((i) => i.code === 'expect(response.tags[2]).toBe(3);')
      ).toBe(true)
      expect(
        res.items.some((i) => i.code === 'expect(response.tags[3]).toBe(4);')
      ).toBe(false)
    })
  })

  describe('Playwright assertion style', () => {
    it('generates Playwright boilerplate, status check, and body assertions', () => {
      const data = {
        status: 'ok',
        count: 5,
      }

      const res = generateAssertions(data, {
        style: 'playwright',
        responseVariable: 'body',
      })

      expect(res.style).toBe('playwright')
      expect(res.code).toContain('// Playwright API Test')
      expect(res.code).toContain(
        "const response = await request.get('<YOUR_ENDPOINT>');"
      )
      expect(res.code).toContain('expect(response.ok()).toBeTruthy();')
      expect(res.code).toContain('const body = await response.json();')
      expect(
        res.items.some((i) => i.code === 'expect(body.status).toBe("ok");')
      ).toBe(true)
    })
  })

  describe('Diff to Assertions workflow', () => {
    it('generates targeted assertions for modified or removed expected fields', () => {
      const expected = {
        id: 42,
        active: true,
        user: { role: 'admin' },
      }
      const actual = {
        id: 41,
        active: false,
        user: { role: 'guest' },
      }

      const diff = compareJson(expected, actual)
      expect(diff.summary.changed).toBe(3)

      const diffAssertions = generateDiffAssertions(diff, expected, {
        style: 'api',
        responseVariable: 'body',
      })

      expect(
        diffAssertions.items.some((i) => i.code === 'expect(body.id).toBe(42);')
      ).toBe(true)
      expect(
        diffAssertions.items.some(
          (i) => i.code === 'expect(body.active).toBe(true);'
        )
      ).toBe(true)
      expect(
        diffAssertions.items.some(
          (i) => i.code === 'expect(body.user.role).toBe("admin");'
        )
      ).toBe(true)
    })

    it('generates full assertions if expected and actual are identical', () => {
      const json = { a: 1, b: 2 }
      const diff = compareJson(json, json)
      expect(diff.summary.isIdentical).toBe(true)

      const diffAssertions = generateDiffAssertions(diff, json, {
        style: 'generic',
      })
      expect(diffAssertions.items.length).toBeGreaterThan(0)
      expect(
        diffAssertions.items.some((i) => i.code === 'ASSERT $.a EQUALS 1')
      ).toBe(true)
    })
  })

  describe('Determinism', () => {
    it('produces identical output regardless of object key order', () => {
      const data1 = { b: 2, a: 1, c: { y: 20, x: 10 } }
      const data2 = { a: 1, c: { x: 10, y: 20 }, b: 2 }

      const res1 = generateAssertions(data1, { style: 'api' })
      const res2 = generateAssertions(data2, { style: 'api' })

      expect(res1.code).toBe(res2.code)
    })
  })
})
