/**
 * JSONZero — TestingInput Component
 *
 * Dedicated JSON input pane with line numbers, sample loading, and clear action.
 */

import React, { useMemo } from 'react'
import { Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TestingInputProps {
  id: string
  title: string
  value: string
  onChange: (value: string) => void
  onLoadSample: () => void
  wordWrap: boolean
  placeholder?: string
  sampleLabel?: string
}

export const TestingInput: React.FC<TestingInputProps> = ({
  id,
  title,
  value,
  onChange,
  onLoadSample,
  wordWrap,
  placeholder = 'Paste or write JSON here...',
  sampleLabel = 'Sample',
}) => {
  const lineCount = useMemo(() => {
    if (!value) return 1
    return value.split('\n').length
  }, [value])

  return (
    <div
      id={`${id}-pane`}
      data-testid={`${id}-pane`}
      className="flex flex-1 flex-col overflow-hidden border-r border-border bg-background"
    >
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-surface-elevated px-2 py-0.5 font-mono text-2xs font-semibold text-text-secondary uppercase tracking-wider">
            {title}
          </span>
          <span className="font-mono text-3xs text-text-muted">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onLoadSample}
            data-testid={`${id}-sample-btn`}
            aria-label={`Load sample into ${title}`}
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">{sampleLabel}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange('')}
            data-testid={`${id}-clear-btn`}
            aria-label={`Clear ${title}`}
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-error hover:bg-error/10"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Textarea with line numbers */}
      <div className="flex flex-1 overflow-hidden font-mono text-xs">
        <div
          aria-hidden="true"
          className="select-none border-r border-border bg-surface px-2.5 py-3 text-right text-text-muted font-mono"
        >
          {Array.from({ length: Math.max(1, lineCount) }, (_, i) => (
            <div key={i} className="h-6 leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          id={`${id}-textarea`}
          data-testid={`${id}-textarea`}
          aria-label={title}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'flex-1 resize-none bg-transparent p-3 font-mono text-text-primary placeholder:text-text-muted outline-none focus:ring-0 leading-6',
            wordWrap
              ? 'whitespace-pre-wrap break-words'
              : 'whitespace-pre overflow-auto'
          )}
        />
      </div>
    </div>
  )
}
