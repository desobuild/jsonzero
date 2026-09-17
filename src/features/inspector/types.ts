/**
 * JSONZero — Inspector Types
 */

import type { JsonStructureStatistics } from '@/lib/json/statistics'
import type { JsonPathMatch } from '@/lib/json/jsonpath'

export type ValueType =
  'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export interface TreeNodeData {
  path: string
  key: string | number | null
  value: unknown
  type: ValueType
  depth: number
  isExpandable: boolean
  childCount?: number
  isRoot?: boolean
}

export interface TreeSearchMatch {
  path: string
  nodeId: string
  matchType: 'key' | 'value' | 'index'
  matchedText: string
}

export type InspectorMobileTab = 'tree' | 'jsonpath' | 'statistics'

export interface InspectorState {
  parsedData: unknown | undefined
  isJsonValid: boolean
  parseError: {
    message: string
    line?: number
    column?: number
    snippet?: string
  } | null
  expandedPaths: Set<string>
  searchQuery: string
  matches: TreeSearchMatch[]
  currentMatchIndex: number
  activeMatchPath: string | null
  jsonPathQuery: string
  jsonPathResults: JsonPathMatch[]
  jsonPathError: string | null
  statistics: JsonStructureStatistics | null
}

export interface InspectorActions {
  toggleExpand: (path: string) => void
  expandNode: (path: string) => void
  collapseNode: (path: string) => void
  expandAll: () => void
  collapseAll: () => void
  setSearchQuery: (query: string) => void
  nextMatch: () => void
  prevMatch: () => void
  clearSearch: () => void
  setJsonPathQuery: (query: string) => void
  runJsonPathQuery: (query?: string) => void
  clearJsonPathQuery: () => void
  copyKey: (key: string | number) => void
  copyValue: (value: unknown) => void
  copyPath: (path: string) => void
  copyJsonPathResultValue: (value: unknown) => void
  copyJsonPathResultPath: (path: string) => void
  copyAllJsonPathResults: () => void
}
