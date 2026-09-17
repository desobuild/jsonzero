/**
 * JSONZero — Pure JSON Flatten & Unflatten Utilities
 *
 * Flattening notation:
 * - Nested object properties are dot-separated: `user.name`
 * - Array elements use bracket index notation: `users[0].name`, `items[0]`
 * - Special characters in object keys (`.`, `[`, `]`, `\`) are escaped with a backslash
 *   (e.g., `"user.name"` -> `"user\\.name"`, `"item[0]"` -> `"item\\[0\\]"`)
 * - Empty containers (`{}`, `[]`) are preserved as leaf values
 * - Primitive roots return their original values
 * - Unflattening includes strict collision detection against ambiguous keys
 */

export interface UnflattenResult {
  success: boolean
  data?: unknown
  error?: string
}

export type PathSegment =
  { type: 'prop'; key: string } | { type: 'index'; index: number }

/**
 * Escapes special characters (`.`, `[`, `]`, `\`) in an object key segment.
 */
export function escapeKeySegment(key: string): string {
  return key
    .replace(/\\/g, '\\\\')
    .replace(/\./g, '\\.')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

/**
 * Parses a flattened path string into structured segments while respecting escape sequences.
 */
export function parseFlattenedPath(path: string): PathSegment[] {
  const segments: PathSegment[] = []
  let currentKey = ''
  let inEscape = false
  let i = 0

  while (i < path.length) {
    const char = path[i]

    if (inEscape) {
      currentKey += char
      inEscape = false
      i++
      continue
    }

    if (char === '\\') {
      inEscape = true
      i++
      continue
    }

    if (char === '.') {
      if (currentKey.length > 0) {
        segments.push({ type: 'prop', key: currentKey })
        currentKey = ''
      }
      i++
      continue
    }

    if (char === '[') {
      if (currentKey.length > 0) {
        segments.push({ type: 'prop', key: currentKey })
        currentKey = ''
      }

      // Read until matching ']'
      let closeIdx = i + 1
      let bracketEscape = false
      let indexContent = ''

      while (closeIdx < path.length) {
        const bChar = path[closeIdx]
        if (bracketEscape) {
          indexContent += bChar
          bracketEscape = false
          closeIdx++
          continue
        }
        if (bChar === '\\') {
          bracketEscape = true
          closeIdx++
          continue
        }
        if (bChar === ']') {
          break
        }
        indexContent += bChar
        closeIdx++
      }

      // Check if indexContent is a valid integer
      if (/^\d+$/.test(indexContent)) {
        segments.push({ type: 'index', index: parseInt(indexContent, 10) })
        i = closeIdx + 1
        continue
      } else {
        // Not a pure numeric index; treat as literal property key
        currentKey = `[${indexContent}]`
        i = closeIdx + 1
        continue
      }
    }

    currentKey += char
    i++
  }

  if (currentKey.length > 0) {
    segments.push({ type: 'prop', key: currentKey })
  }

  return segments
}

/**
 * Formats an array of PathSegments into a flattened path string.
 */
export function formatSegmentsToPath(segments: PathSegment[]): string {
  let result = ''
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (seg.type === 'index') {
      result += `[${seg.index}]`
    } else {
      const escaped = escapeKeySegment(seg.key)
      if (i === 0) {
        result += escaped
      } else {
        result += `.${escaped}`
      }
    }
  }
  return result
}

/**
 * Flattens a JSON structure into a single-depth key-value map.
 * Preserves empty containers and primitive roots.
 */
export function flattenJson(value: unknown): unknown {
  // Primitives and null return as-is
  if (value === null || typeof value !== 'object') {
    return value
  }

  // Root empty containers return as-is
  if (Array.isArray(value) && value.length === 0) {
    return []
  }
  if (!Array.isArray(value) && Object.keys(value).length === 0) {
    return {}
  }

  const result: Record<string, unknown> = {}

  function recurse(current: unknown, pathSegments: PathSegment[]) {
    if (current === null || typeof current !== 'object') {
      const pathStr = formatSegmentsToPath(pathSegments)
      result[pathStr] = current
      return
    }

    if (Array.isArray(current)) {
      if (current.length === 0) {
        const pathStr = formatSegmentsToPath(pathSegments)
        result[pathStr] = []
        return
      }

      for (let i = 0; i < current.length; i++) {
        recurse(current[i], [...pathSegments, { type: 'index', index: i }])
      }
      return
    }

    // Object
    const keys = Object.keys(current)
    if (keys.length === 0) {
      const pathStr = formatSegmentsToPath(pathSegments)
      result[pathStr] = {}
      return
    }

    for (const key of keys) {
      recurse((current as Record<string, unknown>)[key], [
        ...pathSegments,
        { type: 'prop', key },
      ])
    }
  }

  recurse(value, [])
  return result
}

/**
 * Unflattens a single-depth map into its reconstructed nested JSON structure.
 * Detects and prevents collisions without loss of user data.
 */
