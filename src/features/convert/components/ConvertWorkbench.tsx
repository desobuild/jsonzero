/**
 * JSONZero — ConvertWorkbench Component
 *
 * Primary interactive screen for JSON conversion.
 * Dual-pane editor on desktop with responsive mobile view switching.
 */

import React, { useState, useMemo } from 'react'
import { Toast, type ToastType } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConvert } from '../hooks/useConvert'
import { ConvertToolbar } from './ConvertToolbar'
import { ConvertOptions } from './ConvertOptions'
import { ConvertPreview } from './ConvertPreview'
import type { ConvertType } from '../types'

export interface ConvertWorkbenchProps {
  initialInput?: string
  initialConvert?: ConvertType
  onToast?: (message: string, type?: ToastType) => void
}

const CONVERT_SAMPLE_JSON = `[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "active": true,
    "profile": {
      "city": "Belagavi",
      "country": "India"
    }
  },
  {
    "id": 2,
    "name": "Bob",
    "email": "bob@example.com",
    "active": false,
    "profile": {
      "city": "Bengaluru",
      "country": "India"
    }
  }
]`

export const ConvertWorkbench: React.FC<ConvertWorkbenchProps> = ({
  initialInput = '',
  initialConvert,
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

  const convert = useConvert({
    initialInput,
    initialConvert: initialConvert || 'table',
    onToast: handleToast,
  })

  // Support initial preselected conversion target (e.g. when launched from More menu)
  React.useEffect(() => {
    if (initialConvert) {
      convert.setSelectedConvert(initialConvert)
    }
  }, [initialConvert]) // eslint-disable-line react-hooks/exhaustive-deps

  const inputLineCount = useMemo(() => {
    if (!convert.input) return 0
    return convert.input.split('\n').length
  }, [convert.input])

  const canExport = Boolean(
    convert.isSuccess &&
    (convert.preview.trim() ||
      (convert.tableData && convert.tableData.rows.length > 0))
  )

  return (
    <div
      id="convert-workbench"
      data-testid="convert-workbench"
      className="flex flex-1 flex-col overflow-hidden bg-background"
    >
      {/* Convert Toolbar */}
      <ConvertToolbar
        selectedConvert={convert.selectedConvert}
        onSelectConvert={convert.setSelectedConvert}
        onCopyResult={convert.copyResult}
        onDownloadResult={convert.downloadResult}
        onReset={convert.reset}
        canExport={canExport}
        wordWrap={convert.wordWrap}
        onToggleWordWrap={() => convert.setWordWrap((prev) => !prev)}
        activeMobileTab={convert.activeMobileTab}
        onMobileTabChange={convert.setActiveMobileTab}
      />

      {/* Target Options Bar */}
      <ConvertOptions
        selectedConvert={convert.selectedConvert}
        options={convert.options}
        onOptionsChange={convert.setOptions}
      />

      {/* Main Dual-Pane Section */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Pane: Input Editor */}
        <div
          id="convert-input-pane"
          data-testid="convert-input-pane"
          className={cn(
            'flex flex-1 flex-col border-r border-border overflow-hidden bg-background',
            convert.activeMobileTab === 'preview' ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Header */}
          <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-primary">
                Input JSON
              </span>
              <span className="font-mono text-3xs text-text-muted">
                {inputLineCount} {inputLineCount === 1 ? 'line' : 'lines'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => convert.setInput(CONVERT_SAMPLE_JSON)}
                data-testid="convert-load-sample-btn"
                aria-label="Load Sample JSON"
                className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
              >
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline">Sample</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => convert.setInput('')}
                data-testid="convert-clear-btn"
                aria-label="Clear input JSON"
                className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-error hover:bg-error/10"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>

          {/* Input Textarea with Line Numbers */}
          <div className="flex flex-1 overflow-hidden font-mono text-xs">
            {/* Line Numbers */}
            <div
              aria-hidden="true"
              className="select-none border-r border-border bg-surface px-2.5 py-3 text-right text-text-muted font-mono"
            >
              {Array.from({ length: Math.max(1, inputLineCount) }, (_, i) => (
                <div key={i} className="h-5 leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            <textarea
              id="convert-input-editor"
              data-testid="convert-input-editor"
              aria-label="Input JSON for conversion"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              value={convert.input}
              onChange={(e) => convert.setInput(e.target.value)}
              placeholder="Paste or type JSON here to convert..."
              className={cn(
                'flex-1 resize-none bg-transparent p-3 font-mono text-text-primary placeholder:text-text-muted outline-none focus:ring-0 leading-5',
                convert.wordWrap
                  ? 'whitespace-pre-wrap break-words'
                  : 'whitespace-pre overflow-auto'
              )}
            />
          </div>
        </div>

        {/* Right Pane: Preview / Table Panel */}
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            convert.activeMobileTab === 'input' ? 'hidden md:flex' : 'flex'
          )}
        >
          <ConvertPreview
            selectedConvert={convert.selectedConvert}
            preview={convert.preview}
            tableData={convert.tableData}
            error={convert.error}
            errorLine={convert.errorLine}
            errorColumn={convert.errorColumn}
            isSuccess={convert.isSuccess}
            wordWrap={convert.wordWrap}
            onCopy={convert.copyResult}
            onDownload={convert.downloadResult}
            onToast={handleToast}
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
