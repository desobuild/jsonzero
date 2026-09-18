/**
 * JSONZero — Deterministic Benchmark Data Generators
 *
 * Generates reproducible synthetic JSON datasets without external network calls,
 * APIs, or uncontrolled randomness.
 */

// Simple deterministic pseudo-random number generator (LCG)
export function createDeterministicRandom(seed: number = 42) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/**
 * Generate a deeply nested object: { "level": { "level": { ... } } }
 */
export function generateDeepObject(depth: number): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  let current = root
  for (let i = 1; i <= depth; i++) {
    if (i === depth) {
      current.value = `leaf-level-${i}`
      current.depth = i
      current.active = true
    } else {
      const next: Record<string, unknown> = { depth: i }
      current.level = next
      current = next
    }
  }
  return root
}

/**
 * Generate a wide object with many sibling properties
 */
export function generateWideObject(
  keyCount: number
): Record<string, string | number | boolean | null> {
  const obj: Record<string, string | number | boolean | null> = {}
  for (let i = 0; i < keyCount; i++) {
    const key = `property_${i.toString().padStart(5, '0')}`
    const mod = i % 4
    if (mod === 0) obj[key] = `value-string-${i}`
    else if (mod === 1) obj[key] = i * 1.5
    else if (mod === 2) obj[key] = i % 2 === 0
    else obj[key] = null
  }
  return obj
}

/**
 * Generate a large uniform array with multiple objects
 */
export function generateLargeArray(
  itemCount: number
): Array<Record<string, unknown>> {
  const arr: Array<Record<string, unknown>> = []
  for (let i = 0; i < itemCount; i++) {
    arr.push({
      id: i + 1,
      guid: `item-${(i + 1).toString().padStart(6, '0')}`,
      name: `Entity Name ${i + 1}`,
      score: (i * 37) % 1000,
      isActive: i % 3 === 0,
      tags: [`tag-${i % 5}`, `group-${i % 10}`],
      meta: {
        createdAt: `2026-01-${((i % 28) + 1).toString().padStart(2, '0')}`,
        priority: (i % 4) + 1,
      },
    })
  }
  return arr
}

/**
 * Generate a heterogeneous array where objects have differing fields
 */
export function generateHeterogeneousArray(
  itemCount: number
): Array<Record<string, unknown>> {
  const arr: Array<Record<string, unknown>> = []
  for (let i = 0; i < itemCount; i++) {
    const typeIndex = i % 4
    if (typeIndex === 0) {
      arr.push({
        id: i,
        type: 'user',
        username: `user_${i}`,
        email: `user_${i}@example.com`,
        roles: ['viewer', 'editor'],
      })
    } else if (typeIndex === 1) {
      arr.push({
        id: i,
        type: 'order',
        orderNumber: `ORD-${i}`,
        total: (i * 12.5).toFixed(2),
        currency: 'USD',
        isShipped: i % 2 === 0,
      })
    } else if (typeIndex === 2) {
      arr.push({
        id: i,
        type: 'log',
        timestamp: Date.UTC(2026, 0, 1) + i * 1000,
        level: i % 5 === 0 ? 'ERROR' : 'INFO',
        message: `System event recorded for index ${i}`,
      })
    } else {
      arr.push({
        id: i,
        type: 'setting',
        configKey: `feature_flag_${i}`,
        enabled: i % 2 === 1,
        threshold: (i % 50) / 100,
      })
    }
  }
  return arr
}

/**
 * Generate a mixed hierarchical structure (nested objects, arrays, primitives)
 */
export function generateMixedStructure(branchCount: number = 20): {
  project: string
  version: string
  branches: Array<{
    id: number
    name: string
    active: boolean
    items: Array<{ key: string; val: number }>
    nested: Record<string, unknown>
  }>
} {
  const branches = []
  for (let b = 0; b < branchCount; b++) {
    const items = []
    for (let j = 0; j < 10; j++) {
      items.push({
        key: `branch-${b}-item-${j}`,
        val: b * 10 + j,
      })
    }
    branches.push({
      id: b + 1,
      name: `Branch ${b + 1}`,
      active: b % 2 === 0,
      items,
      nested: {
        depth1: {
          depth2: {
            leaf: `leaf-${b}`,
            count: items.length,
          },
        },
      },
    })
  }

  return {
    project: 'JSONZero-Benchmark',
    version: '1.0.0',
    branches,
  }
}

export type BenchmarkScale =
  'small' | 'medium' | 'large' | 'veryLarge' | 'stress'

/**
 * Deterministically generate JSON string approximating target byte sizes:
 * - small: ~1 KB
 * - medium: ~100 KB
 * - large: ~1 MB
 * - veryLarge: ~5 MB
 * - stress: ~10 MB+
 */
export function generateDatasetByScale(scale: BenchmarkScale): string {
  switch (scale) {
    case 'small': {
      // ~1 KB
      return JSON.stringify(generateLargeArray(6), null, 2)
    }
    case 'medium': {
      // ~100 KB
      return JSON.stringify(generateLargeArray(520), null, 2)
    }
    case 'large': {
      // ~1 MB
      return JSON.stringify(generateLargeArray(5300), null, 2)
    }
    case 'veryLarge': {
      // ~5 MB
      return JSON.stringify(generateLargeArray(27000), null, 2)
    }
    case 'stress': {
      // ~10 MB
      return JSON.stringify(generateLargeArray(54000), null, 2)
    }
  }
}

/**
 * Compute the approximate byte length of a string in UTF-8
 */
export function getUtf8ByteSize(str: string): number {
  return new TextEncoder().encode(str).length
}
