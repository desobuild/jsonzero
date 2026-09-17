import { describe, it, expect } from 'vitest'
import { sortKeys, sortKeysRecursive } from '@/lib/json/sort'

describe('Sort Keys & Recursive Sort', () => {
  it('sorts top-level keys alphabetically (shallow)', () => {
    const input = {
      zebra: 1,
      apple: 2,
      middle: 3,
    }
    const result = sortKeys(input)
    expect(Object.keys(result as object)).toEqual(['apple', 'middle', 'zebra'])
    expect(result).toEqual({
      apple: 2,
      middle: 3,
      zebra: 1,
    })
  })

  it('shallow sort does not reorder nested object keys', () => {
    const input = {
      z: { b: 1, a: 2 },
      a: { d: 4, c: 3 },
    }
    const result = sortKeys(input, { recursive: false }) as Record<
      string,
      Record<string, number>
    >
    expect(Object.keys(result)).toEqual(['a', 'z'])
    expect(Object.keys(result.z)).toEqual(['b', 'a']) // inner preserved
    expect(Object.keys(result.a)).toEqual(['d', 'c']) // inner preserved
  })

  it('sorts recursively through nested objects', () => {
    const input = {
      z: {
        b: 1,
        a: 2,
      },
      a: {
        d: 4,
        c: 3,
      },
    }
    const result = sortKeysRecursive(input) as Record<
      string,
      Record<string, number>
    >
    expect(Object.keys(result)).toEqual(['a', 'z'])
    expect(Object.keys(result.a)).toEqual(['c', 'd'])
    expect(Object.keys(result.z)).toEqual(['a', 'b'])
    expect(result).toEqual({
      a: {
        c: 3,
        d: 4,
      },
      z: {
        a: 2,
        b: 1,
      },
    })
  })

  it('preserves array element ordering strictly', () => {
    const input = [3, 1, 2]
    const result = sortKeysRecursive(input)
    expect(result).toEqual([3, 1, 2])
  })

  it('recursively sorts objects inside arrays while preserving array order', () => {
    const input = [
      { z: 1, a: 2 },
      { y: 3, b: 4 },
    ]
    const result = sortKeysRecursive(input) as Record<string, number>[]
    expect(result.length).toBe(2)
    expect(Object.keys(result[0])).toEqual(['a', 'z'])
    expect(Object.keys(result[1])).toEqual(['b', 'y'])
    expect(result).toEqual([
      { a: 2, z: 1 },
      { b: 4, y: 3 },
    ])
  })

  it('handles primitive root values gracefully', () => {
    expect(sortKeys(42)).toBe(42)
    expect(sortKeysRecursive('hello')).toBe('hello')
    expect(sortKeys(true)).toBe(true)
    expect(sortKeys(null)).toBe(null)
  })

  it('handles empty containers', () => {
    expect(sortKeys({})).toEqual({})
    expect(sortKeys([])).toEqual([])
    expect(sortKeysRecursive({ a: {}, b: [] })).toEqual({ a: {}, b: [] })
    expect(sortKeysRecursive([{}, []])).toEqual([{}, []])
  })

  it('is deterministic on complex mixed hierarchies', () => {
    const input = {
      meta: {
        version: 1,
        author: {
          name: 'Alice',
          contact: { phone: '123', email: 'a@b.com' },
        },
      },
      data: [
        { tags: ['c', 'a', 'b'], id: 2 },
        { tags: ['z'], id: 1 },
      ],
    }
    const result = sortKeysRecursive(input)
    const json1 = JSON.stringify(result)
    const json2 = JSON.stringify(sortKeysRecursive(input))
    expect(json1).toBe(json2)
    // Verify author contact has email before phone
    const typed = result as typeof input
    expect(Object.keys(typed.meta.author.contact)).toEqual(['email', 'phone'])
    // Verify tags array order preserved
    expect(typed.data[0].tags).toEqual(['c', 'a', 'b'])
  })
})
