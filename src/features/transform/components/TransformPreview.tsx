/**
 * JSONZero — TransformPreview Component
 *
 * Renders the transformed JSON result or actionable error diagnostics.
 * Includes line numbers, copy button, and word-wrap toggle support.
 */

import React, { useMemo } from 'react'
import { Copy, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TransformPreviewProps {
  preview: string
  error: string | null
  isSuccess: boolean
  wordWrap: boolean
  onCopy: () => void
}

export const TransformPreview: React.FC<TransformPreviewProps> = ({
  preview,
  error,
  isSuccess,
  wordWrap,
  onCopy,
}) => {
  const lineCount = useMemo(() => {
    if (!preview) return 0
    return preview.split('\n').length
  }, [preview])

  return (
    <div
      id="transform-preview-pane"
      data-testid="transform-preview-pane"
      className="flex flex-1 flex-col overflow-hidden bg-background"
    >
      {/* Pane Header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            Preview / Result
          </span>
          {isSuccess && preview && (
            <span className="flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-3xs font-medium text-accent">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                Transformed ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
              </span>
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 rounded bg-error/15 px-1.5 py-0.5 text-3xs font-medium text-error">
              <AlertCircle className="h-3 w-3" />
              <span>Error</span>
            </span>
          )}
        </div>

        {/* Copy Action */}
        {isSuccess && preview && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            data-testid="copy-preview-btn"
            aria-label="Copy transformed JSON"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
          >
            <Copy className="h-3 w-3" />
            <span>Copy</span>
          </Button>
        )}
      </div>

      {/* Pane Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {error ? (
          <div
            role="alert"
            data-testid="transform-error"
            className="flex-1 overflow-y-auto p-4"
          >
            <div className="rounded-md border border-error/40 bg-error/10 p-4 text-error">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider">
                    Transformation Error
                  </h4>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed text-text-primary">
                    {error}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : !preview ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-muted">
            <p>
              Enter JSON on the left and select a transformation to preview the
              result.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden font-mono text-xs">
            {/* Line Numbers */}
            <div
              aria-hidden="true"
              className="select-none border-r border-border bg-surface px-2.5 py-3 text-right text-text-muted font-mono"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="h-5 leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Transformed Result Area */}
            <pre
              id="transform-preview-output"
              data-testid="transform-preview-output"
              tabIndex={0}
              aria-label="Transformed JSON Output"
              className={cn(
                'flex-1 p-3 font-mono text-text-primary outline-none focus-visible:ring-1 focus-visible:ring-accent leading-5',
                wordWrap
                  ? 'whitespace-pre-wrap break-words overflow-y-auto'
                  : 'whitespace-pre overflow-auto'
              )}
            >
              {preview}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