export function unflattenJson(value: unknown): UnflattenResult {
  // Primitives and null return directly
  if (value === null || typeof value !== 'object') {
    return { success: true, data: value }
  }

  // Empty arrays or objects return directly
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { success: true, data: [] }
    }
    // If it's already an array with elements, it is not a flat object; validate elements or return
    return { success: true, data: value }
  }

  const record = value as Record<string, unknown>
  const entries = Object.entries(record)

  if (entries.length === 0) {
    return { success: true, data: {} }
  }

  // Check if root should be an Array (every key starts with index segment) or an Object
  let isRootArray = false
  const parsedEntries: {
    segments: PathSegment[]
    val: unknown
    rawKey: string
  }[] = []

  for (const [key, val] of entries) {
    // If the input already contains non-empty nested objects/arrays as values alongside dot keys,
    // detect potential collision or nesting ambiguity
    if (
      val !== null &&
      typeof val === 'object' &&
      Object.keys(val).length > 0
    ) {
      return {
        success: false,
        error: `Unable to unflatten safely.\n\nPath collision:\n${key}\n\nThe input contains both a literal key and a nested path with the same representation.`,
      }
    }

    const segments = parseFlattenedPath(key)
    if (segments.length === 0) {
      continue
    }
    parsedEntries.push({ segments, val, rawKey: key })
  }

  if (parsedEntries.length === 0) {
    return { success: true, data: {} }
  }

  const firstSeg = parsedEntries[0].segments[0]
  if (firstSeg.type === 'index') {
    // Verify all keys start with index segment for root array
    for (const entry of parsedEntries) {
      if (entry.segments[0].type !== 'index') {
        return {
          success: false,
          error: `Unable to unflatten safely.\n\nPath collision:\n${entry.rawKey}\n\nConflicting root types: paths require both an Array and an Object at root.`,
        }
      }
    }
    isRootArray = true
  }

  const root = isRootArray ? [] : {}

  for (const entry of parsedEntries) {
    let current: Record<string, unknown> | unknown[] = root
    const { segments, val, rawKey } = entry

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const isLast = i === segments.length - 1

      if (isLast) {
        // Inserting leaf value
        if (seg.type === 'index') {
          if (!Array.isArray(current)) {
            return {
              success: false,
              error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nCannot set array index on an object node.`,
            }
          }
          if (current[seg.index] !== undefined) {
            return {
              success: false,
              error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nDuplicate leaf index detected at [${seg.index}].`,
            }
          }
          current[seg.index] = val
        } else {
          // Property
          if (Array.isArray(current)) {
            return {
              success: false,
              error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nCannot set property "${seg.key}" on an array node.`,
            }
          }
          if (current[seg.key] !== undefined) {
            return {
              success: false,
              error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nDuplicate property key detected at "${seg.key}".`,
            }
          }
          current[seg.key] = val
        }
      } else {
        // Intermediate container node
        const nextSeg = segments[i + 1]

        if (seg.type === 'index') {
          if (!Array.isArray(current)) {
            return {
              success: false,
              error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nExpected array container at index [${seg.index}].`,
            }
          }

          if (current[seg.index] === undefined) {
            current[seg.index] = nextSeg.type === 'index' ? [] : {}
          } else {
            // Node already exists; check compatibility
            const existing = current[seg.index]
            if (existing === null || typeof existing !== 'object') {
              return {
                success: false,
                error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nPath traverses through primitive value at index [${seg.index}].`,
              }
            }
            if (nextSeg.type === 'index' && !Array.isArray(existing)) {
              return {
                success: false,
                error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nConflicting container types at index [${seg.index}]: expected array, found object.`,
              }
            }
            if (nextSeg.type === 'prop' && Array.isArray(existing)) {
              return {
                success: false,
                error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nConflicting container types at index [${seg.index}]: expected object, found array.`,
              }
            }
          }
          current = current[seg.index] as Record<string, unknown> | unknown[]
        } else {
          // Property
          if (Array.isArray(current)) {
            return {
              success: false,
              error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nCannot access property "${seg.key}" on array node.`,
            }
          }

          if (current[seg.key] === undefined) {
            current[seg.key] = nextSeg.type === 'index' ? [] : {}
          } else {
            // Node already exists; check compatibility
            const existing = current[seg.key]
            if (existing === null || typeof existing !== 'object') {
              return {
                success: false,
                error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nThe input contains both a literal key and a nested path with the same representation.`,
              }
            }
            if (nextSeg.type === 'index' && !Array.isArray(existing)) {
              return {
                success: false,
                error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nConflicting container types at "${seg.key}": expected array, found object.`,
              }
            }
            if (nextSeg.type === 'prop' && Array.isArray(existing)) {
              return {
                success: false,
                error: `Unable to unflatten safely.\n\nPath collision:\n${rawKey}\n\nConflicting container types at "${seg.key}": expected object, found array.`,
              }
            }
          }
          current = current[seg.key] as Record<string, unknown> | unknown[]
        }
      }
    }
  }

  return { success: true, data: root }
}
