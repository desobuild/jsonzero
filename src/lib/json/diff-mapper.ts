/**
 * JSONZero — Structural Diff Position Mapper
 *
 * Maps structural JSONPaths from the diff engine to exact character
 * ranges and lines in the rendered JSON document.
 *
 * Operates purely client-side with zero external dependencies and zero naive text scanning.
 */

import { appendJsonPath, formatJsonPath } from '@/lib/json/path'
import { tokenizeJson, type Token } from '@/lib/json/tokenizer'
import type { DiffResult, DiffKind } from '@/lib/json/diff'

export interface JsonNodePosition {
  /** Full JSONPath matching diff engine notation, e.g. `$.user.age` or `$[0]` */
  path: string
  /** Entire node character start offset (includes key and colon for properties) */
  start: number
  /** Entire node character end offset */
  end: number
  /** 1-indexed starting line */
  line: number
  /** 1-indexed ending line */
  endLine: number
  /** Character start offset for the value only (excluding key and colon) */
  valueStart: number
  /** Character end offset for the value */
  valueEnd: number
  /** 1-indexed starting line for the value */
  valueLine: number
  /** Key start offset (if this node is an object property) */
  keyStart?: number
  /** Key end offset (if this node is an object property) */
  keyEnd?: number
}

export interface DiffRangeHighlight {
  start: number
  end: number
  kind: 'changed' | 'added' | 'removed'
}

export interface CompareFilterOptions {
  showChanged: boolean
  showAdded: boolean
  showRemoved: boolean
}

export interface DiffHighlightsResult {
  highlightsA: DiffRangeHighlight[]
  highlightsB: DiffRangeHighlight[]
  linesA: Record<number, DiffKind>
  linesB: Record<number, DiffKind>
}

/**
 * Creates a fast binary-search helper to map character offsets to 1-indexed line numbers.
 */
export function createLineFinder(text: string): (offset: number) => number {
  const lineStarts: number[] = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      lineStarts.push(i + 1)
    }
  }

  return (offset: number): number => {
    let low = 0
    let high = lineStarts.length - 1
    let line = 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (lineStarts[mid] <= offset) {
        line = mid + 1
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return line
  }
}

/**
 * Parses JSON text using tokens and indexes every structural path to its character range and line.
 */
