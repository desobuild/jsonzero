/**
 * JSONZero — TransformToolbar Component
 *
 * Dedicated toolbar hosting the transformation selector,
 * Apply, Copy Result, Reset actions, and responsive view toggles.
 */

import React from 'react'
import { Check, Copy, RotateCcw, WrapText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TransformType } from '../types'
import { TransformSelector } from './TransformSelector'

export interface TransformToolbarProps {
  selectedTransform: TransformType
  onSelectTransform: (value: TransformType) => void
  onApply: () => void
  onCopyResult: () => void
  onReset: () => void
  canApply: boolean
  wordWrap: boolean
  onToggleWordWrap: () => void
  activeMobileTab: 'input' | 'preview'
  onMobileTabChange: (tab: 'input' | 'preview') => void
}

export const TransformToolbar: React.FC<TransformToolbarProps> = ({
  selectedTransform,
  onSelectTransform,
  onApply,
  onCopyResult,
  onReset,
  canApply,
  wordWrap,
  onToggleWordWrap,
  activeMobileTab,
  onMobileTabChange,
}) => {
  return (
    <div
      id="transform-toolbar"
      data-testid="transform-toolbar"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5"
    >
      {/* Primary Transformation Selector & Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <TransformSelector
          value={selectedTransform}
          onChange={onSelectTransform}
        />

        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />

        {/* Apply Action */}
        <Button
          id="transform-apply-btn"
          data-testid="transform-apply-btn"
          aria-label="Apply transformation to editor"
          variant="accent"
          size="sm"
          disabled={!canApply}
          onClick={onApply}
          className="h-8 gap-1.5 font-semibold text-accent-foreground shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Apply</span>
        </Button>

        {/* Copy Result Action */}
        <Button
          id="transform-copy-btn"
          data-testid="transform-copy-btn"
          aria-label="Copy transformed JSON"
          variant="ghost"
          size="sm"
          disabled={!canApply}
          onClick={onCopyResult}
          className="h-8 gap-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Copy Result</span>
        </Button>

        {/* Reset Action */}
        <Button
          id="transform-reset-btn"
          data-testid="transform-reset-btn"
          aria-label="Reset transformation input"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 gap-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      {/* Right Controls: Word wrap & Mobile View Switcher */}
      <div className="flex items-center gap-2">
        {/* Word Wrap Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleWordWrap}
          aria-label={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
          className={cn(
            'h-7 gap-1 px-2 text-3xs font-medium',
            wordWrap
              ? 'border border-accent/40 bg-accent/15 text-accent'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
          )}
        >
          <WrapText className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Wrap</span>
        </Button>

        {/* Mobile Input / Preview Tabs */}
        <div
          role="tablist"
          aria-label="Transform views"
          className="flex rounded border border-border bg-surface-elevated p-0.5 md:hidden"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMobileTab === 'input'}
            data-testid="mobile-tab-input"
            onClick={() => onMobileTabChange('input')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              activeMobileTab === 'input'
                ? 'bg-accent/20 text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Input
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMobileTab === 'preview'}
            data-testid="mobile-tab-preview"
            onClick={() => onMobileTabChange('preview')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              activeMobileTab === 'preview'
                ? 'bg-accent/20 text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  )
}
