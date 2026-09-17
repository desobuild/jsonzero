import type {
  DiffResult,
  DiffEntry,
  DiffSummary as DiffSummaryData,
  DiffKind,
} from '@/lib/json/diff'
import type { JsonParseResult } from '@/lib/json'

export type { DiffResult, DiffEntry, DiffSummaryData, DiffKind }

export type CompareMobileTab = 'jsonA' | 'jsonB' | 'diff'

export interface CompareState {
  jsonA: string
  jsonB: string
  parsedA: JsonParseResult
  parsedB: JsonParseResult
  diffResult: DiffResult | null
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
}
