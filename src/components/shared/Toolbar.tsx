import {
  Braces,
  Minimize2,
  CheckCircle2,
  Search,
  GitCompareArrows,
  FolderTree,
  Wand2,
  ArrowRightLeft,
  ChevronDown,
  TestTube,
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
import type { ConvertType } from '@/features/convert'
import type { TestingType } from '@/features/testing'

export interface ToolbarProps {
  onFormat?: () => void
  onMinify?: () => void
  onValidate?: () => void
  indent?: IndentOption
  onIndentChange?: (indent: IndentOption) => void
  onFutureToolSelect?: (toolName: string) => void
  onSelectTransform?: (
    type: 'sort-keys' | 'flatten' | 'unflatten' | 'escape' | 'unescape'
  ) => void
  onSelectConvert?: (type: ConvertType) => void
  onSelectTesting?: (type: TestingType) => void
  isSearchActive?: boolean
  onToggleSearch?: () => void
  activeView?: 'editor' | 'tree' | 'diff' | 'transform' | 'convert' | 'testing'
  onViewChange?: (
    view: 'editor' | 'tree' | 'diff' | 'transform' | 'convert' | 'testing'
  ) => void
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
  onFutureToolSelect,
  onSelectTransform,
  onSelectConvert,
  onSelectTesting,
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
      role="toolbar"
      aria-label="Workbench actions"
      className="flex h-11 sm:h-12 items-center justify-between border-b border-border bg-surface px-3 sm:px-4 py-1.5 overflow-x-auto scrollbar-none"
    >
      {/* Primary and secondary actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Format Action (Primary) */}
        <Button
          id="toolbar-format"
          aria-label="Format JSON"
          variant="accent"
          size="default"
          onClick={() => {
            onFormat?.()
          }}
          className="h-9 px-3.5 sm:px-4 gap-2 font-semibold text-accent-foreground shadow-sm hover:opacity-95 shrink-0"
        >
          <Braces className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold">Format</span>
          <kbd className="hidden lg:inline-flex items-center rounded bg-accent-foreground/20 px-1.5 py-0.5 text-xs font-mono font-semibold tracking-wide text-accent-foreground shrink-0">
            Ctrl+Shift+F
          </kbd>
        </Button>

        {/* Minify Action */}
        <Button
          id="toolbar-minify"
          aria-label="Minify JSON"
          variant="ghost"
          size="default"
          onClick={onMinify}
          className="h-9 px-3 gap-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary shrink-0"
        >
          <Minimize2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline text-sm">Minify</span>
        </Button>

        {/* Validate Action */}
        <Button
          id="toolbar-validate"
          aria-label="Validate JSON"
          variant="ghost"
          size="default"
          onClick={onValidate}
          className="h-9 px-3 gap-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary shrink-0"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline text-sm">Validate</span>
        </Button>

        {/* Divider */}
        <div className="mx-1 sm:mx-1.5 h-5 w-px bg-border shrink-0" />

        {/* Search Action (Interactive in Phase 2) */}
        <Button
          id="toolbar-search"
          aria-label="Search"
          aria-pressed={isSearchActive}
          variant="ghost"
          size="default"
          onClick={onToggleSearch}
          className={cn(
            'h-9 px-3 gap-2 transition-colors shrink-0',
            isSearchActive
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline text-sm">Search</span>
          <kbd
            className={cn(
              'hidden lg:inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono shrink-0',
              isSearchActive
                ? 'bg-accent/25 text-accent font-semibold'
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
          aria-pressed={activeView === 'diff'}
          variant="ghost"
          size="default"
          onClick={() =>
            onViewChange?.(activeView === 'diff' ? 'editor' : 'diff')
          }
          title={
            activeView === 'diff'
              ? 'Switch to Editor'
              : 'Open Structural Diff / Compare'
          }
          className={cn(
            'h-9 px-3 gap-2 transition-colors relative shrink-0',
            activeView === 'diff'
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <GitCompareArrows className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline text-sm">Diff</span>
        </Button>

        {/* Tree Inspector View Toggle */}
        <Button
          id="toolbar-tree"
          aria-label="Tree View"
          aria-pressed={activeView === 'tree'}
          variant="ghost"
          size="default"
          onClick={() =>
            onViewChange?.(activeView === 'tree' ? 'editor' : 'tree')
          }
          title={
            activeView === 'tree' ? 'Switch to Editor' : 'Open Tree Inspector'
          }
          className={cn(
            'h-9 px-3 gap-2 transition-colors relative shrink-0',
            activeView === 'tree'
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <FolderTree className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline text-sm">Tree</span>
        </Button>

        {/* Transform View Toggle */}
        <Button
          id="toolbar-transform"
          aria-label="Transform"
          aria-pressed={activeView === 'transform'}
          variant="ghost"
          size="default"
          onClick={() =>
            onViewChange?.(activeView === 'transform' ? 'editor' : 'transform')
          }
          title={
            activeView === 'transform'
              ? 'Switch to Editor'
              : 'Open JSON Transform Tools'
          }
          className={cn(
            'h-9 px-3 gap-2 transition-colors relative shrink-0',
            activeView === 'transform'
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <Wand2 className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline text-sm">Transform</span>
        </Button>

        {/* Convert View Toggle */}
        <Button
          id="toolbar-convert"
          aria-label="Convert"
          aria-pressed={activeView === 'convert'}
          variant="ghost"
          size="default"
          onClick={() =>
            onViewChange?.(activeView === 'convert' ? 'editor' : 'convert')
          }
          title={
            activeView === 'convert'
              ? 'Switch to Editor'
              : 'Open JSON Convert Tools'
          }
          className={cn(
            'h-9 px-3 gap-2 transition-colors relative shrink-0',
            activeView === 'convert'
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <ArrowRightLeft className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline text-sm">Convert</span>
        </Button>

        {/* Test / Developer View Toggle */}
        <Button
          id="toolbar-testing"
          aria-label="Developer & Testing Tools"
          aria-pressed={activeView === 'testing'}
          variant="ghost"
          size="default"
          onClick={() =>
            onViewChange?.(activeView === 'testing' ? 'editor' : 'testing')
          }
          title={
            activeView === 'testing'
              ? 'Switch to Editor'
              : 'Open Developer & Testing Tools'
          }
          className={cn(
            'h-9 px-3 gap-2 transition-colors relative shrink-0',
            activeView === 'testing'
              ? 'border border-accent/40 bg-accent/15 text-accent shadow-xs font-semibold'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <TestTube className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline text-sm">Test</span>
        </Button>

        <MoreMenu
          onSelectTransform={onSelectTransform}
          onSelectConvert={onSelectConvert}
          onSelectTesting={onSelectTesting}
          onFutureToolSelect={onFutureToolSelect}
        />
      </div>

      {/* Right Controls: Indentation Selector */}
      <div className="flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="h-9 gap-2 border-border bg-surface-elevated px-3 text-xs sm:text-sm text-text-secondary hover:text-text-primary shrink-0"
            >
              <span className="text-text-muted">Indent:</span>
              <span className="font-mono text-text-primary font-medium">
                {currentIndentLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
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
