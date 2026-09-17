/**
 * JSONZero — Structural JSON Diff Engine
 *
 * Provides pure deterministic recursive structural comparison between two JSON documents.
 * Operates client-side only with zero dependencies.
 *
 * Rules:
 * - Objects: compared by key, order-independent.
 * - Arrays: index-based, order-sensitive.
 * - Type transitions (e.g. 1 -> "1", null -> false, [] -> {}) are reported as "changed".
 * - JSONPaths are generated safely using bracket notation for keys with special characters.
 */

import { appendJsonPath, formatJsonPath } from '@/lib/json/path'
import {
  getJsonType,
  type JsonStructureStatistics,
} from '@/lib/json/statistics'

export type DiffKind = 'added' | 'removed' | 'changed' | 'unchanged'

export type JsonValueType = JsonStructureStatistics['rootType'] | 'undefined'

export interface DiffEntry {
  /** Unique deterministic identifier */
  id: string
  /** Change classification */
  kind: DiffKind
  /** Formatted JSONPath, e.g. `$.user.name` or `$[0]` or `$` */
  path: string
  /** Property key or array index where the change occurred */
  key?: string | number
  /** Parent JSONPath */
  parentPath?: string
  /** Original value before change (for 'removed', 'changed') */
  oldValue?: unknown
  /** New value after change (for 'added', 'changed') */
  newValue?: unknown
  /** Inferred JSON type of oldValue */
  oldType?: JsonValueType
  /** Inferred JSON type of newValue */
  newType?: JsonValueType
}

export interface DiffSummary {
  added: number
  removed: number
  changed: number
  total: number
  isIdentical: boolean
}

export interface DiffResult {
  entries: DiffEntry[]
  summary: DiffSummary
}

/**
 * Returns the JSON data type of any parsed JSON value (including undefined).
 */
export function getDiffValueType(val: unknown): JsonValueType {
  if (val === undefined) return 'undefined'
  return getJsonType(val)
}

/**
 * Compares two primitive values for equality.
 */
function arePrimitivesEqual(a: unknown, b: unknown): boolean {
  return Object.is(a, b)
}

/**
 * Recursive structural comparison engine.
 *
 * @param left - The baseline JSON value (JSON A)
 * @param right - The comparison JSON value (JSON B)
 * @returns Structured diff entries and summary
 */
export function compareJson(left: unknown, right: unknown): DiffResult {
  const entries: DiffEntry[] = []

  function walk(
    oldVal: unknown,
    newVal: unknown,
    currentPath: string,
    key?: string | number,
    parentPath?: string
  ): void {
    const oldType = getJsonType(oldVal)
    const newType = getJsonType(newVal)

    // 1. Both identical primitives or identical references
    if (arePrimitivesEqual(oldVal, newVal)) {
      return
    }

    // 2. Type changed (e.g. 1 -> "1", null -> {}, [] -> {})
    if (oldType !== newType) {
      entries.push({
        id: `${currentPath}:${entries.length}`,
        kind: 'changed',
        path: currentPath,
        key,
        parentPath,
        oldValue: oldVal,
        newValue: newVal,
        oldType,
        newType,
      })
      return
    }

    // 3. Both are objects
    if (oldType === 'object') {
      const oldObj = oldVal as Record<string, unknown>
      const newObj = newVal as Record<string, unknown>

      const oldKeys = Object.keys(oldObj)
      const newKeys = Object.keys(newObj)

      // Object key ordering is intentionally ignored.
      // We sort keys lexicographically to produce deterministic diff output.
      const allKeys = Array.from(new Set([...oldKeys, ...newKeys])).sort(
        (a, b) => a.localeCompare(b)
      )

      for (const k of allKeys) {
        const hasOld = Object.prototype.hasOwnProperty.call(oldObj, k)
        const hasNew = Object.prototype.hasOwnProperty.call(newObj, k)
        const childPath = appendJsonPath(currentPath, k)

        if (hasOld && !hasNew) {
          // Property was removed in right
          entries.push({
            id: `${childPath}:removed`,
            kind: 'removed',
            path: childPath,
            key: k,
            parentPath: currentPath,
            oldValue: oldObj[k],
            oldType: getJsonType(oldObj[k]),
          })
        } else if (!hasOld && hasNew) {
          // Property was added in right
          entries.push({
            id: `${childPath}:added`,
            kind: 'added',
            path: childPath,
            key: k,
            parentPath: currentPath,
            newValue: newObj[k],
            newType: getJsonType(newObj[k]),
          })
        } else {
          // Property exists in both — recursively compare
          walk(oldObj[k], newObj[k], childPath, k, currentPath)
        }
      }
      return
    }

    // 4. Both are arrays (order-sensitive index comparison)
    if (oldType === 'array') {
      const oldArr = oldVal as unknown[]
      const newArr = newVal as unknown[]
      const maxLen = Math.max(oldArr.length, newArr.length)

      for (let i = 0; i < maxLen; i++) {
        const hasOld = i < oldArr.length
        const hasNew = i < newArr.length
        const childPath = appendJsonPath(currentPath, i)

        if (hasOld && !hasNew) {
          entries.push({
            id: `${childPath}:removed`,
            kind: 'removed',
            path: childPath,
            key: i,
            parentPath: currentPath,
            oldValue: oldArr[i],
            oldType: getJsonType(oldArr[i]),
          })
        } else if (!hasOld && hasNew) {
          entries.push({
            id: `${childPath}:added`,
            kind: 'added',
            path: childPath,
            key: i,
            parentPath: currentPath,
            newValue: newArr[i],
            newType: getJsonType(newArr[i]),
          })
        } else {
          walk(oldArr[i], newArr[i], childPath, i, currentPath)
        }
      }
      return
    }

    // 5. Both are same primitive type but different values
    entries.push({
      id: `${currentPath}:${entries.length}`,
      kind: 'changed',
      path: currentPath,
      key,
      parentPath,
      oldValue: oldVal,
      newValue: newVal,
      oldType,
      newType,
    })
  }

  const rootPath = formatJsonPath([])
  walk(left, right, rootPath)

  let added = 0
  let removed = 0
  let changed = 0

  for (const entry of entries) {
    if (entry.kind === 'added') added++
    else if (entry.kind === 'removed') removed++
    else if (entry.kind === 'changed') changed++
  }

  const total = added + removed + changed

  return {
    entries,
    summary: {
      added,
      removed,
      changed,
      total,
      isIdentical: total === 0,
    },
  }
}
