/**
 * JSONZero — ConvertPreview Component
 *
 * Renders either the interactive tabular data view or read-only code output
 * with syntax styling, line numbers, word wrap, copy, and download actions.
 */

import React, { useMemo } from 'react'
import { Copy, Download, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ConvertType } from '../types'
import type { TableData } from '@/lib/json/table'
import { ConvertTable } from './ConvertTable'

export interface ConvertPreviewProps {
  selectedConvert: ConvertType
  preview: string
  tableData: TableData | null
  error: string | null
  errorLine?: number
  errorColumn?: number
  isSuccess: boolean
  wordWrap: boolean
  onCopy: () => void
  onDownload: () => void
  onToast?: (message: string, type?: 'info' | 'success' | 'error') => void
}

export const ConvertPreview: React.FC<ConvertPreviewProps> = ({
  selectedConvert,
  preview,
  tableData,
  error,
  errorLine,
  errorColumn,
  isSuccess,
  wordWrap,
  onCopy,
  onDownload,
  onToast,
}) => {
  const lineCount = useMemo(() => {
    if (!preview) return 0
    return preview.split('\n').length
  }, [preview])

  const isTable = selectedConvert === 'table'

  return (
    <div
      id="convert-preview-pane"
      data-testid="convert-preview-pane"
      className="flex flex-1 flex-col overflow-hidden bg-background"
    >
      {/* Pane Header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            {isTable ? 'Table Preview' : 'Generated Output'}
          </span>
          {isSuccess &&
            (preview || (tableData && tableData.rows.length > 0)) && (
              <span className="flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-3xs font-medium text-accent">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  {isTable
                    ? `${tableData?.totalRows} rows`
                    : `${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`}
                </span>
              </span>
            )}
          {error && (
            <span className="flex items-center gap-1 rounded bg-error/15 px-1.5 py-0.5 text-3xs font-medium text-error">
              <AlertCircle className="h-3 w-3" />
              <span>Invalid JSON</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {isSuccess && (preview || (tableData && tableData.rows.length > 0)) && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={onCopy}
              data-testid="copy-result-btn"
              aria-label="Copy conversion result"
              className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDownload}
              data-testid="download-result-btn"
              aria-label="Download conversion result"
              className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </Button>
          </div>
        )}
      </div>

      {/* Pane Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {error ? (
          <div
            role="alert"
            data-testid="convert-error"
            className="flex-1 overflow-y-auto p-4"
          >
            <div className="rounded-md border border-error/40 bg-error/10 p-4 text-error">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider">
                    Unable to convert JSON
                  </h4>
                  {(errorLine !== undefined || errorColumn !== undefined) && (
                    <p className="font-mono text-3xs text-error/90">
                      Line {errorLine ?? 1}, column {errorColumn ?? 1}
                    </p>
                  )}
                  <pre className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed text-text-primary">
                    {error}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : isTable ? (
          <ConvertTable tableData={tableData} onToast={onToast} />
        ) : !preview ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-muted">
            <p>Paste or type JSON on the left to preview generated code.</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden font-mono text-xs">
            {/* Line Numbers */}
            <div
              aria-hidden="true"
              className="select-none border-r border-border bg-surface px-2.5 py-3 text-right text-text-muted font-mono"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="h-5 leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Generated Code Area */}
            <pre
              id="convert-preview-output"
              data-testid="convert-preview-output"
              tabIndex={0}
              aria-label="Generated Code Output"
              className={cn(
                'flex-1 p-3 font-mono text-text-primary outline-none focus-visible:ring-1 focus-visible:ring-accent leading-5',
                wordWrap
                  ? 'whitespace-pre-wrap break-words overflow-y-auto'
                  : 'whitespace-pre overflow-auto'
              )}
            >
              {preview}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
