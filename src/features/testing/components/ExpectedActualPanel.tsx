/**
 * JSONZero — ExpectedActualPanel Component
 *
 * Provides diff visualization between Expected and Actual JSON responses,
 * along with a one-click action to generate assertions for the expected state.
 */

import React from 'react'
import { CheckCircle2, AlertTriangle, ArrowRight, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DiffResult } from '@/lib/json/diff'

export interface ExpectedActualPanelProps {
  diffResult: DiffResult | null
  onGenerateAssertions: () => void
  onCopyDiff: () => void
}

export const ExpectedActualPanel: React.FC<ExpectedActualPanelProps> = ({
  diffResult,
  onGenerateAssertions,
  onCopyDiff,
}) => {
  if (!diffResult) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-muted">
        Provide both Expected and Actual JSON to compare responses.
      </div>
    )
  }

  const { isIdentical, added, removed, changed, total } = diffResult.summary

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header with status badge & actions */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <div className="flex items-center gap-2">
          {isIdentical ? (
            <div
              data-testid="diff-match-badge"
              className="flex items-center gap-1.5 rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Responses Match</span>
            </div>
          ) : (
            <div
              data-testid="diff-mismatch-badge"
              className="flex items-center gap-1.5 rounded bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                {total} {total === 1 ? 'Difference' : 'Differences'}
              </span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 text-3xs font-mono text-text-muted">
            <span>
              Added: <strong className="text-success">{added}</strong>
            </span>
            <span>
              Removed: <strong className="text-error">{removed}</strong>
            </span>
            <span>
              Changed: <strong className="text-warning">{changed}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="accent"
            onClick={onGenerateAssertions}
            data-testid="generate-diff-assertions-btn"
            aria-label="Generate Assertions from Diff"
            className="h-6 gap-1 px-2 text-3xs font-semibold text-accent-dark shadow-sm hover:opacity-95"
          >
            <span>Generate Assertions</span>
            <ArrowRight className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onCopyDiff}
            data-testid="diff-copy-summary-btn"
            aria-label="Copy diff summary"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
          >
            <Copy className="h-3 w-3" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
        </div>
      </div>

      {/* Diff entries list */}
      <div className="flex flex-1 flex-col overflow-y-auto font-mono text-xs">
        {isIdentical ? (
          <div className="p-4 text-center text-text-muted text-xs">
            The expected and actual responses are structurally and
            value-identical.
          </div>
        ) : (
          diffResult.entries.map((entry) => {
            const isAdded = entry.kind === 'added'
            const isRemoved = entry.kind === 'removed'

            const badgeColor = isAdded
              ? 'bg-success/15 text-success border-success/30'
              : isRemoved
                ? 'bg-error/15 text-error border-error/30'
                : 'bg-warning/15 text-warning border-warning/30'

            return (
              <div
                key={entry.id}
                data-testid="diff-entry-row"
                className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 text-xs hover:bg-surface-elevated/40"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-3xs uppercase font-sans font-semibold shrink-0 ${badgeColor}`}
                  >
                    {entry.kind}
                  </span>
                  <span className="text-3xs text-text-muted shrink-0">
                    {entry.path}
                  </span>
                  <span className="truncate text-text-primary">
                    {entry.kind === 'changed' ? (
                      <>
                        <span className="line-through opacity-70 text-error mr-1.5">
                          {JSON.stringify(entry.oldValue)}
                        </span>
                        <span className="text-success">
                          {JSON.stringify(entry.newValue)}
                        </span>
                      </>
                    ) : isAdded ? (
                      <span className="text-success">
                        +{JSON.stringify(entry.newValue)}
                      </span>
                    ) : (
                      <span className="line-through text-error">
                        -{JSON.stringify(entry.oldValue)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
