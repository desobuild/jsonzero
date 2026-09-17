import { describe, it, expect } from 'vitest'
import { computeStructureStatistics, getJsonType } from '@/lib/json/statistics'

describe('JSON Structure Statistics', () => {
  it('correctly identifies json types', () => {
    expect(getJsonType({})).toBe('object')
    expect(getJsonType([])).toBe('array')
    expect(getJsonType('hello')).toBe('string')
    expect(getJsonType(42)).toBe('number')
    expect(getJsonType(true)).toBe('boolean')
    expect(getJsonType(null)).toBe('null')
  })

  it('computes stats for empty object', () => {
    const stats = computeStructureStatistics({})
    expect(stats.rootType).toBe('object')
    expect(stats.objectCount).toBe(1)
    expect(stats.arrayCount).toBe(0)
    expect(stats.keyCount).toBe(0)
    expect(stats.totalNodes).toBe(1)
    expect(stats.primitiveCount).toBe(0)
    expect(stats.maxDepth).toBe(1)
  })

  it('computes stats for empty array', () => {
    const stats = computeStructureStatistics([])
    expect(stats.rootType).toBe('array')
    expect(stats.objectCount).toBe(0)
    expect(stats.arrayCount).toBe(1)
    expect(stats.arrayItemCount).toBe(0)
    expect(stats.totalNodes).toBe(1)
    expect(stats.primitiveCount).toBe(0)
    expect(stats.maxDepth).toBe(1)
  })

  it('computes stats for primitive root', () => {
    const stats = computeStructureStatistics(42)
    expect(stats.rootType).toBe('number')
    expect(stats.numberCount).toBe(1)
    expect(stats.totalNodes).toBe(1)
    expect(stats.primitiveCount).toBe(1)
    expect(stats.maxDepth).toBe(1)
  })

  it('computes stats for complex nested document', () => {
    const doc = {
      customer: {
        id: 42,
        name: 'Alex',
        active: true,
        extra: null,
      },
      tags: ['qa', 'playwright'],
    }

    const stats = computeStructureStatistics(doc)
    expect(stats.rootType).toBe('object')
    // Objects: root, customer -> 2
    expect(stats.objectCount).toBe(2)
    // Arrays: tags -> 1
    expect(stats.arrayCount).toBe(1)
    // Keys: customer, tags (on root) + id, name, active, extra (on customer) -> 6
    expect(stats.keyCount).toBe(6)
    // Strings: 'Alex', 'qa', 'playwright' -> 3
    expect(stats.stringCount).toBe(3)
    // Numbers: 42 -> 1
    expect(stats.numberCount).toBe(1)
    // Booleans: true -> 1
    expect(stats.booleanCount).toBe(1)
    // Nulls: null -> 1
    expect(stats.nullCount).toBe(1)
    // Primitives: 3 + 1 + 1 + 1 = 6
    expect(stats.primitiveCount).toBe(6)
    // Array items: 2
    expect(stats.arrayItemCount).toBe(2)
    // Total nodes:
    // 1 (root) + customer (1 obj + 4 primitives = 5) + tags (1 arr + 2 primitives = 3) = 9
    expect(stats.totalNodes).toBe(9)
    // Depth: root (1) -> customer (2) -> id (3) -> maxDepth = 3
    expect(stats.maxDepth).toBe(3)
  })

  it('handles deeply nested structure depth accurately', () => {
    // a -> b -> c -> d -> 5: depth 5
    const deeplyNested = { a: { b: { c: { d: 5 } } } }
    const stats = computeStructureStatistics(deeplyNested)
    expect(stats.maxDepth).toBe(5)
    expect(stats.objectCount).toBe(4)
    expect(stats.numberCount).toBe(1)
  })
})
