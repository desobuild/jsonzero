/**
 * JSONZero — Pure Mock JSON Generator Engine
 *
 * Generates deterministic mock JSON preserving inferred types and structure.
 * Zero external dependencies. Operates client-side only.
 */

export interface MockJsonOptions {
  stringValue?: 'string' | 'preserve'
  numberValue?: 'zero' | 'preserve'
  booleanValue?: 'true' | 'preserve'
  arrayStrategy?: 'single' | 'preserve'
}

export function generateMockJson(
  input: unknown,
  options: MockJsonOptions = {}
): unknown {
  const {
    stringValue = 'string',
    numberValue = 'zero',
    booleanValue = 'true',
    arrayStrategy = 'preserve',
  } = options

  function mockNode(val: unknown, key?: string): unknown {
    if (val === null) {
      return null
    }

    if (typeof val === 'string') {
      if (stringValue === 'preserve') return val
      return key ? `${key}_value` : 'string'
    }

    if (typeof val === 'number') {
      if (numberValue === 'preserve') return val
      return 0
    }

    if (typeof val === 'boolean') {
      if (booleanValue === 'preserve') return val
      return true
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return []
      if (arrayStrategy === 'single') {
        return [mockNode(val[0], key)]
      }
      return val.map((item) => mockNode(item, key))
    }

    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>
      const result: Record<string, unknown> = {}
      // Deterministic key traversal
      const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b))
      for (const k of keys) {
        result[k] = mockNode(obj[k], k)
      }
      return result
    }

    return val
  }

  return mockNode(input)
}
