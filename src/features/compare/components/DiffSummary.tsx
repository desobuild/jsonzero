import { CheckCircle2, Copy, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DiffSummary as DiffSummaryType } from '@/lib/json/diff'
import type { CompareFilterState } from '@/features/compare/types'
import { formatDiffSummaryText } from '@/features/compare/utils'

export interface DiffSummaryProps {
  summary: DiffSummaryType | null
  isAValid: boolean
  isBValid: boolean
  filterState?: CompareFilterState
  onToggleFilter?: (kind: 'changed' | 'added' | 'removed') => void
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function DiffSummary({
  summary,
  isAValid,
  isBValid,
  filterState,
  onToggleFilter,
  onToast,
}: DiffSummaryProps) {
  const handleCopySummary = async () => {
    if (!summary) return
    const text = formatDiffSummaryText(summary)
    try {
      await navigator.clipboard.writeText(text)
      onToast?.('Copied diff summary to clipboard', 'success')
    } catch {
      onToast?.('Could not copy summary to clipboard', 'error')
    }
  }

  // If one or both sides are invalid
  if (!isAValid || !isBValid) {
    return (
      <div
        id="diff-summary-invalid"
        className="flex items-center gap-2 border-b border-border bg-warning/10 px-4 py-2 text-xs text-warning"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        <span>
          Fix JSON syntax errors to compute structural diff.
          {!isAValid && !isBValid && ' (Both JSON A and JSON B are invalid)'}
          {!isAValid && isBValid && ' (JSON A is invalid)'}
          {isAValid && !isBValid && ' (JSON B is invalid)'}
        </span>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  if (summary.isIdentical) {
    return (
      <div
        id="diff-summary-identical"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent/10 px-4 py-2.5 text-xs"
      >
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
          <span className="font-medium">
            JSON documents are structurally identical.
          </span>
          <span className="text-text-muted">(Key ordering is ignored)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopySummary}
          className="h-6 gap-1 px-2 text-xs text-text-secondary hover:text-text-primary"
        >
          <Copy className="h-3 w-3" />
          <span>Copy Summary</span>
        </Button>
      </div>
    )
  }

  const currentFilters = filterState || {
    showChanged: true,
    showAdded: true,
    showRemoved: true,
  }

  return (
    <div
      id="diff-summary"
      data-testid="diff-summary"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2 text-xs"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-semibold text-text-primary">
          Found {summary.total}{' '}
          {summary.total === 1 ? 'difference' : 'differences'}
        </span>
        <span className="text-border">·</span>
        <span className="font-mono text-xs text-text-muted">
          {summary.total}{' '}
          {summary.total === 1 ? 'total change' : 'total changes'}
        </span>

        {summary.total > 0 && (
          <>
            <span className="text-border">·</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-text-muted">Show:</span>

              {summary.changed > 0 && (
                <label
                  htmlFor="filter-changed"
                  className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  <input
                    type="checkbox"
                    id="filter-changed"
                    data-testid="filter-changed"
                    checked={currentFilters.showChanged}
                    onChange={() => onToggleFilter?.('changed')}
                    className="h-3.5 w-3.5 rounded border-border bg-surface-elevated text-diff-changed accent-diff-changed focus:ring-1 focus:ring-diff-changed"
                  />
                  <span>Unequal values ({summary.changed})</span>
                  <span
                    data-testid="summary-changed-badge"
                    className="inline-flex items-center rounded bg-diff-changed/15 px-1.5 py-0.5 font-mono text-3xs font-medium text-diff-changed"
                  >
                    ~ {summary.changed} Changed
                  </span>
                </label>
              )}

              {summary.added > 0 && (
                <label
                  htmlFor="filter-added"
                  className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  <input
                    type="checkbox"
                    id="filter-added"
                    data-testid="filter-added"
                    checked={currentFilters.showAdded}
                    onChange={() => onToggleFilter?.('added')}
                    className="h-3.5 w-3.5 rounded border-border bg-surface-elevated text-diff-added accent-diff-added focus:ring-1 focus:ring-diff-added"
                  />
                  <span>Added values ({summary.added})</span>
                  <span
                    data-testid="summary-added-badge"
                    className="inline-flex items-center rounded bg-diff-added/15 px-1.5 py-0.5 font-mono text-3xs font-medium text-diff-added"
                  >
                    + {summary.added} Added
                  </span>
                </label>
              )}

              {summary.removed > 0 && (
                <label
                  htmlFor="filter-removed"
                  className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  <input
                    type="checkbox"
                    id="filter-removed"
                    data-testid="filter-removed"
                    checked={currentFilters.showRemoved}
                    onChange={() => onToggleFilter?.('removed')}
                    className="h-3.5 w-3.5 rounded border-border bg-surface-elevated text-diff-removed accent-diff-removed focus:ring-1 focus:ring-diff-removed"
                  />
                  <span>Removed values ({summary.removed})</span>
                  <span
                    data-testid="summary-removed-badge"
                    className="inline-flex items-center rounded bg-diff-removed/15 px-1.5 py-0.5 font-mono text-3xs font-medium text-diff-removed"
                  >
                    - {summary.removed} Removed
                  </span>
                </label>
              )}
            </div>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopySummary}
        aria-label="Copy summary"
        className="h-6 gap-1 px-2 text-xs text-text-secondary hover:text-text-primary"
      >
        <Copy className="h-3 w-3" />
        <span>Copy Summary</span>
      </Button>
    </div>
  )
}
