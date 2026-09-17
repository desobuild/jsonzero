import { describe, it, expect } from 'vitest'
import {
  flattenJson,
  unflattenJson,
  parseFlattenedPath,
  formatSegmentsToPath,
  escapeKeySegment,
} from '@/lib/json/flatten'

describe('Flatten and Unflatten', () => {
  describe('Path segment parsing and formatting', () => {
    it('escapes and unescapes dots, brackets, and backslashes', () => {
      const rawKey = 'user.name[test]\\demo'
      const escaped = escapeKeySegment(rawKey)
      expect(escaped).toBe('user\\.name\\[test\\]\\\\demo')

      const segments = parseFlattenedPath(escaped)
      expect(segments).toEqual([{ type: 'prop', key: rawKey }])
    })

    it('parses standard dot paths', () => {
      expect(parseFlattenedPath('user.name')).toEqual([
        { type: 'prop', key: 'user' },
        { type: 'prop', key: 'name' },
      ])
    })

    it('parses array indices', () => {
      expect(parseFlattenedPath('users[0].name')).toEqual([
        { type: 'prop', key: 'users' },
        { type: 'index', index: 0 },
        { type: 'prop', key: 'name' },
      ])
      expect(parseFlattenedPath('matrix[0][1]')).toEqual([
        { type: 'prop', key: 'matrix' },
        { type: 'index', index: 0 },
        { type: 'index', index: 1 },
      ])
    })

    it('formats segments into path consistently', () => {
      expect(
        formatSegmentsToPath([
          { type: 'prop', key: 'users' },
          { type: 'index', index: 0 },
          { type: 'prop', key: 'profile' },
        ])
      ).toBe('users[0].profile')
    })
  })

  describe('Flattening', () => {
    it('flattens nested objects', () => {
      const input = {
        user: {
          name: 'Alice',
          age: 25,
        },
      }
      expect(flattenJson(input)).toEqual({
        'user.name': 'Alice',
        'user.age': 25,
      })
    })

    it('flattens arrays of objects', () => {
      const input = {
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      }
      expect(flattenJson(input)).toEqual({
        'users[0].name': 'Alice',
        'users[1].name': 'Bob',
      })
    })

    it('flattens nested arrays', () => {
      const input = {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      }
      expect(flattenJson(input)).toEqual({
        'matrix[0][0]': 1,
        'matrix[0][1]': 2,
        'matrix[1][0]': 3,
        'matrix[1][1]': 4,
      })
    })

    it('preserves empty containers without dropping them', () => {
      expect(flattenJson({ config: {} })).toEqual({ config: {} })
      expect(flattenJson({ items: [] })).toEqual({ items: [] })
      expect(flattenJson([{}])).toEqual({ '[0]': {} })
      expect(flattenJson([[]])).toEqual({ '[0]': [] })
      expect(flattenJson({})).toEqual({})
      expect(flattenJson([])).toEqual([])
    })

    it('preserves primitive roots and null values', () => {
      expect(flattenJson(42)).toBe(42)
      expect(flattenJson('test')).toBe('test')
      expect(flattenJson(true)).toBe(true)
      expect(flattenJson(null)).toBe(null)
      expect(flattenJson({ a: null, b: false })).toEqual({
        a: null,
        b: false,
      })
    })

    it('escapes keys containing literal dots', () => {
      const input = {
        'user.name': 'Alice',
      }
      expect(flattenJson(input)).toEqual({
        'user\\.name': 'Alice',
      })
    })

    it('escapes keys containing brackets', () => {
      const input = {
        'user[0]': 'Alice',
      }
      expect(flattenJson(input)).toEqual({
        'user\\[0\\]': 'Alice',
      })
    })
  })

  describe('Unflattening', () => {
    it('unflattens dot paths to nested objects', () => {
      const input = {
        'user.name': 'Alice',
        'user.age': 25,
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(true)
      expect(res.data).toEqual({
        user: {
          name: 'Alice',
          age: 25,
        },
      })
    })

    it('unflattens array indexing notation to arrays', () => {
      const input = {
        'users[0].name': 'Alice',
        'users[1].name': 'Bob',
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(true)
      expect(res.data).toEqual({
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      })
    })

    it('unflattens escaped keys preserving literal special characters', () => {
      const input = {
        'user\\.name': 'Alice',
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(true)
      expect(res.data).toEqual({
        'user.name': 'Alice',
      })
    })

    it('unflattens root arrays', () => {
      const input = {
        '[0].name': 'Alice',
        '[1].name': 'Bob',
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(true)
      expect(res.data).toEqual([{ name: 'Alice' }, { name: 'Bob' }])
    })

    it('handles primitive roots and empty containers', () => {
      expect(unflattenJson(42)).toEqual({ success: true, data: 42 })
      expect(unflattenJson('str')).toEqual({ success: true, data: 'str' })
      expect(unflattenJson({})).toEqual({ success: true, data: {} })
      expect(unflattenJson([])).toEqual({ success: true, data: [] })
    })
  })

  describe('Collision Handling', () => {
    it('detects primitive vs container collision', () => {
      const input = {
        'a.b': 1,
        'a.b.c': 2,
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Path collision')
      expect(res.error).toContain('a.b.c')
    })

    it('detects object vs array container collision', () => {
      const input = {
        'a[0]': 1,
        'a.b': 2,
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Path collision')
    })

    it('detects pre-nested structures colliding with flat keys', () => {
      const input = {
        'a.b': 1,
        a: { b: 2 },
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Path collision')
      expect(res.error).toContain(
        'The input contains both a literal key and a nested path'
      )
    })

    it('detects conflicting root types (both array and object at root)', () => {
      const input = {
        '[0]': 'first',
        key: 'second',
      }
      const res = unflattenJson(input)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Conflicting root types')
    })
  })

  describe('Round Trips', () => {
    const roundTripTest = (val: unknown) => {
      const flattened = flattenJson(val)
      const unflattened = unflattenJson(flattened)
      expect(unflattened.success).toBe(true)
      expect(unflattened.data).toEqual(val)
    }

    it('round trips complex nested objects and arrays', () => {
      roundTripTest({
        user: {
          id: 101,
          profile: {
            name: 'Alice',
            scores: [95, 88, 100],
          },
          active: true,
          bio: null,
        },
        settings: {
          theme: 'dark',
          notifications: {
            email: true,
            sms: false,
          },
        },
      })
    })

    it('round trips empty containers', () => {
      roundTripTest({
        emptyObj: {},
        emptyArr: [],
        nested: {
          arr: [{}],
          obj: { arr: [] },
        },
      })
    })

    it('round trips keys with special characters (. and [ and ])', () => {
      roundTripTest({
        'dotted.key': {
          'another.sub.key': 'val',
        },
        'bracket[key]': 123,
      })
    })
  })
})
