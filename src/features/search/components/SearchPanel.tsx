import { useRef, useEffect, type KeyboardEvent } from 'react'
import {
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X,
  Replace as ReplaceIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SearchMatch, SearchOptions } from '@/lib/search/types'

export interface SearchPanelProps {
  isOpen: boolean
  isReplaceOpen: boolean
  query: string
  replaceText: string
  options: SearchOptions
  matches: SearchMatch[]
  currentMatchIndex: number
  onQueryChange: (query: string) => void
  onReplaceTextChange: (text: string) => void
  onToggleReplace: () => void
  onToggleMatchCase: () => void
  onToggleWholeWord: () => void
  onNextMatch: () => void
  onPrevMatch: () => void
  onReplaceCurrent: () => void
  onReplaceAll: () => void
  onClose: () => void
  className?: string
}

export function SearchPanel({
  isOpen,
  isReplaceOpen,
  query,
  replaceText,
  options,
  matches,
  currentMatchIndex,
  onQueryChange,
  onReplaceTextChange,
  onToggleReplace,
  onToggleMatchCase,
  onToggleWholeWord,
  onNextMatch,
  onPrevMatch,
  onReplaceCurrent,
  onReplaceAll,
  onClose,
  className,
}: SearchPanelProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when panel opens or becomes active
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }
  }, [isOpen])

  // Handle keyboard events within search inputs
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        onPrevMatch()
      } else {
        onNextMatch()
      }
    }
  }

  const handleReplaceKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        onReplaceAll()
      } else {
        onReplaceCurrent()
      }
    }
  }

  if (!isOpen) {
    return null
  }

  const totalMatches = matches.length
  const hasQuery = query.length > 0
  const hasMatches = totalMatches > 0

  return (
    <div
      role="search"
      aria-label="Editor Search and Replace"
      className={cn(
        'absolute top-2 right-2 z-20 flex w-full max-w-[365px] flex-col gap-1.5 rounded-md border border-border bg-surface-elevated/95 p-2 shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100 font-sans text-xs',
        className
      )}
    >
      {/* ─── Search Row ─── */}
      <div className="flex items-center gap-1">
        {/* Toggle Replace disclosure */}
        <button
          type="button"
          aria-label={isReplaceOpen ? 'Hide Replace' : 'Show Replace'}
          onClick={onToggleReplace}
          title={
            isReplaceOpen ? 'Hide Replace (Ctrl+H)' : 'Show Replace (Ctrl+H)'
          }
          className="flex h-7 w-5 items-center justify-center text-text-muted hover:text-text-primary rounded-xs transition-colors"
        >
          {isReplaceOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Search Input Container */}
        <div className="relative flex flex-1 items-center rounded border border-border bg-background px-2 py-1 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/30">
          <Search className="mr-1.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search JSON"
            aria-label="Search JSON"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent font-mono text-xs text-text-primary placeholder:text-text-dim focus:outline-none"
          />

          {/* Match Count Indicator */}
          {hasQuery && (
            <span
              className={cn(
                'ml-1 shrink-0 select-none font-mono text-3xs',
                hasMatches
                  ? 'text-accent font-medium'
                  : 'text-error font-medium'
              )}
            >
              {hasMatches
                ? `${currentMatchIndex + 1} of ${totalMatches}`
                : 'No results'}
            </span>
          )}
        </div>

        {/* Match Case Button (Aa) */}
        <button
          type="button"
          aria-label="Match Case"
          aria-pressed={options.matchCase}
          onClick={onToggleMatchCase}
          title={`Match Case (${options.matchCase ? 'On' : 'Off'})`}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded border font-mono text-xs font-semibold transition-colors',
            options.matchCase
              ? 'border-accent/40 bg-accent/20 text-accent'
              : 'border-border bg-surface text-text-muted hover:bg-surface-overlay hover:text-text-primary'
          )}
        >
          Aa
        </button>

        {/* Whole Word Button (Ab) */}
        <button
          type="button"
          aria-label="Whole Word"
          aria-pressed={options.wholeWord}
          onClick={onToggleWholeWord}
          title={`Whole Word (${options.wholeWord ? 'On' : 'Off'})`}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded border font-mono text-xs font-semibold transition-colors',
            options.wholeWord
              ? 'border-accent/40 bg-accent/20 text-accent'
              : 'border-border bg-surface text-text-muted hover:bg-surface-overlay hover:text-text-primary'
          )}
        >
          Ab
        </button>

        {/* Previous Match (Up) */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous match"
          onClick={onPrevMatch}
          disabled={!hasMatches}
          title="Previous match (Shift+Enter)"
          className="h-7 w-7 text-text-secondary hover:text-text-primary disabled:opacity-30"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>

        {/* Next Match (Down) */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next match"
          onClick={onNextMatch}
          disabled={!hasMatches}
          title="Next match (Enter)"
          className="h-7 w-7 text-text-secondary hover:text-text-primary disabled:opacity-30"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>

        {/* Close Search Button */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close search"
          onClick={onClose}
          title="Close (Escape)"
          className="h-7 w-7 text-text-muted hover:text-text-primary"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ─── Replace Row (Expanded) ─── */}
      {isReplaceOpen && (
        <div className="flex items-center gap-1.5 pl-6 pt-0.5 animate-in fade-in duration-100">
          <div className="relative flex flex-1 items-center rounded border border-border bg-background px-2 py-1 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/30">
            <ReplaceIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
            <input
              ref={replaceInputRef}
              type="text"
              value={replaceText}
              onChange={(e) => onReplaceTextChange(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              placeholder="Replace with..."
              aria-label="Replace with"
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-transparent font-mono text-xs text-text-primary placeholder:text-text-dim focus:outline-none"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            aria-label="Replace"
            onClick={onReplaceCurrent}
            disabled={!hasMatches}
            title="Replace current match"
            className="h-7 px-2 text-2xs font-medium text-text-secondary hover:bg-surface-overlay hover:text-text-primary disabled:opacity-30"
          >
            Replace
          </Button>

          <Button
            variant="accent"
            size="sm"
            aria-label="Replace All"
            onClick={onReplaceAll}
            disabled={!hasMatches}
            title="Replace all matches"
            className="h-7 px-2.5 text-2xs font-semibold shadow-sm disabled:opacity-30"
          >
            All
          </Button>
        </div>
      )}

      {/* ─── Shortcut Hint Footer ─── */}
      <div className="flex items-center justify-between border-t border-border/40 pt-1 text-3xs text-text-muted px-1 select-none">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface px-1 py-0.2 font-mono text-3xs text-text-secondary">
            Enter
          </kbd>
          <span>next</span>
          <span className="text-text-dim">·</span>
          <kbd className="rounded border border-border bg-surface px-1 py-0.2 font-mono text-3xs text-text-secondary">
            Shift+Enter
          </kbd>
          <span>prev</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-surface px-1 py-0.2 font-mono text-3xs text-text-secondary">
            Esc
          </kbd>
          <span>close</span>
        </span>
      </div>
    </div>
  )
}
