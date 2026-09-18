import { ArrowLeftRight, FileJson, Trash2, WrapText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CompareMobileTab } from '@/features/compare/types'

export interface CompareToolbarProps {
  onSwap: () => void
  onLoadSample: () => void
  onClearAll: () => void
  wordWrap: boolean
  onToggleWordWrap: () => void
  activeMobileTab: CompareMobileTab
  onMobileTabChange: (tab: CompareMobileTab) => void
  changeCount: number
}

export function CompareToolbar({
  onSwap,
  onLoadSample,
  onClearAll,
  wordWrap,
  onToggleWordWrap,
  activeMobileTab,
  onMobileTabChange,
  changeCount,
}: CompareToolbarProps) {
  return (
    <div
      id="compare-toolbar"
      className="flex h-10 items-center justify-between border-b border-border bg-surface px-3 py-1 text-xs"
    >
      {/* Left side actions */}
      <div className="flex items-center gap-1.5">
        <Button
          id="compare-swap-btn"
          variant="outline"
          size="sm"
          onClick={onSwap}
          aria-label="Swap JSON A and JSON B"
          title="Swap inputs"
          className="h-7 gap-1.5 border-border bg-surface-elevated text-text-secondary hover:text-text-primary"
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span>Swap</span>
        </Button>

        <Button
          id="compare-sample-btn"
          variant="ghost"
          size="sm"
          onClick={onLoadSample}
          aria-label="Load Sample JSON"
          title="Load sample JSON documents for comparison"
          className="h-7 gap-1 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <FileJson className="h-3 w-3" />
          <span className="hidden sm:inline">Sample</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          aria-label="Clear both inputs"
          title="Clear both inputs"
          className="h-7 gap-1 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <Trash2 className="h-3 w-3" />
          <span className="hidden sm:inline">Clear All</span>
        </Button>

        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleWordWrap}
          aria-label="Toggle word wrap"
          title="Toggle word wrap"
          className={`h-7 gap-1 transition-colors ${
            wordWrap
              ? 'bg-accent/15 text-accent'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          }`}
        >
          <WrapText className="h-3 w-3" />
          <span className="hidden sm:inline">Wrap</span>
        </Button>
      </div>

      {/* Mobile-only view switcher tabs */}
      <div
        role="tablist"
        aria-label="Compare views"
        className="flex md:hidden items-center rounded-md border border-border bg-surface-elevated p-0.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMobileTab === 'jsonA'}
          id="mobile-tab-json-a"
          data-testid="mobile-tab-json-a"
          onClick={() => onMobileTabChange('jsonA')}
          className={`rounded px-2 py-1 text-3xs font-medium transition-colors ${
            activeMobileTab === 'jsonA'
              ? 'bg-accent text-accent-dark font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          JSON A
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeMobileTab === 'jsonB'}
          id="mobile-tab-json-b"
          data-testid="mobile-tab-json-b"
          onClick={() => onMobileTabChange('jsonB')}
          className={`rounded px-2 py-1 text-3xs font-medium transition-colors ${
            activeMobileTab === 'jsonB'
              ? 'bg-accent text-accent-dark font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          JSON B
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeMobileTab === 'diff'}
          id="mobile-tab-diff"
          data-testid="mobile-tab-diff"
          onClick={() => onMobileTabChange('diff')}
          className={`rounded px-2 py-1 text-3xs font-medium transition-colors ${
            activeMobileTab === 'diff'
              ? 'bg-accent text-accent-dark font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Diff {changeCount > 0 ? `(${changeCount})` : ''}
        </button>
      </div>
    </div>
  )
}
