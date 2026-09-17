/**
 * JSONZero — Pure JSON Sorting Utilities
 *
 * Provides deterministic alphabetical object-key sorting (shallow and recursive).
 * - Sort object keys lexicographically ascending.
 * - For recursive sort: nested objects are recursively sorted.
 * - Array ordering is strictly preserved.
 * - Objects inside arrays are recursively sorted when recursive is true.
 * - Primitive values and empty containers are preserved.
 */

export interface SortOptions {
  recursive?: boolean
}

/**
 * Sorts object keys alphabetically in lexicographical order.
 * If recursive is true, recursively sorts nested objects.
 * Array element order is always preserved.
 */
export function sortKeys(value: unknown, options: SortOptions = {}): unknown {
  const { recursive = false } = options

  // Handle null or non-object primitives
  if (value === null || typeof value !== 'object') {
    return value
  }

  // Handle arrays: preserve element ordering, but recurse into elements if requested
  if (Array.isArray(value)) {
    if (!recursive) {
      return value
    }
    return value.map((item) => sortKeys(item, { recursive: true }))
  }

  // Handle objects: sort keys lexicographically ascending
  const record = value as Record<string, unknown>
  const sortedKeys = Object.keys(record).sort((a, b) => {
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })

  const result: Record<string, unknown> = {}
  for (const key of sortedKeys) {
    result[key] = recursive
      ? sortKeys(record[key], { recursive: true })
      : record[key]
  }

  return result
}

/**
 * Convenience function for deep/recursive key sorting.
 */
export function sortKeysRecursive(value: unknown): unknown {
  return sortKeys(value, { recursive: true })
}
