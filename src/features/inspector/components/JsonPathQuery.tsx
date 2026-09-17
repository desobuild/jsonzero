import React, { useState } from 'react'
import { Play, Copy, Route, HelpCircle, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { JsonPathMatch } from '@/lib/json/jsonpath'

export interface JsonPathQueryProps {
  query: string
  onQueryChange: (query: string) => void
  onRunQuery: (query?: string) => void
  results: JsonPathMatch[]
  error: string | null
  onCopyResultValue: (value: unknown) => void
  onCopyResultPath: (path: string) => void
  onCopyAllResults: () => void
}

export function JsonPathQuery({
  query,
  onQueryChange,
  onRunQuery,
  results,
  error,
  onCopyResultValue,
  onCopyResultPath,
  onCopyAllResults,
}: JsonPathQueryProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onRunQuery()
    }
  }

  const handleCopyAll = () => {
    onCopyAllResults()
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-b border-border bg-background">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-surface px-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xs font-semibold uppercase tracking-wider text-text-secondary">
            JSONPath Query
          </span>
          <button
            type="button"
            aria-label="Toggle JSONPath syntax guide"
            onClick={() => setShowHelp((prev) => !prev)}
            className="flex items-center gap-1 rounded text-3xs text-text-muted hover:text-text-primary focus-visible:outline-hidden"
          >
            <HelpCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Syntax</span>
          </button>
        </div>

        {results.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-3xs text-text-muted">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Copy all results as JSON"
              title="Copy all results as JSON"
              onClick={handleCopyAll}
              className="h-6 gap-1 px-1.5 text-2xs text-text-secondary hover:text-text-primary"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3 w-3 text-accent" />
                  <span className="text-accent">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Syntax Guide Accordion / Banner */}
      {showHelp && (
        <div className="border-b border-border bg-surface-elevated/80 p-2.5 text-2xs text-text-secondary">
          <p className="font-semibold text-text-primary mb-1">
            Supported JSONPath Syntax Subset:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-3xs text-text-muted">
            <li>
              <code className="text-accent">$</code> — Root document
            </li>
            <li>
              <code className="text-accent">.property</code> — Object property
            </li>
            <li>
              <code className="text-accent">[&quot;prop-name&quot;]</code> —
              Special-char property
            </li>
            <li>
              <code className="text-accent">[0]</code> — Array element index
            </li>
            <li>
              <code className="text-accent">[*]</code> — Wildcard all elements
            </li>
            <li>
              <code className="text-accent">[?(@.id == 2)]</code> — Property
              filter
            </li>
          </ul>
        </div>
      )}

      {/* Query Input Bar */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface/50 p-2">
        <div className="relative flex-1">
          <input
            id="jsonpath-query-input"
            type="text"
            aria-label="JSONPath Query"
            placeholder="e.g. $.customer.name or $.orders[*].total"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 w-full rounded border border-border bg-surface-elevated px-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent/60 focus:outline-hidden focus:ring-1 focus:ring-accent/40"
          />
        </div>
        <Button
          id="jsonpath-run-btn"
          variant="accent"
          size="sm"
          aria-label="Run JSONPath Query"
          onClick={() => onRunQuery()}
          className="h-7 gap-1 px-3 text-xs font-semibold text-accent-dark"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>Run</span>
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b border-error/20 bg-error/10 p-2.5 text-xs text-error"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Query Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results Scroll Area */}
      <div className="flex-1 overflow-auto p-2">
        {results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-text-muted">
            {query.trim() ? (
              <span>No results matching query</span>
            ) : (
              <span>
                Enter a query like <code>$.customer</code> and click Run
              </span>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {results.map((item, idx) => {
              const formattedValue =
                typeof item.value === 'object' && item.value !== null
                  ? JSON.stringify(item.value, null, 2)
                  : typeof item.value === 'string'
                    ? `"${item.value}"`
                    : String(item.value)

              return (
                <div
                  key={idx}
                  className="group flex flex-col rounded border border-border bg-surface-elevated/40 p-2 transition-colors hover:border-border-focus"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1 mb-1">
                    <span className="font-mono text-3xs font-semibold text-accent break-all">
                      {item.path}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Copy result path"
                        title="Copy result path"
                        onClick={() => onCopyResultPath(item.path)}
                        className="h-5 gap-1 px-1 text-3xs text-text-muted hover:text-text-primary"
                      >
                        <Route className="h-3 w-3" />
                        <span className="hidden sm:inline">Path</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Copy result value"
                        title="Copy result value"
                        onClick={() => onCopyResultValue(item.value)}
                        className="h-5 gap-1 px-1 text-3xs text-text-muted hover:text-text-primary"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="hidden sm:inline">Value</span>
                      </Button>
                    </div>
                  </div>

                  <pre className="max-h-32 overflow-auto font-mono text-xs text-text-primary whitespace-pre-wrap break-all">
                    {formattedValue}
                  </pre>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