export function indexJsonPositions(
  text: string
): Map<string, JsonNodePosition> {
  const map = new Map<string, JsonNodePosition>()
  if (!text || !text.trim()) {
    return map
  }

  const allTokens = tokenizeJson(text)
  // Filter out pure whitespace tokens
  const tokens = allTokens.filter(
    (t) => !(t.type === 'plain' && /^\s+$/.test(t.text))
  )

  if (tokens.length === 0) {
    return map
  }

  const getLine = createLineFinder(text)
  let idx = 0

  function peek(): Token | undefined {
    return tokens[idx]
  }

  function next(): Token | undefined {
    return tokens[idx++]
  }

  function parseObject(currentPath: string): number {
    const openTok = next()
    if (!openTok) return text.length
    const objStart = openTok.start
    const objLine = getLine(objStart)

    map.set(currentPath, {
      path: currentPath,
      start: objStart,
      end: openTok.end,
      line: objLine,
      endLine: objLine,
      valueStart: objStart,
      valueEnd: openTok.end,
      valueLine: objLine,
    })

    while (idx < tokens.length) {
      const t = peek()
      if (!t) break

      if (t.type === 'punctuation' && t.text === '}') {
        const closeTok = next()!
        const end = closeTok.end
        const objNode = map.get(currentPath)
        if (objNode) {
          objNode.end = end
          objNode.endLine = getLine(end)
          objNode.valueEnd = end
        }
        return end
      }

      if (t.type === 'punctuation' && t.text === ',') {
        next()
        continue
      }

      // Property key
      const keyTok = next()
      if (!keyTok) break

      let keyName = ''
      try {
        keyName = JSON.parse(keyTok.text)
      } catch {
        keyName = keyTok.text.replace(/^["']|["']$/g, '')
      }

      const childPath = appendJsonPath(currentPath, keyName)
      const keyStart = keyTok.start
      const keyEnd = keyTok.end
      const keyLine = getLine(keyStart)

      // Expect ':'
      if (peek()?.type === 'punctuation' && peek()?.text === ':') {
        next()
      }

      const valStartTok = peek()
      const valStart = valStartTok ? valStartTok.start : keyEnd
      const valLine = getLine(valStart)

      const valEnd = parseValue(childPath)

      map.set(childPath, {
        path: childPath,
        start: keyStart,
        end: valEnd,
        line: keyLine,
        endLine: getLine(valEnd),
        valueStart: valStart,
        valueEnd: valEnd,
        valueLine: valLine,
        keyStart,
        keyEnd,
      })
    }

    return openTok.end
  }

  function parseArray(currentPath: string): number {
    const openTok = next()
    if (!openTok) return text.length
    const arrStart = openTok.start
    const arrLine = getLine(arrStart)

    map.set(currentPath, {
      path: currentPath,
      start: arrStart,
      end: openTok.end,
      line: arrLine,
      endLine: arrLine,
      valueStart: arrStart,
      valueEnd: openTok.end,
      valueLine: arrLine,
    })

    let itemIndex = 0
    while (idx < tokens.length) {
      const t = peek()
      if (!t) break

      if (t.type === 'punctuation' && t.text === ']') {
        const closeTok = next()!
        const end = closeTok.end
        const arrNode = map.get(currentPath)
        if (arrNode) {
          arrNode.end = end
          arrNode.endLine = getLine(end)
          arrNode.valueEnd = end
        }
        return end
      }

      if (t.type === 'punctuation' && t.text === ',') {
        next()
        continue
      }

      const childPath = appendJsonPath(currentPath, itemIndex)
      const itemTok = peek()
      const itemStart = itemTok ? itemTok.start : openTok.end
      const itemLine = getLine(itemStart)

      const itemEnd = parseValue(childPath)

      map.set(childPath, {
        path: childPath,
        start: itemStart,
        end: itemEnd,
        line: itemLine,
        endLine: getLine(itemEnd),
        valueStart: itemStart,
        valueEnd: itemEnd,
        valueLine: itemLine,
      })
      itemIndex++
    }

    return openTok.end
  }

  function parseValue(currentPath: string): number {
    const tok = peek()
    if (!tok) return text.length

    if (tok.type === 'punctuation' && tok.text === '{') {
      return parseObject(currentPath)
    }

    if (tok.type === 'punctuation' && tok.text === '[') {
      return parseArray(currentPath)
    }

    // Primitive token (string, number, boolean, null, plain)
    const prim = next()!
    const start = prim.start
    const end = prim.end
    const line = getLine(start)
    const endLine = getLine(end)

    map.set(currentPath, {
      path: currentPath,
      start,
      end,
      line,
      endLine,
      valueStart: start,
      valueEnd: end,
      valueLine: line,
    })

    return end
  }

  try {
    const rootPath = formatJsonPath([])
    parseValue(rootPath)
  } catch {
    // If parse encounters an anomaly, return the partial map
  }

  return map
}

/**
 * Builds highlight ranges and line markers for both JSON A and JSON B based on structural diff entries.
 */
export function buildDiffHighlights(
  diffResult: DiffResult | null,
  positionsA: Map<string, JsonNodePosition>,
  positionsB: Map<string, JsonNodePosition>,
  filters: CompareFilterOptions = {
    showChanged: true,
    showAdded: true,
    showRemoved: true,
  }
): DiffHighlightsResult {
  const highlightsA: DiffRangeHighlight[] = []
  const highlightsB: DiffRangeHighlight[] = []
  const linesA: Record<number, DiffKind> = {}
  const linesB: Record<number, DiffKind> = {}

  if (!diffResult || diffResult.entries.length === 0) {
    return { highlightsA, highlightsB, linesA, linesB }
  }

  for (const entry of diffResult.entries) {
    if (entry.kind === 'changed') {
      if (!filters.showChanged) continue

      const posA = positionsA.get(entry.path)
      if (posA) {
        highlightsA.push({
          start: posA.valueStart,
          end: posA.valueEnd,
          kind: 'changed',
        })
        for (let l = posA.valueLine; l <= posA.endLine; l++) {
          linesA[l] = 'changed'
        }
      }

      const posB = positionsB.get(entry.path)
      if (posB) {
        highlightsB.push({
          start: posB.valueStart,
          end: posB.valueEnd,
          kind: 'changed',
        })
        for (let l = posB.valueLine; l <= posB.endLine; l++) {
          linesB[l] = 'changed'
        }
      }
    } else if (entry.kind === 'added') {
      if (!filters.showAdded) continue

      const posB = positionsB.get(entry.path)
      if (posB) {
        highlightsB.push({
          start: posB.start,
          end: posB.end,
          kind: 'added',
        })
        for (let l = posB.line; l <= posB.endLine; l++) {
          linesB[l] = 'added'
        }
      }
    } else if (entry.kind === 'removed') {
      if (!filters.showRemoved) continue

      const posA = positionsA.get(entry.path)
      if (posA) {
        highlightsA.push({
          start: posA.start,
          end: posA.end,
          kind: 'removed',
        })
        for (let l = posA.line; l <= posA.endLine; l++) {
          linesA[l] = 'removed'
        }
      }
    }
  }

  highlightsA.sort((a, b) => a.start - b.start)
  highlightsB.sort((a, b) => a.start - b.start)

  return { highlightsA, highlightsB, linesA, linesB }
}
