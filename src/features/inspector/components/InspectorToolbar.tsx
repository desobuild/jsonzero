import React from 'react'
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  PlusSquare,
  MinusSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface InspectorToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  matchCount: number
  currentMatchIndex: number
  onNextMatch: () => void
  onPrevMatch: () => void
  onClearSearch: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  totalNodes?: number
}

export function InspectorToolbar({
  searchQuery,
  onSearchChange,
  matchCount,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  onClearSearch,
  onExpandAll,
  onCollapseAll,
  totalNodes,
}: InspectorToolbarProps) {
  const hasQuery = searchQuery.trim().length > 0

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        onPrevMatch()
      } else {
        onNextMatch()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClearSearch()
    }
  }

  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-surface px-2.5">
      {/* Search Input & Navigation */}
      <div className="flex items-center gap-1.5 flex-1 max-w-sm">
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            role="searchbox"
            aria-label="Search tree"
            placeholder="Search keys & values..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 w-full rounded border border-border bg-surface-elevated pl-7 pr-6 text-xs text-text-primary placeholder:text-text-muted focus:border-accent/60 focus:outline-hidden focus:ring-1 focus:ring-accent/40"
          />
          {hasQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={onClearSearch}
              className="absolute right-1.5 flex h-4 w-4 items-center justify-center rounded text-text-muted hover:text-text-primary"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Match Count and Navigation */}
        {hasQuery && (
          <div className="flex items-center gap-0.5 shrink-0 text-3xs font-mono text-text-muted">
            <span className="px-1">
              {matchCount > 0
                ? `${currentMatchIndex + 1} of ${matchCount}`
                : 'No matches'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Previous match"
              title="Previous match (Shift+Enter)"
              disabled={matchCount === 0}
              onClick={onPrevMatch}
              className="h-5 w-5 p-0 text-text-muted hover:text-text-primary disabled:opacity-30"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Next match"
              title="Next match (Enter)"
              disabled={matchCount === 0}
              onClick={onNextMatch}
              className="h-5 w-5 p-0 text-text-muted hover:text-text-primary disabled:opacity-30"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Expand / Collapse Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Expand All"
          title="Expand all nodes"
          onClick={onExpandAll}
          className="h-6 gap-1 px-2 text-2xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <PlusSquare className="h-3 w-3" />
          <span className="hidden sm:inline">Expand All</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          aria-label="Collapse All"
          title="Collapse all nodes"
          onClick={onCollapseAll}
          className="h-6 gap-1 px-2 text-2xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <MinusSquare className="h-3 w-3" />
          <span className="hidden sm:inline">Collapse All</span>
        </Button>

        {totalNodes !== undefined && totalNodes > 0 && (
          <span className="ml-1 hidden rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-3xs text-text-muted lg:inline">
            {totalNodes} nodes
          </span>
        )}
      </div>
    </div>
  )
}
