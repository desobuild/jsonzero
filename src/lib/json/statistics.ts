/**
 * JSONZero — JSON Structure Statistics
 *
 * Deterministically computes comprehensive structural metrics for any parsed JSON document.
 * Handles objects, arrays, deep nesting, empty structures, and primitive roots.
 */

export interface JsonStructureStatistics {
  rootType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  keyCount: number
  objectCount: number
  arrayCount: number
  stringCount: number
  numberCount: number
  booleanCount: number
  nullCount: number
  primitiveCount: number
  totalNodes: number
  maxDepth: number
  arrayItemCount: number
}

/**
 * Returns the exact JSON type of any value.
 */
export function getJsonType(
  value: unknown
): 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'object'
}

/**
 * Deterministically calculates all structural statistics for a JSON document.
 */
export function computeStructureStatistics(
  data: unknown
): JsonStructureStatistics {
  const stats: JsonStructureStatistics = {
    rootType: getJsonType(data),
    keyCount: 0,
    objectCount: 0,
    arrayCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
    primitiveCount: 0,
    totalNodes: 0,
    maxDepth: 1,
    arrayItemCount: 0,
  }

  function traverse(value: unknown, depth: number) {
    stats.totalNodes++
    if (depth > stats.maxDepth) {
      stats.maxDepth = depth
    }

    if (value === null) {
      stats.nullCount++
      stats.primitiveCount++
      return
    }

    if (typeof value === 'string') {
      stats.stringCount++
      stats.primitiveCount++
      return
    }

    if (typeof value === 'number') {
      stats.numberCount++
      stats.primitiveCount++
      return
    }

    if (typeof value === 'boolean') {
      stats.booleanCount++
      stats.primitiveCount++
      return
    }

    if (Array.isArray(value)) {
      stats.arrayCount++
      stats.arrayItemCount += value.length
      for (let i = 0; i < value.length; i++) {
        traverse(value[i], depth + 1)
      }
      return
    }

    if (typeof value === 'object') {
      stats.objectCount++
      const keys = Object.keys(value as Record<string, unknown>)
      stats.keyCount += keys.length
      for (const k of keys) {
        traverse((value as Record<string, unknown>)[k], depth + 1)
      }
    }
  }

  traverse(data, 1)

  return stats
}
