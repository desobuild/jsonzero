import { useCallback } from 'react'
import { Braces, Trash2, Clipboard, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/features/formatter/components/CodeEditor'
import type { JsonParseResult } from '@/lib/json'

export interface CompareEditorProps {
  id: string
  title: string
  value: string
  onChange: (val: string) => void
  onFormat: () => void
  onClear: () => void
  parsed: JsonParseResult
  wordWrap?: boolean
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function CompareEditor({
  id,
  title,
  value,
  onChange,
  onFormat,
  onClear,
  parsed,
  wordWrap = false,
  onToast,
}: CompareEditorProps) {
  const lineCount = value ? value.split('\n').length : 0
  const byteCount = new TextEncoder().encode(value).length

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onChange(text)
        onToast?.(`Pasted content into ${title}`, 'success')
      }
    } catch {
      onToast?.(
        'Could not read from clipboard. Please paste manually.',
        'error'
      )
    }
  }, [onChange, onToast, title])

  return (
    <div
      id={`${id}-pane`}
      className="flex h-full flex-col overflow-hidden border-border bg-surface"
    >
      {/* Pane Header */}
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface-elevated/80 px-3 py-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">{title}</span>
          <span className="text-border">·</span>
          <span className="font-mono text-3xs text-text-muted">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'},{' '}
            {formatBytes(byteCount)}
          </span>
          <span
            className={`rounded px-1.5 py-0.2 font-mono text-3xs font-medium ${
              parsed.success
                ? 'bg-accent/15 text-accent'
                : 'bg-error/15 text-error'
            }`}
          >
            {parsed.success ? 'Valid' : 'Invalid'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            aria-label={`Paste into ${title}`}
            title={`Paste into ${title}`}
            className="h-6 gap-1 px-1.5 text-3xs text-text-secondary hover:text-text-primary"
          >
            <Clipboard className="h-3 w-3" />
            <span className="hidden sm:inline">Paste</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onFormat}
            aria-label={`Format ${title}`}
            title={`Format ${title}`}
            className="h-6 gap-1 px-1.5 text-3xs text-text-secondary hover:text-text-primary"
          >
            <Braces className="h-3 w-3" />
            <span className="hidden sm:inline">Format</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label={`Clear ${title}`}
            title={`Clear ${title}`}
            className="h-6 gap-1 px-1.5 text-3xs text-text-secondary hover:text-text-primary"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Parsing error notification bar if invalid */}
      {!parsed.success && parsed.error && (
        <div
          data-testid={`${id}-error`}
          className="flex flex-col gap-1 border-b border-error/30 bg-error/10 px-3 py-1.5 text-xs text-error"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{title} syntax error:</span>
            <span>{parsed.error}</span>
            {parsed.errorLine !== undefined && (
              <span className="font-mono text-3xs text-error/80">
                (Line {parsed.errorLine}
                {parsed.errorColumn !== undefined &&
                  `, Col ${parsed.errorColumn}`}
                )
              </span>
            )}
          </div>
          {parsed.snippet && (
            <pre className="overflow-x-auto rounded bg-background/50 px-2 py-0.5 font-mono text-3xs text-text-primary">
              {parsed.snippet}
            </pre>
          )}
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          id={`${id}-editor`}
          label={title}
          value={value}
          onChange={onChange}
          hasError={!parsed.success}
          errorLine={parsed.errorLine}
          placeholder={`Enter or paste ${title} JSON...`}
          wordWrap={wordWrap}
          className="h-full"
        />
      </div>
    </div>
  )
}
