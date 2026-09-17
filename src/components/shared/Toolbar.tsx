import {
  Braces,
  Minimize2,
  CheckCircle2,
  Search,
  GitCompareArrows,
  FolderTree,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MoreMenu } from '@/components/shared/MoreMenu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { IndentOption } from '@/lib/json'

export interface ToolbarProps {
  onFormat?: () => void
  onMinify?: () => void
  onValidate?: () => void
  indent?: IndentOption
  onIndentChange?: (indent: IndentOption) => void
  onFutureToolSelect?: (toolName: string) => void
  isSearchActive?: boolean
  onToggleSearch?: () => void
  activeView?: 'editor' | 'tree' | 'diff'
  onViewChange?: (view: 'editor' | 'tree' | 'diff') => void
}

const indentOptions: { value: IndentOption; label: string }[] = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
]

export function Toolbar({
  onFormat,
  onMinify,
  onValidate,
  indent = '2',
  onIndentChange,
  onFutureToolSelect: _onFutureToolSelect,
  isSearchActive = false,
  onToggleSearch,
  activeView = 'editor',
  onViewChange,
}: ToolbarProps) {
  const currentIndentLabel =
    indentOptions.find((opt) => opt.value === indent)?.label ?? '2 spaces'

  return (
    <div
      id="toolbar"
      className="flex h-10 items-center justify-between border-b border-border bg-surface px-3 py-1"
    >
      {/* Primary and secondary actions */}
      <div className="flex items-center gap-1.5">
        {/* Format Action (Primary) */}
        <Button
          id="toolbar-format"
          aria-label="Format JSON"
          variant="accent"
          size="sm"
          onClick={() => {
            onFormat?.()
          }}
          className="gap-1.5 font-semibold text-accent-dark shadow-sm hover:opacity-95"
        >
          <Braces className="h-3.5 w-3.5" />
          <span>Format</span>
          <kbd className="hidden lg:inline-flex items-center rounded bg-accent-dark/15 px-1 py-0.5 text-3xs font-mono font-medium text-accent-dark">
            Ctrl+Shift+F
          </kbd>
        </Button>

        {/* Minify Action */}
        <Button
          id="toolbar-minify"
          aria-label="Minify JSON"
          variant="ghost"
          size="sm"
          onClick={onMinify}
          className="gap-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Minify</span>
        </Button>

        {/* Validate Action */}
        <Button
          id="toolbar-validate"
          aria-label="Validate JSON"
          variant="ghost"
          size="sm"
          onClick={onValidate}
          className="gap-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Validate</span>
        </Button>

        {/* Divider */}
        <div className="mx-1 h-4 w-px bg-border" />

        {/* Search Action (Interactive in Phase 2) */}
        <Button
          id="toolbar-search"
          aria-label="Search"
          variant="ghost"
          size="sm"
          onClick={onToggleSearch}
          className={cn(
            'gap-1.5 transition-colors',
            isSearchActive
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd
            className={cn(
              'hidden lg:inline-flex items-center rounded px-1 py-0.2 text-3xs font-mono',
              isSearchActive
                ? 'bg-accent/20 text-accent font-semibold'
                : 'bg-surface-elevated text-text-muted'
            )}
          >
            Ctrl+F
          </kbd>
        </Button>

        {/* Diff / Compare View Toggle */}
        <Button
          id="toolbar-diff"
          aria-label="Compare / Diff"
          variant="ghost"
          size="sm"
          onClick={() =>
            onViewChange?.(activeView === 'diff' ? 'editor' : 'diff')
          }
          title={
            activeView === 'diff'
              ? 'Switch to Editor'
              : 'Open Structural Diff / Compare'
          }
          className={cn(
            'gap-1.5 transition-colors relative',
            activeView === 'diff'
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Diff</span>
          {activeView === 'diff' && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
        </Button>

        {/* Tree Inspector View Toggle */}
        <Button
          id="toolbar-tree"
          aria-label="Tree View"
          variant="ghost"
          size="sm"
          onClick={() =>
            onViewChange?.(activeView === 'tree' ? 'editor' : 'tree')
          }
          title={
            activeView === 'tree' ? 'Switch to Editor' : 'Open Tree Inspector'
          }
          className={cn(
            'gap-1.5 transition-colors relative',
            activeView === 'tree'
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <FolderTree className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Tree</span>
          {activeView === 'tree' && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
        </Button>

        <MoreMenu />
      </div>

      {/* Right Controls: Indentation Selector */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-border bg-surface-elevated px-2.5 text-xs text-text-secondary hover:text-text-primary"
            >
              <span className="text-text-muted">Indent:</span>
              <span className="font-mono text-text-primary">
                {currentIndentLabel}
              </span>
              <ChevronDown className="h-3 w-3 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {indentOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onIndentChange?.(opt.value)}
                className={
                  indent === opt.value ? 'text-accent font-medium' : ''
                }
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
