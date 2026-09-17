/**
 * JSONZero — Inspector Utility Functions
 */

import { formatPathSegment } from '@/lib/json/path'
import type { TreeSearchMatch, ValueType } from '@/features/inspector/types'

export function getValueType(value: unknown): ValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'object'
}

/**
 * Searches parsed JSON recursively for keys, primitive values, and array indices.
 */
export function searchJsonTree(
  data: unknown,
  query: string
): TreeSearchMatch[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const matches: TreeSearchMatch[] = []

  function traverse(
    value: unknown,
    path: string,
    keyOrIndex: string | number | null
  ) {
    // 1. Check key or index match
    if (keyOrIndex !== null) {
      const keyStr = String(keyOrIndex).toLowerCase()
      if (keyStr.includes(trimmed)) {
        matches.push({
          path,
          nodeId: `${path}-key`,
          matchType: typeof keyOrIndex === 'number' ? 'index' : 'key',
          matchedText: String(keyOrIndex),
        })
      }
    }

    // 2. Check value match
    if (value === null) {
      if ('null'.includes(trimmed)) {
        matches.push({
          path,
          nodeId: `${path}-value`,
          matchType: 'value',
          matchedText: 'null',
        })
      }
      return
    }

    const valType = typeof value
    if (valType === 'string' || valType === 'number' || valType === 'boolean') {
      const strVal = String(value).toLowerCase()
      if (strVal.includes(trimmed)) {
        matches.push({
          path,
          nodeId: `${path}-value`,
          matchType: 'value',
          matchedText: String(value),
        })
      }
      return
    }

    // 3. Container recursion
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemPath = `${path}[${i}]`
        traverse(value[i], itemPath, i)
      }
      return
    }

    if (valType === 'object') {
      const record = value as Record<string, unknown>
      for (const k of Object.keys(record)) {
        const childPath = `${path}${formatPathSegment(k)}`
        traverse(record[k], childPath, k)
      }
    }
  }

  traverse(data, '$', null)
  return matches
}

/**
 * Collects all ancestor paths for a set of matched paths so that parent containers are expanded.
 */
export function collectAncestorPaths(matchedPaths: string[]): Set<string> {
  const ancestors = new Set<string>()

  for (const path of matchedPaths) {
    // Break down path into progressive ancestor paths
    // e.g. "$.customer.profile.country" -> ["$", "$.customer", "$.customer.profile"]
    let current = '$'
    ancestors.add(current)

    // Tokenize path segments
    let i = 1
    while (i < path.length) {
      if (path[i] === '.') {
        const nextDot = path.indexOf('.', i + 1)
        const nextBracket = path.indexOf('[', i + 1)
        let end = path.length
        if (nextDot !== -1 && nextBracket !== -1) {
          end = Math.min(nextDot, nextBracket)
        } else if (nextDot !== -1) {
          end = nextDot
        } else if (nextBracket !== -1) {
          end = nextBracket
        }
        current += path.slice(i, end)
        ancestors.add(current)
        i = end
      } else if (path[i] === '[') {
        const closeBracket = path.indexOf(']', i)
        if (closeBracket === -1) break
        current += path.slice(i, closeBracket + 1)
        ancestors.add(current)
        i = closeBracket + 1
      } else {
        i++
      }
    }
  }

  return ancestors
}

/**
 * Collects all expandable (object and array) paths in a data structure.
 */
export function collectAllExpandablePaths(data: unknown): Set<string> {
  const paths = new Set<string>()

  function traverse(value: unknown, path: string) {
    if (value === null || typeof value !== 'object') return

    paths.add(path)

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        traverse(value[i], `${path}[${i}]`)
      }
    } else {
      const record = value as Record<string, unknown>
      for (const k of Object.keys(record)) {
        traverse(record[k], `${path}${formatPathSegment(k)}`)
      }
    }
  }

  traverse(data, '$')
  return paths
}
