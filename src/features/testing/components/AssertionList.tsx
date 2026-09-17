/**
 * JSONZero — AssertionList Component
 *
 * Renders generated assertions with toggle between Structured List and Full Code snippet.
 */

import React, { useState } from 'react'
import { Code, List, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GeneratedAssertions } from '../types'
import { AssertionRow } from './AssertionRow'

export interface AssertionListProps {
  assertions: GeneratedAssertions
  wordWrap: boolean
  onCopyAll: () => void
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void
}

export const AssertionList: React.FC<AssertionListProps> = ({
  assertions,
  wordWrap,
  onCopyAll,
  onToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'code'>('code')

  const codeLines = assertions.code.split('\n')

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Sub-header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            Generated Assertions
          </span>
          <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-3xs text-text-muted">
            {assertions.items.length}{' '}
            {assertions.items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex rounded border border-border bg-surface-elevated p-0.5">
            <button
              type="button"
              data-testid="assertions-view-code"
              onClick={() => setViewMode('code')}
              aria-label="Code view"
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-3xs font-medium transition-colors',
                viewMode === 'code'
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Code className="h-3 w-3" />
              <span>Code</span>
            </button>
            <button
              type="button"
              data-testid="assertions-view-list"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-3xs font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <List className="h-3 w-3" />
              <span>List</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onCopyAll}
            data-testid="assertions-copy-all-btn"
            aria-label="Copy all assertions"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
          >
            <Copy className="h-3 w-3" />
            <span className="hidden sm:inline">Copy All</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-auto font-mono text-xs">
        {viewMode === 'list' ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {assertions.items.map((item) => (
              <AssertionRow key={item.id} item={item} onToast={onToast} />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 overflow-auto">
            {/* Line numbers */}
            <div
              aria-hidden="true"
              className="select-none border-r border-border bg-surface px-2.5 py-3 text-right text-text-muted font-mono"
            >
              {codeLines.map((_, i) => (
                <div key={i} className="h-5 leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            <pre
              data-testid="assertions-code-output"
              className={cn(
                'flex-1 p-3 font-mono text-text-primary outline-none leading-5',
                wordWrap
                  ? 'whitespace-pre-wrap break-words'
                  : 'whitespace-pre overflow-auto'
              )}
            >
              <code>{assertions.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
