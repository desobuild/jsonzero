import { useState, useCallback } from 'react'
import { Copy, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DiffEntry } from '@/lib/json/diff'
import { formatDiffValue, formatDiffEntryText } from '@/features/compare/utils'

export interface DiffRowProps {
  entry: DiffEntry
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function DiffRow({ entry, onToast }: DiffRowProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyText = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedField(label)
        onToast?.(`Copied ${label} to clipboard`, 'success')
        setTimeout(() => setCopiedField(null), 2000)
      } catch {
        onToast?.(`Could not copy ${label}`, 'error')
      }
    },
    [onToast]
  )

  const formattedOld = formatDiffValue(entry.oldValue)
  const formattedNew = formatDiffValue(entry.newValue)

  const kindBadge = {
    added: {
      label: '+ ADDED',
      className: 'bg-[#68DBA9]/15 text-[#68DBA9] border-[#68DBA9]/30',
    },
    removed: {
      label: '- REMOVED',
      className: 'bg-[#FF7B72]/15 text-[#FF7B72] border-[#FF7B72]/30',
    },
    changed: {
      label: '~ CHANGED',
      className: 'bg-[#F0C674]/15 text-[#F0C674] border-[#F0C674]/30',
    },
    unchanged: {
      label: 'UNCHANGED',
      className: 'bg-surface-elevated text-text-muted border-border',
    },
  }[entry.kind]

  return (
    <div
      data-testid="diff-row"
      data-diff-kind={entry.kind}
      className="group flex flex-col gap-2 border-b border-border/60 bg-surface/50 p-3 text-xs transition-colors hover:bg-surface-elevated"
    >
      {/* Header: Badge, Path, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Change classification badge */}
          <span
            className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-3xs font-semibold tracking-wide ${kindBadge.className}`}
          >
            {kindBadge.label}
          </span>

          {/* JSONPath */}
          <code
            data-testid="diff-path"
            className="font-mono text-xs font-medium text-accent"
          >
            {entry.path}
          </code>

          {/* Type change indicator */}
          {entry.kind === 'changed' &&
            entry.oldType &&
            entry.newType &&
            entry.oldType !== entry.newType && (
              <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-3xs text-text-muted">
                {entry.oldType} → {entry.newType}
              </span>
            )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Copy JSON path ${entry.path}`}
            onClick={() => copyText(entry.path, 'JSON path')}
            className="h-6 gap-1 px-1.5 text-3xs text-text-muted hover:text-text-primary"
          >
            {copiedField === 'JSON path' ? (
              <Check className="h-3 w-3 text-accent" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>Path</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy diff item"
            onClick={() => copyText(formatDiffEntryText(entry), 'diff entry')}
            className="h-6 gap-1 px-1.5 text-3xs text-text-muted hover:text-text-primary"
          >
            {copiedField === 'diff entry' ? (
              <Check className="h-3 w-3 text-accent" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span>Diff</span>
          </Button>
        </div>
      </div>

      {/* Values presentation */}
      <div className="mt-1 flex flex-col gap-1.5 font-mono text-xs">
        {entry.kind === 'changed' && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Old value */}
            <div className="rounded border border-[#FF7B72]/20 bg-[#FF7B72]/5 p-2">
              <div className="mb-1 flex items-center justify-between text-3xs text-[#FF7B72]">
                <span className="font-semibold uppercase tracking-wider">
                  Old Value
                </span>
                <button
                  type="button"
                  onClick={() => copyText(formattedOld, 'old value')}
                  className="text-3xs text-text-muted hover:text-text-primary"
                  aria-label="Copy old value"
                >
                  Copy
                </button>
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-text-primary">
                {formattedOld}
              </pre>
            </div>

            {/* New value */}
            <div className="rounded border border-[#68DBA9]/20 bg-[#68DBA9]/5 p-2">
              <div className="mb-1 flex items-center justify-between text-3xs text-[#68DBA9]">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <ArrowRight className="h-2.5 w-2.5" />
                  New Value
                </span>
                <button
                  type="button"
                  onClick={() => copyText(formattedNew, 'new value')}
                  className="text-3xs text-text-muted hover:text-text-primary"
                  aria-label="Copy new value"
                >
                  Copy
                </button>
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-text-primary">
                {formattedNew}
              </pre>
            </div>
          </div>
        )}

        {entry.kind === 'added' && (
          <div className="rounded border border-[#68DBA9]/20 bg-[#68DBA9]/5 p-2">
            <div className="mb-1 flex items-center justify-between text-3xs text-[#68DBA9]">
              <span className="font-semibold uppercase tracking-wider">
                Added Value
              </span>
              <button
                type="button"
                onClick={() => copyText(formattedNew, 'added value')}
                className="text-3xs text-text-muted hover:text-text-primary"
                aria-label="Copy added value"
              >
                Copy
              </button>
            </div>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-text-primary">
              {formattedNew}
            </pre>
          </div>
        )}

        {entry.kind === 'removed' && (
          <div className="rounded border border-[#FF7B72]/20 bg-[#FF7B72]/5 p-2">
            <div className="mb-1 flex items-center justify-between text-3xs text-[#FF7B72]">
              <span className="font-semibold uppercase tracking-wider">
                Removed Value
              </span>
              <button
                type="button"
                onClick={() => copyText(formattedOld, 'removed value')}
                className="text-3xs text-text-muted hover:text-text-primary"
                aria-label="Copy removed value"
              >
                Copy
              </button>
            </div>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-text-primary">
              {formattedOld}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
