/**
 * JSONZero — TransformWorkbench Component
 *
 * Primary interactive screen for JSON transformations.
 * Dual-pane editor on desktop with responsive mobile view switching.
 */

import React, { useState, useMemo } from 'react'
import { Toast, type ToastType } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTransform } from '../hooks/useTransform'
import { TransformToolbar } from './TransformToolbar'
import { TransformOptions } from './TransformOptions'
import { TransformPreview } from './TransformPreview'
import type { TransformType } from '../types'

export interface TransformWorkbenchProps {
  initialInput?: string
  initialTransform?: TransformType
  onApply?: (newContent: string) => void
  onToast?: (message: string, type?: ToastType) => void
}

const SAMPLE_JSON = `{
  "zebra": {
    "stripes": 42,
    "habitat": "Savanna"
  },
  "apple": [
    { "type": "Honeycrisp", "price": 2.5 },
    { "type": "Fuji", "price": 1.8 }
  ],
  "middle": true
}`

export const TransformWorkbench: React.FC<TransformWorkbenchProps> = ({
  initialInput = '',
  initialTransform,
  onApply,
  onToast: externalToast,
}) => {
  const [internalToast, setInternalToast] = useState<{
    message: string
    type: ToastType
  } | null>(null)

  const handleToast = (message: string, type: ToastType = 'info') => {
    if (externalToast) {
      externalToast(message, type)
    } else {
      setInternalToast({ message, type })
    }
  }

  const transform = useTransform({
    initialInput,
    onApply,
    onToast: handleToast,
  })

  // Support initial preselected transform if provided (e.g. from More menu)
  React.useEffect(() => {
    if (initialTransform) {
      transform.setSelectedTransform(initialTransform)
    }
  }, [initialTransform]) // eslint-disable-line react-hooks/exhaustive-deps

  const inputLineCount = useMemo(() => {
    if (!transform.input) return 0
    return transform.input.split('\n').length
  }, [transform.input])

  const canApply = Boolean(
    transform.isSuccess && (transform.preview.trim() || !transform.input.trim())
  )

  return (
    <div
      id="transform-workbench"
      data-testid="transform-workbench"
      className="flex flex-1 flex-col overflow-hidden bg-background"
    >
      {/* Transform Toolbar */}
      <TransformToolbar
        selectedTransform={transform.selectedTransform}
        onSelectTransform={transform.setSelectedTransform}
        onApply={transform.apply}
        onCopyResult={transform.copyResult}
        onReset={transform.reset}
        canApply={canApply}
        wordWrap={transform.wordWrap}
        onToggleWordWrap={() => transform.setWordWrap((prev) => !prev)}
        activeMobileTab={transform.activeMobileTab}
        onMobileTabChange={transform.setActiveMobileTab}
      />

      {/* Options & Notifications Bar */}
      <TransformOptions
        selectedTransform={transform.selectedTransform}
        isEscapedJsonDetected={transform.isEscapedJsonDetected}
        onUnescapeAndFormat={transform.unescapeAndFormat}
      />

      {/* Main Dual-Pane Section */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Pane: Input Editor */}
        <div
          id="transform-input-pane"
          data-testid="transform-input-pane"
          className={cn(
            'flex flex-1 flex-col border-r border-border overflow-hidden bg-background',
            transform.activeMobileTab === 'preview' ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Header */}
          <div className="flex h-10 items-center justify-between border-b border-border bg-surface px-3.5 sm:px-4 py-1.5">
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-surface-elevated px-2.5 py-1 font-mono text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Input JSON
              </span>
              <span className="font-mono text-xs text-text-muted">
                {inputLineCount} {inputLineCount === 1 ? 'line' : 'lines'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => transform.setInput(SAMPLE_JSON)}
                data-testid="transform-load-sample-btn"
                aria-label="Load Sample JSON"
                className="h-7 gap-1.5 px-2.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sample</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => transform.setInput('')}
                data-testid="transform-clear-btn"
                aria-label="Clear input JSON"
                className="h-7 gap-1.5 px-2.5 text-xs text-text-secondary hover:text-error hover:bg-error/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>

          {/* Input Textarea with Line Numbers */}
          <div className="flex flex-1 overflow-hidden font-mono text-xs sm:text-sm">
            {/* Line Numbers */}
            <div
              aria-hidden="true"
              className="w-14 shrink-0 select-none border-r border-border bg-surface/40 py-3 pl-3.5 pr-3.5 text-right text-text-muted font-mono text-xs leading-6"
            >
              {Array.from({ length: Math.max(1, inputLineCount) }, (_, i) => (
                <div key={i} className="h-6 leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            <textarea
              id="transform-input-editor"
              data-testid="transform-input-editor"
              aria-label="Input JSON for transformation"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              value={transform.input}
              onChange={(e) => transform.setInput(e.target.value)}
              placeholder="Paste or type JSON here to transform..."
              className={cn(
                'flex-1 resize-none bg-transparent py-3 px-4 font-mono text-xs sm:text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-0 leading-6',
                transform.wordWrap
                  ? 'whitespace-pre-wrap break-words'
                  : 'whitespace-pre overflow-auto'
              )}
            />
          </div>
        </div>

        {/* Right Pane: Preview Panel */}
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            transform.activeMobileTab === 'input' ? 'hidden md:flex' : 'flex'
          )}
        >
          <TransformPreview
            preview={transform.preview}
            error={transform.error}
            isSuccess={transform.isSuccess}
            wordWrap={transform.wordWrap}
            onCopy={transform.copyResult}
          />
        </div>
      </div>

      {/* Internal Toast Fallback */}
      {internalToast && (
        <Toast
          message={internalToast.message}
          type={internalToast.type}
          onClose={() => setInternalToast(null)}
        />
      )}
    </div>
  )
}
