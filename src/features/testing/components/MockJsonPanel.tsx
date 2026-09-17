/**
 * JSONZero — MockJsonPanel Component
 *
 * Displays formatted deterministic mock JSON output.
 */

import React from 'react'
import { Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface MockJsonPanelProps {
  mockJsonString: string
  wordWrap: boolean
  onCopy: () => void
  onDownload: () => void
}

export const MockJsonPanel: React.FC<MockJsonPanelProps> = ({
  mockJsonString,
  wordWrap,
  onCopy,
  onDownload,
}) => {
  const lines = mockJsonString ? mockJsonString.split('\n') : []

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            Generated Mock JSON
          </span>
          <span className="font-mono text-3xs text-text-muted">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            disabled={!mockJsonString}
            data-testid="mock-copy-btn"
            aria-label="Copy mock JSON"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            <Copy className="h-3 w-3" />
            <span className="hidden sm:inline">Copy</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onDownload}
            disabled={!mockJsonString}
            data-testid="mock-download-btn"
            aria-label="Download mock JSON"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-auto font-mono text-xs">
        {mockJsonString ? (
          <div className="flex flex-1 overflow-auto">
            {/* Line numbers */}
            <div
              aria-hidden="true"
              className="select-none border-r border-border bg-surface px-2.5 py-3 text-right text-text-muted font-mono"
            >
              {lines.map((_, i) => (
                <div key={i} className="h-5 leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            <pre
              data-testid="mock-json-output"
              className={cn(
                'flex-1 p-3 font-mono text-text-primary outline-none leading-5',
                wordWrap
                  ? 'whitespace-pre-wrap break-words'
                  : 'whitespace-pre overflow-auto'
              )}
            >
              <code>{mockJsonString}</code>
            </pre>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-muted">
            Provide valid JSON on the left to generate mock data.
          </div>
        )}
      </div>
    </div>
  )
}
