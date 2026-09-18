/**
 * JSONZero — TestingToolbar Component
 *
 * Primary toolbar for the Testing Workbench.
 * Hosts tool selector, copy/download/reset buttons, wrap toggle, and mobile tabs.
 */

import React from 'react'
import { Copy, Download, RotateCcw, WrapText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TestingType, MobileTestingTab } from '../types'
import { TestingSelector } from './TestingSelector'

export interface TestingToolbarProps {
  selectedTool: TestingType
  onSelectTool: (tool: TestingType) => void
  onCopyResult: () => void
  onDownloadResult: () => void
  onReset: () => void
  canExport: boolean
  wordWrap: boolean
  onToggleWordWrap: () => void
  activeMobileTab: MobileTestingTab
  onMobileTabChange: (tab: MobileTestingTab) => void
}

export const TestingToolbar: React.FC<TestingToolbarProps> = ({
  selectedTool,
  onSelectTool,
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
      id="testing-toolbar"
      data-testid="testing-toolbar"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5"
    >
      {/* Tool Selector & Primary Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <TestingSelector value={selectedTool} onChange={onSelectTool} />

        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />

        {/* Copy Button */}
        <Button
          id="testing-copy-btn"
          data-testid="testing-copy-btn"
          aria-label="Copy output"
          variant="accent"
          size="sm"
          disabled={!canExport}
          onClick={onCopyResult}
          className="h-8 gap-1.5 font-semibold text-accent-foreground shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </Button>

        {/* Download Button */}
        <Button
          id="testing-download-btn"
          data-testid="testing-download-btn"
          aria-label="Download output"
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
          id="testing-reset-btn"
          data-testid="testing-reset-btn"
          aria-label="Reset testing workbench"
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

        {/* Mobile Tabs */}
        <div
          role="tablist"
          aria-label="Testing views"
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
            {selectedTool === 'expected-actual' ||
            selectedTool === 'diff-assertions'
              ? 'Expected'
              : 'Input'}
          </button>

          {selectedTool === 'schema-validation' && (
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'schema'}
              data-testid="mobile-tab-schema"
              onClick={() => onMobileTabChange('schema')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                activeMobileTab === 'schema'
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Schema
            </button>
          )}

          {(selectedTool === 'expected-actual' ||
            selectedTool === 'diff-assertions') && (
            <button
              type="button"
              role="tab"
              aria-selected={activeMobileTab === 'actual'}
              data-testid="mobile-tab-actual"
              onClick={() => onMobileTabChange('actual')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                activeMobileTab === 'actual'
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Actual
            </button>
          )}

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
            {selectedTool === 'schema-validation'
              ? 'Result'
              : selectedTool === 'expected-actual'
                ? 'Diff'
                : 'Output'}
          </button>
        </div>
      </div>
    </div>
  )
}
