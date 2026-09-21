import { useMemo } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { DiffResult } from '@/lib/json/diff'
import type { CompareFilterState } from '@/features/compare/types'
import { DiffSummary } from '@/features/compare/components/DiffSummary'
import { DiffRow } from '@/features/compare/components/DiffRow'

export interface DiffViewProps {
  diffResult: DiffResult | null
  isAValid: boolean
  isBValid: boolean
  filterState?: CompareFilterState
  onToggleFilter?: (kind: 'changed' | 'added' | 'removed') => void
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function DiffView({
  diffResult,
  isAValid,
  isBValid,
  filterState,
  onToggleFilter,
  onToast,
}: DiffViewProps) {
  const filteredEntries = useMemo(() => {
    if (!diffResult) return []
    if (!filterState) return diffResult.entries
    return diffResult.entries.filter((entry) => {
      if (entry.kind === 'changed') return filterState.showChanged
      if (entry.kind === 'added') return filterState.showAdded
      if (entry.kind === 'removed') return filterState.showRemoved
      return true
    })
  }, [diffResult, filterState])
  return (
    <div
      id="diff-view"
      className="flex h-full flex-col overflow-hidden bg-background"
    >
      {/* Diff Summary Bar */}
      <DiffSummary
        summary={diffResult ? diffResult.summary : null}
        isAValid={isAValid}
        isBValid={isBValid}
        filterState={filterState}
        onToggleFilter={onToggleFilter}
        onToast={onToast}
      />

      {/* Main Diff Content */}
      <div className="flex-1 overflow-y-auto">
        {!isAValid || !isBValid ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-text-muted">
            <AlertCircle className="mb-2 h-8 w-8 text-warning opacity-70" />
            <h3 className="text-sm font-semibold text-text-primary">
              Cannot compare documents
            </h3>
            <p className="mt-1 max-w-sm text-xs text-text-muted">
              Please fix the JSON syntax errors in the editor above to view
              structural differences.
            </p>
          </div>
        ) : diffResult?.summary.isIdentical ? (
          <div
            id="diff-identical-state"
            className="flex h-full flex-col items-center justify-center p-8 text-center text-text-muted"
          >
            <CheckCircle2 className="mb-2 h-8 w-8 text-accent opacity-80" />
            <h3 className="text-sm font-semibold text-text-primary">
              Structurally Identical
            </h3>
            <p className="mt-1 max-w-sm text-xs text-text-muted">
              No differences were found between JSON A and JSON B. Object key
              ordering is ignored.
            </p>
          </div>
        ) : diffResult && diffResult.entries.length > 0 ? (
          filteredEntries.length > 0 ? (
            <div id="diff-entries-list" className="flex flex-col">
              {filteredEntries.map((entry) => (
                <DiffRow key={entry.id} entry={entry} onToast={onToast} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-xs text-text-muted">
              No differences match the current filter selection.
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-xs text-text-muted">
            Enter JSON documents to compare.
          </div>
        )}
      </div>
    </div>
  )
}
