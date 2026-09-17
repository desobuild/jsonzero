import { describe, it, expect } from 'vitest'
import {
  searchJsonTree,
  collectAncestorPaths,
  collectAllExpandablePaths,
  getValueType,
} from '@/features/inspector/utils'

describe('Inspector pure utilities', () => {
  const sampleData = {
    customer: {
      id: 'CUS-1042',
      name: 'Alex Morgan',
      active: true,
      profile: {
        country: 'India',
      },
    },
    orders: [
      { id: 'ORD-1001', status: 'completed', total: 1499 },
      { id: 'ORD-1002', status: 'processing', total: 2499 },
    ],
    tags: ['qa', 'playwright'],
  }

  describe('getValueType', () => {
    it('identifies types accurately', () => {
      expect(getValueType({})).toBe('object')
      expect(getValueType([])).toBe('array')
      expect(getValueType('hello')).toBe('string')
      expect(getValueType(42)).toBe('number')
      expect(getValueType(false)).toBe('boolean')
      expect(getValueType(null)).toBe('null')
    })
  })

  describe('searchJsonTree', () => {
    it('finds matches in keys', () => {
      const matches = searchJsonTree(sampleData, 'profile')
      expect(matches.length).toBeGreaterThanOrEqual(1)
      expect(matches.some((m) => m.path === '$.customer.profile')).toBe(true)
      expect(matches.some((m) => m.matchType === 'key')).toBe(true)
    })

    it('finds matches in primitive string values (case-insensitive)', () => {
      const matches = searchJsonTree(sampleData, 'alex')
      expect(matches).toHaveLength(1)
      expect(matches[0].path).toBe('$.customer.name')
      expect(matches[0].matchType).toBe('value')
      expect(matches[0].matchedText).toBe('Alex Morgan')
    })

    it('finds matches in numeric values', () => {
      const matches = searchJsonTree(sampleData, '1499')
      expect(matches).toHaveLength(1)
      expect(matches[0].path).toBe('$.orders[0].total')
    })

    it('finds matches in boolean values', () => {
      const matches = searchJsonTree(sampleData, 'true')
      expect(matches).toHaveLength(1)
      expect(matches[0].path).toBe('$.customer.active')
    })

    it('returns empty array when query is whitespace or not found', () => {
      expect(searchJsonTree(sampleData, '')).toEqual([])
      expect(searchJsonTree(sampleData, '   ')).toEqual([])
      expect(searchJsonTree(sampleData, 'non-existent-token-xyz')).toEqual([])
    })
  })

  describe('collectAncestorPaths', () => {
    it('computes progressive ancestor paths for dot and bracket paths', () => {
      const ancestors = collectAncestorPaths([
        '$.customer.profile.country',
        '$.orders[1].status',
      ])
      expect(ancestors.has('$')).toBe(true)
      expect(ancestors.has('$.customer')).toBe(true)
      expect(ancestors.has('$.customer.profile')).toBe(true)
      expect(ancestors.has('$.customer.profile.country')).toBe(true)
      expect(ancestors.has('$.orders')).toBe(true)
      expect(ancestors.has('$.orders[1]')).toBe(true)
    })
  })

  describe('collectAllExpandablePaths', () => {
    it('finds all object and array paths', () => {
      const paths = collectAllExpandablePaths(sampleData)
      expect(paths.has('$')).toBe(true)
      expect(paths.has('$.customer')).toBe(true)
      expect(paths.has('$.customer.profile')).toBe(true)
      expect(paths.has('$.orders')).toBe(true)
      expect(paths.has('$.orders[0]')).toBe(true)
      expect(paths.has('$.orders[1]')).toBe(true)
      expect(paths.has('$.tags')).toBe(true)
      // Leaf primitives must not be included
      expect(paths.has('$.customer.name')).toBe(false)
    })
  })
})
