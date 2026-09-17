import { useRef, useState, useCallback } from 'react'
import { Upload, Trash2, Copy, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toast, type ToastType } from '@/components/ui/toast'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import { CodeEditor } from '@/features/formatter/components/CodeEditor'
import type {
  FormatterState,
  FormatterActions,
} from '@/features/formatter/types'
import { cn } from '@/lib/utils'

export interface WorkbenchProps {
  formatter: FormatterState & FormatterActions
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function Workbench({ formatter }: WorkbenchProps) {
  const {
    input,
    output,
    lastOperation,
    error,
    inputStats,
    outputStats,
    setInput,
    clear,
    loadFile,
  } = formatter

  const [copied, setCopied] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'output'>(
    'input'
  )
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setToast({ message: 'Copied to clipboard', type: 'success' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setToast({
        message: 'Could not access clipboard. Please copy manually.',
        type: 'error',
      })
    }
  }, [output])

  const handleDownload = useCallback(() => {
    if (!output) return
    const filename =
      lastOperation === 'minify' ? 'minified.json' : 'formatted.json'
    try {
      const blob = new Blob([output], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToast({ message: `Downloaded ${filename}`, type: 'success' })
    } catch {
      setToast({ message: 'Download failed', type: 'error' })
    }
  }, [output, lastOperation])

  const handleOpenFileClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        const ok = await loadFile(files[0])
        if (ok) {
          setToast({ message: `Loaded ${files[0].name}`, type: 'success' })
        }
      }
      // Reset input value so same file can be opened again
      e.target.value = ''
    },
    [loadFile]
  )

  const handleFileDrop = useCallback(
    async (file: File) => {
      const ok = await loadFile(file)
      if (ok) {
        setToast({ message: `Loaded ${file.name}`, type: 'success' })
      }
    },
    [loadFile]
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Mobile Tab Switcher */}
      <div className="flex border-b border-border bg-surface md:hidden">
        <button
          onClick={() => setActiveMobileTab('input')}
          className={cn(
            'flex-1 py-2 text-center text-xs font-medium transition-colors border-b-2',
            activeMobileTab === 'input'
              ? 'border-accent text-accent font-semibold bg-surface-elevated'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Input JSON
          {inputStats.lineCount > 0 && (
            <span className="ml-1 text-3xs text-text-muted">
              ({inputStats.lineCount})
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveMobileTab('output')}
          className={cn(
            'flex-1 py-2 text-center text-xs font-medium transition-colors border-b-2',
            activeMobileTab === 'output'
              ? 'border-accent text-accent font-semibold bg-surface-elevated'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Formatted JSON
          {outputStats.lineCount > 0 && (
            <span className="ml-1 text-3xs text-text-muted">
              ({outputStats.lineCount})
            </span>
          )}
        </button>
      </div>

      {/* Main Dual-Pane Grid */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border">
        {/* LEFT PANE: INPUT JSON */}
        <div
          className={cn(
            'flex flex-col overflow-hidden',
            activeMobileTab === 'input' ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* Pane Header */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-surface px-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-surface-elevated px-2 py-0.5 font-mono text-2xs font-semibold text-text-secondary uppercase tracking-wider">
                Input JSON
              </span>
              {inputStats.characterCount > 0 && (
                <span className="hidden text-3xs text-text-muted sm:inline">
                  {inputStats.lineCount} lines ·{' '}
                  {formatBytes(inputStats.byteCount)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload JSON file"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFileClick}
                title="Open JSON file from disk"
                className="h-6 gap-1 px-2 text-2xs text-text-secondary hover:text-text-primary"
              >
                <Upload className="h-3 w-3" />
                <span>Open JSON</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Clear JSON"
                onClick={clear}
                disabled={!input && !output && !error}
                title="Clear editor"
                className="h-6 gap-1 px-2 text-2xs text-text-secondary hover:text-text-primary disabled:opacity-30"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <CodeEditor
              id="json-input-editor"
              label="JSON Input Editor"
              value={input}
              onChange={setInput}
              onFileDrop={handleFileDrop}
              hasError={Boolean(error)}
              errorLine={error?.line}
              placeholder="Paste JSON here, or drag & drop a .json file..."
            />

            {/* Actionable Error Display */}
            {error && (
              <div className="border-t border-error/20 p-2.5 bg-surface/90">
                <ErrorDisplay
                  title="Invalid JSON Syntax"
                  message={
                    error.line
                      ? `Line ${error.line}${
                          error.column ? `, Column ${error.column}` : ''
                        }: ${error.message}`
                      : error.message
                  }
                  hint={error.snippet ? `At: "${error.snippet}"` : undefined}
                  severity="error"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: FORMATTED JSON */}
        <div
          className={cn(
            'flex flex-col overflow-hidden bg-background',
            activeMobileTab === 'output' ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* Pane Header */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-surface px-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-surface-elevated px-2 py-0.5 font-mono text-2xs font-semibold text-text-secondary uppercase tracking-wider">
                Formatted JSON
              </span>
              {outputStats.characterCount > 0 && (
                <span className="hidden text-3xs text-text-muted sm:inline">
                  {outputStats.lineCount} lines ·{' '}
                  {formatBytes(outputStats.byteCount)}
                  {outputStats.keyCount > 0 &&
                    ` · ${outputStats.keyCount} keys`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={copied ? 'accent' : 'ghost'}
                size="sm"
                aria-label="Copy JSON"
                onClick={handleCopy}
                disabled={!output}
                title="Copy formatted JSON to clipboard"
                className="h-6 gap-1 px-2 text-2xs disabled:opacity-30"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Download JSON"
                onClick={handleDownload}
                disabled={!output}
                title="Download JSON locally"
                className="h-6 gap-1 px-2 text-2xs text-text-secondary hover:text-text-primary disabled:opacity-30"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
              </Button>
            </div>
          </div>

          {/* Output Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <CodeEditor
              id="json-output-editor"
              label="Formatted JSON Output"
              value={output}
              readOnly={true}
              emptyMessage="Format JSON to see the result."
            />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
