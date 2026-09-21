import type {
  DiffResult,
  DiffEntry,
  DiffSummary as DiffSummaryData,
  DiffKind,
} from '@/lib/json/diff'
import type {
  JsonParseResult,
  TokenizerDiffHighlight,
  CompareFilterOptions,
} from '@/lib/json'

export type { DiffResult, DiffEntry, DiffSummaryData, DiffKind }

export type CompareFilterState = CompareFilterOptions

export type CompareMobileTab = 'jsonA' | 'jsonB' | 'diff'

export interface CompareState {
  jsonA: string
  jsonB: string
  parsedA: JsonParseResult
  parsedB: JsonParseResult
  diffResult: DiffResult | null
  filterState: CompareFilterState
  diffHighlightsA: TokenizerDiffHighlight[]
  diffHighlightsB: TokenizerDiffHighlight[]
  diffLinesA: Record<number, DiffKind>
  diffLinesB: Record<number, DiffKind>
  wordWrap: boolean
  activeMobileTab: CompareMobileTab
}

export interface CompareActions {
  setJsonA: (value: string) => void
  setJsonB: (value: string) => void
  formatA: () => void
  formatB: () => void
  clearA: () => void
  clearB: () => void
  clearAll: () => void
  swapInputs: () => void
  loadSample: () => void
  setWordWrap: React.Dispatch<React.SetStateAction<boolean>>
  setActiveMobileTab: (tab: CompareMobileTab) => void
  setFilterState: React.Dispatch<React.SetStateAction<CompareFilterState>>
  toggleFilter: (kind: 'changed' | 'added' | 'removed') => void
}
