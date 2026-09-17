/**
 * JSONZero — useInspector Hook
 *
 * Encapsulates all state and actions for the JSON Inspector:
 * - Tree expansion & collapse
 * - Tree search & navigation
 * - JSONPath query execution
 * - Copy actions & feedback
 * - Structural statistics
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { parseJSON } from '@/lib/json'
import { evaluateJsonPath, type JsonPathMatch } from '@/lib/json/jsonpath'
import {
  computeStructureStatistics,
  type JsonStructureStatistics,
} from '@/lib/json/statistics'
import {
  searchJsonTree,
  collectAncestorPaths,
  collectAllExpandablePaths,
} from '@/features/inspector/utils'
import type {
  InspectorState,
  InspectorActions,
  TreeSearchMatch,
} from '@/features/inspector/types'
import type { ToastType } from '@/components/ui/toast'

export interface UseInspectorOptions {
  input: string
  onToast?: (message: string, type?: ToastType) => void
}

export function useInspector({
  input,
  onToast,
}: UseInspectorOptions): InspectorState & InspectorActions {
  // 1. JSON Parsing Boundary
  const parseResult = useMemo(() => parseJSON(input), [input])
  const isJsonValid = parseResult.success
  const parsedData = parseResult.data
  const parseError = parseResult.success
    ? null
    : {
        message: parseResult.error || 'Invalid JSON syntax',
        line: parseResult.errorLine,
        column: parseResult.errorColumn,
        snippet: parseResult.snippet,
      }

  // 2. Expanded Paths state
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    return new Set<string>(['$'])
  })

  // Whenever valid JSON changes, expand root and its immediate children
  useEffect(() => {
    if (isJsonValid && parsedData !== undefined && parsedData !== null) {
      const initial = new Set<string>(['$'])
      if (typeof parsedData === 'object') {
        if (Array.isArray(parsedData)) {
          for (let i = 0; i < parsedData.length; i++) {
            initial.add(`$[${i}]`)
          }
        } else {
          for (const k of Object.keys(parsedData as Record<string, unknown>)) {
            initial.add(`$.${k}`)
          }
        }
      }
      setExpandedPaths(initial)
    }
  }, [isJsonValid, parsedData])

  // 3. Tree Search state
  const [searchQuery, setSearchQueryState] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)

  const matches: TreeSearchMatch[] = useMemo(() => {
    if (!isJsonValid || !searchQuery.trim()) return []
    return searchJsonTree(parsedData, searchQuery)
  }, [isJsonValid, parsedData, searchQuery])

  // When search query changes or matches change, auto-expand ancestor paths
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query)
      if (!query.trim()) {
        setCurrentMatchIndex(-1)
        return
      }

      const newMatches = searchJsonTree(parsedData, query)
      if (newMatches.length > 0) {
        setCurrentMatchIndex(0)
        const ancestors = collectAncestorPaths(newMatches.map((m) => m.path))
        setExpandedPaths((prev) => new Set([...prev, ...ancestors]))
      } else {
        setCurrentMatchIndex(-1)
      }
    },
    [parsedData]
  )

  const activeMatchPath =
    currentMatchIndex >= 0 && currentMatchIndex < matches.length
      ? matches[currentMatchIndex].path
      : null

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return
    setCurrentMatchIndex((prev) => {
      const nextIdx = (prev + 1) % matches.length
      const targetPath = matches[nextIdx].path
      const ancestors = collectAncestorPaths([targetPath])
      setExpandedPaths((old) => new Set([...old, ...ancestors]))
      return nextIdx
    })
  }, [matches])

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return
    setCurrentMatchIndex((prev) => {
      const prevIdx = (prev - 1 + matches.length) % matches.length
      const targetPath = matches[prevIdx].path
      const ancestors = collectAncestorPaths([targetPath])
      setExpandedPaths((old) => new Set([...old, ...ancestors]))
      return prevIdx
    })
  }, [matches])

  const clearSearch = useCallback(() => {
    setSearchQueryState('')
    setCurrentMatchIndex(-1)
  }, [])

  // 4. Tree Expand/Collapse actions
  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const expandNode = useCallback((path: string) => {
    setExpandedPaths((prev) => new Set(prev).add(path))
  }, [])

  const collapseNode = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      next.delete(path)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    if (!isJsonValid) return
    const allPaths = collectAllExpandablePaths(parsedData)
    setExpandedPaths(allPaths)
  }, [isJsonValid, parsedData])

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  // 5. JSONPath Query state
  const [jsonPathQuery, setJsonPathQuery] = useState('')
  const [jsonPathResults, setJsonPathResults] = useState<JsonPathMatch[]>([])
  const [jsonPathError, setJsonPathError] = useState<string | null>(null)

  const runJsonPathQuery = useCallback(
    (customQuery?: string) => {
      const queryToRun = customQuery !== undefined ? customQuery : jsonPathQuery
      if (!isJsonValid) {
        setJsonPathResults([])
        setJsonPathError('Cannot execute JSONPath on invalid JSON document.')
        return
      }

      const trimmed = queryToRun.trim()
      if (!trimmed) {
        setJsonPathResults([])
        setJsonPathError(
          'Please enter a JSONPath query (e.g. $.customer or $[*])'
        )
        return
      }

      const res = evaluateJsonPath(parsedData, trimmed)
      if (res.success) {
        setJsonPathResults(res.results)
        setJsonPathError(null)
      } else {
        setJsonPathResults([])
        setJsonPathError(res.error || 'Invalid JSONPath query')
      }
    },
    [isJsonValid, parsedData, jsonPathQuery]
  )

  const clearJsonPathQuery = useCallback(() => {
    setJsonPathQuery('')
    setJsonPathResults([])
    setJsonPathError(null)
  }, [])

  // 6. Structural Statistics (deterministic, memoized)
  const statistics: JsonStructureStatistics | null = useMemo(() => {
    if (!isJsonValid || parsedData === undefined) return null
    return computeStructureStatistics(parsedData)
  }, [isJsonValid, parsedData])

  // 7. Clipboard copy actions
  const copyKey = useCallback(
    async (key: string | number) => {
      try {
        await navigator.clipboard.writeText(String(key))
        onToast?.('Copied key', 'success')
      } catch {
        onToast?.('Could not copy key', 'error')
      }
    },
    [onToast]
  )

  const copyValue = useCallback(
    async (value: unknown) => {
      try {
        let textToCopy: string
        if (value === null) {
          textToCopy = 'null'
        } else if (typeof value === 'object') {
          textToCopy = JSON.stringify(value, null, 2)
        } else if (typeof value === 'string') {
          textToCopy = `"${value}"`
        } else {
          textToCopy = String(value)
        }
        await navigator.clipboard.writeText(textToCopy)
        onToast?.('Copied value', 'success')
      } catch {
        onToast?.('Could not copy value', 'error')
      }
    },
    [onToast]
  )

  const copyPath = useCallback(
    async (path: string) => {
      try {
        await navigator.clipboard.writeText(path)
        onToast?.('Copied JSON path', 'success')
      } catch {
        onToast?.('Could not copy path', 'error')
      }
    },
    [onToast]
  )

  const copyJsonPathResultValue = useCallback(
    async (value: unknown) => {
      try {
        const text =
          typeof value === 'object' && value !== null
            ? JSON.stringify(value, null, 2)
            : typeof value === 'string'
              ? `"${value}"`
              : String(value)
        await navigator.clipboard.writeText(text)
        onToast?.('Copied result value', 'success')
      } catch {
        onToast?.('Could not copy result', 'error')
      }
    },
    [onToast]
  )

  const copyJsonPathResultPath = useCallback(
    async (path: string) => {
      try {
        await navigator.clipboard.writeText(path)
        onToast?.('Copied result path', 'success')
      } catch {
        onToast?.('Could not copy path', 'error')
      }
    },
    [onToast]
  )

  const copyAllJsonPathResults = useCallback(async () => {
    try {
      const payload = jsonPathResults.map((r) => r.value)
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      onToast?.('Copied all query results as JSON', 'success')
    } catch {
      onToast?.('Could not copy results', 'error')
    }
  }, [jsonPathResults, onToast])

  return {
    parsedData,
    isJsonValid,
    parseError,
    expandedPaths,
    searchQuery,
    matches,
    currentMatchIndex,
    activeMatchPath,
    jsonPathQuery,
    jsonPathResults,
    jsonPathError,
    statistics,
    toggleExpand,
    expandNode,
    collapseNode,
    expandAll,
    collapseAll,
    setSearchQuery,
    nextMatch,
    prevMatch,
    clearSearch,
    setJsonPathQuery,
    runJsonPathQuery,
    clearJsonPathQuery,
    copyKey,
    copyValue,
    copyPath,
    copyJsonPathResultValue,
    copyJsonPathResultPath,
    copyAllJsonPathResults,
  }
}
