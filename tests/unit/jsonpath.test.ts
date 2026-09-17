import { describe, it, expect } from 'vitest'
import { evaluateJsonPath, parseJsonPath } from '@/lib/json/jsonpath'

describe('JSONPath query evaluator', () => {
  const sampleData = {
    customer: {
      id: 'CUS-1042',
      name: 'Alex Morgan',
      active: true,
      profile: {
        country: 'India',
      },
      'special-key': 'val1',
    },
    orders: [
      { id: 'ORD-1001', status: 'completed', total: 1499, priority: true },
      { id: 'ORD-1002', status: 'processing', total: 2499, priority: false },
      { id: 'ORD-1003', status: 'completed', total: 999, priority: false },
    ],
    tags: ['qa', 'automation', 'playwright'],
    numbers: [10, 20, 30],
  }

  describe('syntax parsing', () => {
    it('rejects queries that do not start with $', () => {
      const res = parseJsonPath('customer.id')
      expect(res.error).toMatch(/must start with "\$"/)
    })

    it('rejects empty query', () => {
      const res = parseJsonPath('')
      expect(res.error).toMatch(/cannot be empty/)
    })

    it('rejects trailing dot', () => {
      const res = parseJsonPath('$.customer.')
      expect(res.error).toMatch(/trailing dot/)
    })

    it('rejects unclosed brackets', () => {
      const res = parseJsonPath('$.orders[0')
      expect(res.error).toMatch(/Unclosed bracket/)
    })
  })

  describe('property access', () => {
    it('evaluates root query $', () => {
      const res = evaluateJsonPath(sampleData, '$')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(1)
      expect(res.results[0].value).toBe(sampleData)
      expect(res.results[0].path).toBe('$')
    })

    it('evaluates single dot property', () => {
      const res = evaluateJsonPath(sampleData, '$.customer')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(1)
      expect(res.results[0].value).toBe(sampleData.customer)
      expect(res.results[0].path).toBe('$.customer')
    })

    it('evaluates nested dot properties', () => {
      const res = evaluateJsonPath(sampleData, '$.customer.name')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(1)
      expect(res.results[0].value).toBe('Alex Morgan')
      expect(res.results[0].path).toBe('$.customer.name')
    })

    it('evaluates bracket property access with single and double quotes', () => {
      const res1 = evaluateJsonPath(sampleData, '$["customer"]["special-key"]')
      expect(res1.success).toBe(true)
      expect(res1.results).toHaveLength(1)
      expect(res1.results[0].value).toBe('val1')
      expect(res1.results[0].path).toBe('$.customer["special-key"]')

      const res2 = evaluateJsonPath(sampleData, "$.customer['name']")
      expect(res2.success).toBe(true)
      expect(res2.results[0].value).toBe('Alex Morgan')
    })

    it('returns empty results for non-existent property without error', () => {
      const res = evaluateJsonPath(sampleData, '$.customer.nonExistent')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(0)
    })
  })

  describe('array indexing and wildcards', () => {
    it('evaluates positive array index', () => {
      const res = evaluateJsonPath(sampleData, '$.tags[1]')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(1)
      expect(res.results[0].value).toBe('automation')
      expect(res.results[0].path).toBe('$.tags[1]')
    })

    it('evaluates negative array index', () => {
      const res = evaluateJsonPath(sampleData, '$.tags[-1]')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(1)
      expect(res.results[0].value).toBe('playwright')
      expect(res.results[0].path).toBe('$.tags[2]')
    })

    it('evaluates array wildcard [*]', () => {
      const res = evaluateJsonPath(sampleData, '$.tags[*]')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(3)
      expect(res.results.map((r) => r.value)).toEqual([
        'qa',
        'automation',
        'playwright',
      ])
    })

    it('evaluates wildcard and chained property', () => {
      const res = evaluateJsonPath(sampleData, '$.orders[*].id')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(3)
      expect(res.results.map((r) => r.value)).toEqual([
        'ORD-1001',
        'ORD-1002',
        'ORD-1003',
      ])
      expect(res.results.map((r) => r.path)).toEqual([
        '$.orders[0].id',
        '$.orders[1].id',
        '$.orders[2].id',
      ])
    })
  })

  describe('filter expressions', () => {
    it('filters array of objects by equality', () => {
      const res = evaluateJsonPath(
        sampleData,
        '$.orders[?(@.status == "completed")]'
      )
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(2)
      expect(res.results.map((r) => (r.value as { id: string }).id)).toEqual([
        'ORD-1001',
        'ORD-1003',
      ])
    })

    it('filters array by numeric comparison', () => {
      const res = evaluateJsonPath(sampleData, '$.orders[?(@.total > 1000)]')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(2)
      expect(res.results.map((r) => (r.value as { id: string }).id)).toEqual([
        'ORD-1001',
        'ORD-1002',
      ])
    })

    it('filters by boolean truthiness', () => {
      const res = evaluateJsonPath(sampleData, '$.orders[?(@.priority)]')
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(1)
      expect(res.results[0].path).toBe('$.orders[0]')
    })

    it('handles filter chained with property access', () => {
      const res = evaluateJsonPath(
        sampleData,
        '$.orders[?(@.status == "processing")].total'
      )
      expect(res.success).toBe(true)
      expect(res.results).toHaveLength(1)
      expect(res.results[0].value).toBe(2499)
      expect(res.results[0].path).toBe('$.orders[1].total')
    })
  })

  describe('root primitives and edge cases', () => {
    it('evaluates query against primitive root value', () => {
      const res = evaluateJsonPath(42, '$')
      expect(res.success).toBe(true)
      expect(res.results[0].value).toBe(42)
    })

    it('evaluates query against array root value', () => {
      const res = evaluateJsonPath([1, 2, 3], '$[0]')
      expect(res.success).toBe(true)
      expect(res.results[0].value).toBe(1)
    })

    it('fails gracefully on malformed filter syntax', () => {
      const res = evaluateJsonPath(sampleData, '$.orders[?(@broken)]')
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })
  })
})
