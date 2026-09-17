/**
 * JSONZero — SchemaEditor Component
 *
 * Editor panel for entering and editing JSON Schema definitions.
 */

import React, { useMemo } from 'react'
import { Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SAMPLE_SCHEMA } from '../utils'

export interface SchemaEditorProps {
  value: string
  onChange: (value: string) => void
  wordWrap: boolean
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({
  value,
  onChange,
  wordWrap,
}) => {
  const lineCount = useMemo(() => {
    if (!value) return 1
    return value.split('\n').length
  }, [value])

  return (
    <div
      id="schema-editor-pane"
      data-testid="schema-editor-pane"
      className="flex flex-1 flex-col overflow-hidden border-r border-border bg-background"
    >
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            JSON Schema
          </span>
          <span className="font-mono text-3xs text-text-muted">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(SAMPLE_SCHEMA)}
            data-testid="schema-load-sample-btn"
            aria-label="Load Sample Schema"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">Sample</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange('')}
            data-testid="schema-clear-btn"
            aria-label="Clear schema input"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-error hover:bg-error/10"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Editor textarea with line numbers */}
      <div className="flex flex-1 overflow-hidden font-mono text-xs">
        <div
          aria-hidden="true"
          className="select-none border-r border-border bg-surface px-2.5 py-3 text-right text-text-muted font-mono"
        >
          {Array.from({ length: Math.max(1, lineCount) }, (_, i) => (
            <div key={i} className="h-5 leading-5">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          id="schema-textarea"
          data-testid="schema-textarea"
          aria-label="JSON Schema definition"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or write JSON Schema here..."
          className={cn(
            'flex-1 resize-none bg-transparent p-3 font-mono text-text-primary placeholder:text-text-muted outline-none focus:ring-0 leading-5',
            wordWrap
              ? 'whitespace-pre-wrap break-words'
              : 'whitespace-pre overflow-auto'
          )}
        />
      </div>
    </div>
  )
}
