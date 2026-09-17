import { CheckCircle2, Copy, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DiffSummary as DiffSummaryType } from '@/lib/json/diff'
import { formatDiffSummaryText } from '@/features/compare/utils'

export interface DiffSummaryProps {
  summary: DiffSummaryType | null
  isAValid: boolean
  isBValid: boolean
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function DiffSummary({
  summary,
  isAValid,
  isBValid,
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

  return (
    <div
      id="diff-summary"
      data-testid="diff-summary"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2 text-xs"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-text-primary">
          {summary.total}{' '}
          {summary.total === 1 ? 'total change' : 'total changes'}
        </span>
        <span className="text-border">·</span>

        {summary.added > 0 && (
          <span
            data-testid="summary-added-badge"
            className="inline-flex items-center rounded bg-[#68DBA9]/15 px-2 py-0.5 font-mono text-3xs font-medium text-[#68DBA9]"
          >
            + {summary.added} Added
          </span>
        )}

        {summary.removed > 0 && (
          <span
            data-testid="summary-removed-badge"
            className="inline-flex items-center rounded bg-[#FF7B72]/15 px-2 py-0.5 font-mono text-3xs font-medium text-[#FF7B72]"
          >
            - {summary.removed} Removed
          </span>
        )}

        {summary.changed > 0 && (
          <span
            data-testid="summary-changed-badge"
            className="inline-flex items-center rounded bg-[#F0C674]/15 px-2 py-0.5 font-mono text-3xs font-medium text-[#F0C674]"
          >
            ~ {summary.changed} Changed
          </span>
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
