import { describe, it, expect } from 'vitest'
import { compareJson, getDiffValueType } from '@/lib/json/diff'

describe('Structural JSON Diff Engine', () => {
  describe('getDiffValueType', () => {
    it('correctly classifies all JSON value types including undefined', () => {
      expect(getDiffValueType(null)).toBe('null')
      expect(getDiffValueType('hello')).toBe('string')
      expect(getDiffValueType(42)).toBe('number')
      expect(getDiffValueType(true)).toBe('boolean')
      expect(getDiffValueType(false)).toBe('boolean')
      expect(getDiffValueType([])).toBe('array')
      expect(getDiffValueType([1, 2])).toBe('array')
      expect(getDiffValueType({})).toBe('object')
      expect(getDiffValueType({ a: 1 })).toBe('object')
      expect(getDiffValueType(undefined)).toBe('undefined')
    })
  })

  describe('Identical Documents', () => {
    it('reports identical for matching objects', () => {
      const a = { name: 'Alice', age: 30, active: true }
      const b = { name: 'Alice', age: 30, active: true }
      const result = compareJson(a, b)

      expect(result.summary.isIdentical).toBe(true)
      expect(result.summary.total).toBe(0)
      expect(result.entries).toHaveLength(0)
    })

    it('reports identical for matching arrays', () => {
      const a = [1, 'two', { three: 3 }]
      const b = [1, 'two', { three: 3 }]
      const result = compareJson(a, b)

      expect(result.summary.isIdentical).toBe(true)
      expect(result.summary.total).toBe(0)
      expect(result.entries).toHaveLength(0)
    })

    it('reports identical for identical primitives', () => {
      expect(compareJson(42, 42).summary.isIdentical).toBe(true)
      expect(compareJson('json', 'json').summary.isIdentical).toBe(true)
      expect(compareJson(true, true).summary.isIdentical).toBe(true)
      expect(compareJson(null, null).summary.isIdentical).toBe(true)
    })

    it('reports identical for empty objects and arrays', () => {
      expect(compareJson({}, {}).summary.isIdentical).toBe(true)
      expect(compareJson([], []).summary.isIdentical).toBe(true)
    })
  })

  describe('Object Key Ordering (MUST IGNORE)', () => {
    it('considers objects with different key order to be structurally identical', () => {
      const a = { name: 'Anirudh', age: 25 }
      const b = { age: 25, name: 'Anirudh' }
      const result = compareJson(a, b)

      expect(result.summary.isIdentical).toBe(true)
      expect(result.summary.total).toBe(0)
      expect(result.entries).toHaveLength(0)
    })

    it('handles nested objects with different key order at every level', () => {
      const a = {
        user: {
          profile: { firstName: 'Alice', lastName: 'Smith' },
          settings: { theme: 'dark', notifications: true },
        },
      }
      const b = {
        user: {
          settings: { notifications: true, theme: 'dark' },
          profile: { lastName: 'Smith', firstName: 'Alice' },
        },
      }
      const result = compareJson(a, b)

      expect(result.summary.isIdentical).toBe(true)
      expect(result.summary.total).toBe(0)
    })
  })

  describe('Added Values', () => {
    it('identifies top-level added property in object', () => {
      const a = { a: 1 }
      const b = { a: 1, b: 2 }
      const result = compareJson(a, b)

      expect(result.summary.added).toBe(1)
      expect(result.summary.removed).toBe(0)
      expect(result.summary.changed).toBe(0)
      expect(result.summary.total).toBe(1)
      expect(result.summary.isIdentical).toBe(false)

      expect(result.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'added',
          path: '$.b',
          key: 'b',
          newValue: 2,
          newType: 'number',
        })
      )
    })

    it('identifies nested added property', () => {
      const a = { user: { name: 'Alice' } }
      const b = { user: { name: 'Alice', email: 'alice@example.com' } }
      const result = compareJson(a, b)

      expect(result.summary.added).toBe(1)
      expect(result.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'added',
          path: '$.user.email',
          newValue: 'alice@example.com',
        })
      )
    })

    it('identifies added array element', () => {
      const a = [1, 2]
      const b = [1, 2, 3]
      const result = compareJson(a, b)

      expect(result.summary.added).toBe(1)
      expect(result.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'added',
          path: '$[2]',
          key: 2,
          newValue: 3,
        })
      )
    })
  })

  describe('Removed Values', () => {
    it('identifies top-level removed property in object', () => {
      const a = { a: 1, b: 2 }
      const b = { a: 1 }
      const result = compareJson(a, b)

      expect(result.summary.removed).toBe(1)
      expect(result.summary.added).toBe(0)
      expect(result.summary.changed).toBe(0)
      expect(result.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'removed',
          path: '$.b',
          key: 'b',
          oldValue: 2,
          oldType: 'number',
        })
      )
    })

    it('identifies nested removed property', () => {
      const a = { user: { name: 'Alice', phone: '+91...' } }
      const b = { user: { name: 'Alice' } }
      const result = compareJson(a, b)

      expect(result.summary.removed).toBe(1)
      expect(result.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'removed',
          path: '$.user.phone',
          oldValue: '+91...',
        })
      )
    })

    it('identifies removed array element', () => {
      const a = ['a', 'b', 'c']
      const b = ['a', 'b']
      const result = compareJson(a, b)

      expect(result.summary.removed).toBe(1)
      expect(result.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'removed',
          path: '$[2]',
          key: 2,
          oldValue: 'c',
        })
      )
    })
  })

  describe('Changed Values', () => {
    it('identifies changed primitive values', () => {
      const a = { name: 'Alice', age: 25, active: true, notes: null }
      const b = { name: 'Bob', age: 26, active: false, notes: 'present' }
      const result = compareJson(a, b)

      expect(result.summary.changed).toBe(4)
      expect(result.summary.total).toBe(4)

      const paths = result.entries.map((e) => e.path)
      expect(paths).toContain('$.name')
      expect(paths).toContain('$.age')
      expect(paths).toContain('$.active')
      expect(paths).toContain('$.notes')

      const nameChange = result.entries.find((e) => e.path === '$.name')
      expect(nameChange?.oldValue).toBe('Alice')
      expect(nameChange?.newValue).toBe('Bob')
    })

    it('identifies type changes correctly as changed', () => {
      // 1 -> "1"
      const res1 = compareJson({ v: 1 }, { v: '1' })
      expect(res1.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'changed',
          path: '$.v',
          oldValue: 1,
          newValue: '1',
          oldType: 'number',
          newType: 'string',
        })
      )

      // false -> null
      const res2 = compareJson({ v: false }, { v: null })
      expect(res2.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'changed',
          path: '$.v',
          oldValue: false,
          newValue: null,
          oldType: 'boolean',
          newType: 'null',
        })
      )

      // [] -> {}
      const res3 = compareJson({ v: [] }, { v: {} })
      expect(res3.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'changed',
          path: '$.v',
          oldValue: [],
          newValue: {},
          oldType: 'array',
          newType: 'object',
        })
      )
    })
  })

  describe('Arrays (Order-sensitive)', () => {
    it('treats reordered array elements as changed', () => {
      const a = ['a', 'b', 'c']
      const b = ['a', 'c', 'b']
      const result = compareJson(a, b)

      expect(result.summary.isIdentical).toBe(false)
      expect(result.summary.changed).toBe(2)
      expect(result.entries[0]).toEqual(
        expect.objectContaining({
          kind: 'changed',
          path: '$[1]',
          oldValue: 'b',
          newValue: 'c',
        })
      )
      expect(result.entries[1]).toEqual(
        expect.objectContaining({
          kind: 'changed',
          path: '$[2]',
          oldValue: 'c',
          newValue: 'b',
        })
      )
    })

    it('handles arrays of nested objects', () => {
      const a = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ]
      const b = [
        { id: 1, name: 'First (Updated)' },
        { id: 2, name: 'Second' },
      ]
      const result = compareJson(a, b)

      expect(result.summary.changed).toBe(1)
      expect(result.entries[0].path).toBe('$[0].name')
      expect(result.entries[0].oldValue).toBe('First')
      expect(result.entries[0].newValue).toBe('First (Updated)')
    })
  })

  describe('Special Keys and Escaping', () => {
    it('handles keys with special characters, dots, and spaces correctly', () => {
      const a = {
        'first-name': 'Alice',
        'user.email': 'alice@old.com',
        'spaced key': 10,
      }
      const b = {
        'first-name': 'Bob',
        'user.email': 'alice@new.com',
        'spaced key': 20,
      }
      const result = compareJson(a, b)

      expect(result.summary.changed).toBe(3)
      const paths = result.entries.map((e) => e.path)
      expect(paths).toContain('$["first-name"]')
      expect(paths).toContain('$["user.email"]')
      expect(paths).toContain('$["spaced key"]')
    })
  })

  describe('Root Values', () => {
    it('handles primitive roots correctly', () => {
      expect(compareJson(42, 42).summary.isIdentical).toBe(true)

      const numDiff = compareJson(42, 43)
      expect(numDiff.summary.changed).toBe(1)
      expect(numDiff.entries[0].path).toBe('$')
      expect(numDiff.entries[0].oldValue).toBe(42)
      expect(numDiff.entries[0].newValue).toBe(43)

      const typeDiff = compareJson(null, {})
      expect(typeDiff.summary.changed).toBe(1)
      expect(typeDiff.entries[0].path).toBe('$')
      expect(typeDiff.entries[0].oldValue).toBe(null)
      expect(typeDiff.entries[0].newValue).toEqual({})
    })
  })

  describe('Summary Metrics Calculation', () => {
    it('produces exact deterministic summary counts', () => {
      const a = {
        unchangedProp: 100,
        changedProp: 'old',
        removedProp: true,
        nested: {
          removedSub: 1,
        },
      }
      const b = {
        unchangedProp: 100,
        changedProp: 'new',
        addedProp: 'brand-new',
        nested: {
          addedSub: 2,
        },
      }
      const result = compareJson(a, b)

      expect(result.summary.added).toBe(2) // addedProp, nested.addedSub
      expect(result.summary.removed).toBe(2) // removedProp, nested.removedSub
      expect(result.summary.changed).toBe(1) // changedProp
      expect(result.summary.total).toBe(5)
      expect(result.summary.isIdentical).toBe(false)
    })
  })
})
