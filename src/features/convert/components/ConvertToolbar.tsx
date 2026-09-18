/**
 * JSONZero — ConvertToolbar Component
 *
 * Toolbar hosting the conversion target selector,
 * Copy, Download, and Reset actions, word wrap toggle, and mobile view switcher.
 */

import React from 'react'
import { Copy, Download, RotateCcw, WrapText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ConvertType } from '../types'
import { ConvertSelector } from './ConvertSelector'

export interface ConvertToolbarProps {
  selectedConvert: ConvertType
  onSelectConvert: (value: ConvertType) => void
  onCopyResult: () => void
  onDownloadResult: () => void
  onReset: () => void
  canExport: boolean
  wordWrap: boolean
  onToggleWordWrap: () => void
  activeMobileTab: 'input' | 'preview'
  onMobileTabChange: (tab: 'input' | 'preview') => void
}

export const ConvertToolbar: React.FC<ConvertToolbarProps> = ({
  selectedConvert,
  onSelectConvert,
  onCopyResult,
  onDownloadResult,
  onReset,
  canExport,
  wordWrap,
  onToggleWordWrap,
  activeMobileTab,
  onMobileTabChange,
}) => {
  return (
    <div
      id="convert-toolbar"
      data-testid="convert-toolbar"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5"
    >
      {/* Target Selector & Primary Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <ConvertSelector value={selectedConvert} onChange={onSelectConvert} />

        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />

        {/* Copy Button */}
        <Button
          id="convert-copy-btn"
          data-testid="convert-copy-btn"
          aria-label="Copy Conversion Output"
          variant="accent"
          size="sm"
          disabled={!canExport}
          onClick={onCopyResult}
          className="h-8 gap-1.5 font-semibold text-accent-dark shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </Button>

        {/* Download Button */}
        <Button
          id="convert-download-btn"
          data-testid="convert-download-btn"
          aria-label="Download Conversion File"
          variant="ghost"
          size="sm"
          disabled={!canExport}
          onClick={onDownloadResult}
          className="h-8 gap-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </Button>

        {/* Reset Button */}
        <Button
          id="convert-reset-btn"
          data-testid="convert-reset-btn"
          aria-label="Reset conversion workbench"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 gap-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      {/* Right Controls: Word Wrap & Mobile View Switcher */}
      <div className="flex items-center gap-2">
        {/* Word Wrap Toggle (for code output) */}
        {selectedConvert !== 'table' && (
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
        )}

        {/* Mobile Input / Output Tabs */}
        <div
          role="tablist"
          aria-label="Convert views"
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
            Output
          </button>
        </div>
      </div>
    </div>
  )
}
