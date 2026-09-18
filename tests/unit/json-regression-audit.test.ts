import { describe, it, expect } from 'vitest'
import {
  parseJSON,
  formatJSON,
  minifyJSON,
  validateJSON,
  computeJsonStats,
  countJsonKeys,
  evaluateJsonPath,
} from '@/lib/json'
import { compareJson } from '@/lib/json/diff'
import { sortKeys } from '@/lib/json/sort'
import { flattenJson, unflattenJson } from '@/lib/json/flatten'
import { generateAssertions } from '@/lib/json/assertions'
import { validateJsonSchema } from '@/lib/json/schema-validator'
import { generateMockJson } from '@/lib/json/mock'
import { processWorkerOperation } from '@/workers/json.worker'

describe('JSON Correctness Regression Audit (Section 7)', () => {
  describe('1. JSON Value Types and Boundaries', () => {
    const boundaryPrimitives = [
      { raw: 'null', parsed: null },
      { raw: 'true', parsed: true },
      { raw: 'false', parsed: false },
      { raw: '0', parsed: 0 },
      { raw: '-0', parsed: -0 },
      { raw: '-42', parsed: -42 },
      { raw: '3.1415926535', parsed: 3.1415926535 },
      { raw: '-0.000001', parsed: -0.000001 },
      { raw: '1e10', parsed: 1e10 },
      { raw: '""', parsed: '' },
      { raw: '"Hello World!"', parsed: 'Hello World!' },
      { raw: '"🔥 🚀 日本語 \u0041"', parsed: '🔥 🚀 日本語 A' },
      {
        raw: '"quote: \\" newline: \\n tab: \\t backslash: \\\\"',
        parsed: 'quote: " newline: \n tab: \t backslash: \\',
      },
    ]

    for (const item of boundaryPrimitives) {
      it(`parses, validates, and formats boundary primitive: ${item.raw}`, () => {
        const parsed = parseJSON(item.raw)
        expect(parsed.success).toBe(true)
        if (item.raw === '-0') {
          expect(parsed.data === 0 || Object.is(parsed.data, -0)).toBe(true)
        } else {
          expect(parsed.data).toEqual(item.parsed)
        }

        const validated = validateJSON(item.raw)
        expect(validated.valid).toBe(true)

        const formatted = formatJSON(item.raw)
        expect(formatted.success).toBe(true)
        if (item.raw !== '-0') {
          expect(JSON.parse(formatted.formatted!)).toEqual(item.parsed)
        }

        const minified = minifyJSON(item.raw)
        expect(minified.success).toBe(true)
      })
    }
  })

  describe('2. Structural Topologies and Edge Cases', () => {
    it('handles empty object and empty array correctly', () => {
      const objRes = formatJSON('{}')
      expect(objRes.success).toBe(true)
      expect(objRes.formatted).toBe('{}')

      const arrRes = formatJSON('[]')
      expect(arrRes.success).toBe(true)
      expect(arrRes.formatted).toBe('[]')

      expect(countJsonKeys({})).toBe(0)
      expect(countJsonKeys([])).toBe(0)
    })

    it('handles deeply nested object (25 levels) deterministically without stack overflow', () => {
      let current: Record<string, unknown> = { leaf: 'deep_value' }
      for (let i = 0; i < 25; i++) {
        current = { [`level_${i}`]: current }
      }
      const raw = JSON.stringify(current)

      const parsed = parseJSON(raw)
      expect(parsed.success).toBe(true)

      const formatted = formatJSON(raw)
      expect(formatted.success).toBe(true)
      expect(JSON.parse(formatted.formatted!)).toEqual(current)

      const stats = computeJsonStats(raw)
      expect(stats.keyCount).toBe(26)

      const sorted = sortKeys(current, { recursive: true })
      expect(sorted).toBeDefined()
    })

    it('handles deeply nested array (25 levels) deterministically', () => {
      let current: unknown[] = [42]
      for (let i = 0; i < 25; i++) {
        current = [current]
      }
      const raw = JSON.stringify(current)

      const parsed = parseJSON(raw)
      expect(parsed.success).toBe(true)
      expect(validateJSON(raw).valid).toBe(true)
    })

    it('handles mixed array and object nesting', () => {
      const mixed = {
        users: [
          {
            id: 1,
            tags: ['admin', 'staff', ['level1', 'level2']],
            profile: { active: true },
          },
          { id: 2, tags: [], profile: null },
        ],
        meta: { count: 2, flags: [false, true] },
      }
      const raw = JSON.stringify(mixed)
      expect(parseJSON(raw).success).toBe(true)
      expect(validateJSON(raw).valid).toBe(true)
      expect(formatJSON(raw).success).toBe(true)
    })

    it('handles root primitive, root array, and root object across all tools', () => {
      const rootNum = '12345'
      const rootArr = '[1, 2, 3, "test"]'
      const rootObj = '{"test": true}'

      expect(formatJSON(rootNum).success).toBe(true)
      expect(formatJSON(rootArr).success).toBe(true)
      expect(formatJSON(rootObj).success).toBe(true)

      expect(minifyJSON(rootNum).minified).toBe('12345')
      expect(minifyJSON(rootArr).minified).toBe('[1,2,3,"test"]')
      expect(minifyJSON(rootObj).minified).toBe('{"test":true}')
    })
  })

  describe('3. Object Key Variations and Edge Cases', () => {
    const exoticObject = {
      '': 'empty_key',
      'key with spaces': 'spaces',
      'key.with.dots': 'dots',
      'key[0].nested[1]': 'brackets',
      'key/with/slashes': 'slashes',
      'key\\with\\backslashes': 'backslashes',
      '!@#$%^&*()_+-=[]{}|;:,.<>?': 'punctuation',
      日本語キー: 'unicode_key',
      '🔥': 'emoji_key',
      null: 'string_null_key',
      true: 'string_true_key',
    }

    const exoticRaw = JSON.stringify(exoticObject)

    it('parses, validates, formats and computes stats for exotic keys', () => {
      const parsed = parseJSON(exoticRaw)
      expect(parsed.success).toBe(true)
      expect(parsed.data).toEqual(exoticObject)

      const validated = validateJSON(exoticRaw)
      expect(validated.valid).toBe(true)

      const formatted = formatJSON(exoticRaw)
      expect(formatted.success).toBe(true)
      expect(JSON.parse(formatted.formatted!)).toEqual(exoticObject)

      const stats = computeJsonStats(exoticRaw)
      expect(stats.keyCount).toBe(Object.keys(exoticObject).length)
    })

    it('sorts keys with exotic characters accurately', () => {
      const sorted = sortKeys(exoticObject, { recursive: true }) as Record<
        string,
        unknown
      >
      expect(Object.keys(sorted)).toEqual(Object.keys(exoticObject).sort())
    })

    it('flattens and unflattens exotic keys safely', () => {
      const flattened = flattenJson(exoticObject)
      expect(flattened).toBeDefined()
      const unflattened = unflattenJson(flattened)
      expect(unflattened.success).toBe(true)
    })

    it('evaluates JSONPath on exotic keys safely without eval()', () => {
      const res = evaluateJsonPath(exoticObject, '$.*')
      expect(res.results.length).toBeGreaterThan(0)
    })
  })

  describe('4. Tools Integration Regression with Edge Cases', () => {
    it('compares identical documents with exotic values as structurally identical', () => {
      const docA = { a: 1, b: [null, false, '🔥'], c: { 'x.y': 3.14 } }
      const docB = { c: { 'x.y': 3.14 }, b: [null, false, '🔥'], a: 1 }
      const diff = compareJson(docA, docB)
      expect(diff.summary.isIdentical).toBe(true)
      expect(diff.summary.total).toBe(0)
    })

    it('generates assertions for mixed edge-case data safely', () => {
      const data = {
        id: 101,
        active: true,
        value: null,
        tags: ['a', 'b'],
        'x.y': 42,
      }
      const assertions = generateAssertions(data, { style: 'playwright' })
      expect(assertions.items.length).toBeGreaterThan(0)
      expect(assertions.code).toContain('101')
    })

    it('validates schema and generates mocks for exotic edge structures', () => {
      const schema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          count: { type: 'number', minimum: 0 },
          active: { type: 'boolean' },
          metadata: { type: 'null' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'count', 'active'],
      }
      const validDoc = {
        title: 'Test',
        count: 5,
        active: true,
        metadata: null,
        tags: ['alpha'],
      }
      const validation = validateJsonSchema(validDoc, schema)
      expect(validation.valid).toBe(true)

      const mock = generateMockJson(validDoc)
      expect(mock).toBeDefined()
      expect(typeof (mock as { title: string }).title).toBe('string')
    })
  })

  describe('5. Web Worker Dispatcher Edge-Case & Large Payload Boundary', () => {
    it('routes format, minify, validate, statistics through processWorkerOperation synchronously', () => {
      const sample = '{"hello":"world","numbers":[1,2,3]}'

      const formatRes = processWorkerOperation('format', {
        json: sample,
        indent: 2,
      })
      expect(formatRes.success).toBe(true)

      const minifyRes = processWorkerOperation('minify', { json: sample })
      expect(minifyRes.success).toBe(true)
      expect(minifyRes.minified).toBe('{"hello":"world","numbers":[1,2,3]}')

      const validateRes = processWorkerOperation('validate', { json: sample })
      expect(validateRes.valid).toBe(true)

      const statsRes = processWorkerOperation('statistics', { json: sample })
      expect(statsRes.keyCount).toBe(2)
    })

    it('safely catches errors and returns structured failures in worker operations', () => {
      const badJson = '{"broken": '

      const formatRes = processWorkerOperation('format', {
        json: badJson,
        indent: 2,
      })
      expect(formatRes.success).toBe(false)
      expect(formatRes.error).toBeDefined()

      const minifyRes = processWorkerOperation('minify', { json: badJson })
      expect(minifyRes.success).toBe(false)
      expect(minifyRes.error).toBeDefined()

      const validateRes = processWorkerOperation('validate', { json: badJson })
      expect(validateRes.valid).toBe(false)
      expect(validateRes.errors.length).toBeGreaterThan(0)
    })

    it('processes a 250KB payload through worker dispatcher without degradation', () => {
      const largeArray = Array.from({ length: 2500 }, (_, i) => ({
        id: i,
        uuid: `0000-abcd-${i}`,
        active: i % 2 === 0,
        score: i * 1.5,
        notes: `Sample entry description for index ${i}`,
      }))
      const largeJson = JSON.stringify(largeArray)
      expect(largeJson.length).toBeGreaterThan(200 * 1024) // > 200KB

      const formatRes = processWorkerOperation('format', {
        json: largeJson,
        indent: 2,
      })
      expect(formatRes.success).toBe(true)
      expect(formatRes.formatted).toBeDefined()

      const minifyRes = processWorkerOperation('minify', { json: largeJson })
      expect(minifyRes.success).toBe(true)
      expect(minifyRes.minified).toBe(largeJson)
    })
  })
})
