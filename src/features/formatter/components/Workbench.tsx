import { useRef, useState, useCallback } from 'react'
import {
  Upload,
  Trash2,
  Copy,
  Check,
  Download,
  WrapText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toast, type ToastType } from '@/components/ui/toast'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import { CodeEditor } from '@/features/formatter/components/CodeEditor'
import { SearchPanel, useSearch } from '@/features/search'
import type {
  FormatterState,
  FormatterActions,
} from '@/features/formatter/types'
import { cn } from '@/lib/utils'

export interface WorkbenchProps {
  formatter: FormatterState & FormatterActions
  search?: ReturnType<typeof useSearch>
  inputTextareaRef?: React.RefObject<HTMLTextAreaElement | null>
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function Workbench({
  formatter,
  search: externalSearch,
  inputTextareaRef: externalInputTextareaRef,
}: WorkbenchProps) {
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
  const [wordWrap, setWordWrap] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'output'>(
    'input'
  )
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fallbackInputTextareaRef = useRef<HTMLTextAreaElement>(null)
  const inputTextareaRef = externalInputTextareaRef || fallbackInputTextareaRef

  // Internal search fallback if not provided externally
  const fallbackSearch = useSearch({
    text: input,
    setText: setInput,
    textareaRef: inputTextareaRef,
    onToast: (message, type) => setToast({ message, type }),
  })
  const search = externalSearch || fallbackSearch

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
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      {/* Active Worker Processing Overlay */}
      {formatter.isProcessing && (
        <div
          role="status"
          aria-live="polite"
          data-testid="worker-processing-overlay"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-xs"
        >
          <div className="flex items-center gap-2.5 font-mono text-sm font-medium text-text-primary">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span>{formatter.processingMessage || 'Processing...'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={formatter.cancelOperation}
            className="h-7 border-border bg-surface-elevated px-3 text-xs text-text-secondary hover:text-error transition-colors"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div
        role="tablist"
        aria-label="Input or Formatted view"
        className="flex border-b border-border bg-surface md:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMobileTab === 'input'}
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
          type="button"
          role="tab"
          aria-selected={activeMobileTab === 'output'}
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
          <div className="grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-surface px-3.5 sm:px-4 py-1.5 lg:py-0 lg:h-10 gap-y-1.5 lg:gap-y-0 gap-x-2">
            {/* Center title (Row 1 on mobile/tablet, Column 2 on desktop) */}
            <div className="col-span-2 lg:col-span-1 lg:col-start-2 justify-self-center flex items-center">
              <span
                data-testid="input-pane-title"
                className="rounded bg-surface-elevated px-2.5 py-1 font-mono text-xs font-semibold text-text-secondary uppercase tracking-wider select-none shrink-0"
              >
                Input JSON
              </span>
            </div>

            {/* Left metadata (Row 2 Col 1 on mobile/tablet, Column 1 on desktop) */}
            <div className="col-span-1 lg:col-span-1 lg:col-start-1 lg:row-start-1 justify-self-start flex items-center min-w-0">
              {inputStats.characterCount > 0 ? (
                <span className="text-xs text-text-muted truncate">
                  {inputStats.lineCount} lines ·{' '}
                  {formatBytes(inputStats.byteCount)}
                </span>
              ) : null}
            </div>

            {/* Right actions (Row 2 Col 2 on mobile/tablet, Column 3 on desktop) */}
            <div className="col-span-1 lg:col-span-1 lg:col-start-3 lg:row-start-1 justify-self-end flex items-center gap-1.5 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload JSON file"
              />
              <Button
                variant={wordWrap ? 'outline' : 'ghost'}
                size="sm"
                aria-label="Toggle Word Wrap"
                onClick={() => setWordWrap((prev) => !prev)}
                title={wordWrap ? 'Disable Word Wrap' : 'Enable Word Wrap'}
                className={cn(
                  'h-7 gap-1.5 px-2 sm:px-2.5 text-xs transition-colors',
                  wordWrap
                    ? 'border border-accent/40 bg-accent/15 text-accent font-medium'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <WrapText className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Wrap</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Open JSON file from disk"
                onClick={handleOpenFileClick}
                title="Open JSON file from disk"
                className="h-7 gap-1.5 px-2 sm:px-2.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Open JSON</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Clear JSON"
                onClick={clear}
                disabled={!input && !output && !error}
                title="Clear editor"
                className="h-7 gap-1.5 px-2 sm:px-2.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
            {/* Search and Replace Floating Panel */}
            <SearchPanel
              isOpen={search.isOpen}
              isReplaceOpen={search.isReplaceOpen}
              query={search.query}
              replaceText={search.replaceText}
              options={search.options}
              matches={search.matches}
              currentMatchIndex={search.currentMatchIndex}
              onQueryChange={search.setQuery}
              onReplaceTextChange={search.setReplaceText}
              onToggleReplace={search.toggleReplace}
              onToggleMatchCase={search.toggleMatchCase}
              onToggleWholeWord={search.toggleWholeWord}
              onNextMatch={search.nextMatch}
              onPrevMatch={search.prevMatch}
              onReplaceCurrent={search.replaceCurrent}
              onReplaceAll={search.replaceAll}
              onClose={search.closeSearch}
            />

            <CodeEditor
              id="json-input-editor"
              label="JSON Input Editor"
              value={input}
              onChange={setInput}
              onFileDrop={handleFileDrop}
              hasError={Boolean(error)}
              errorLine={error?.line}
              wordWrap={wordWrap}
              searchMatches={search.isOpen ? search.matches : []}
              currentMatchIndex={search.isOpen ? search.currentMatchIndex : -1}
              textareaRef={inputTextareaRef}
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
          <div className="grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-surface px-3.5 sm:px-4 py-1.5 lg:py-0 lg:h-10 gap-y-1.5 lg:gap-y-0 gap-x-2">
            {/* Center title (Row 1 on mobile/tablet, Column 2 on desktop) */}
            <div className="col-span-2 lg:col-span-1 lg:col-start-2 justify-self-center flex items-center">
              <span
                data-testid="formatted-pane-title"
                className="rounded bg-surface-elevated px-2.5 py-1 font-mono text-xs font-semibold text-text-secondary uppercase tracking-wider select-none shrink-0"
              >
                Formatted JSON
              </span>
            </div>

            {/* Left metadata (Row 2 Col 1 on mobile/tablet, Column 1 on desktop) */}
            <div className="col-span-1 lg:col-span-1 lg:col-start-1 lg:row-start-1 justify-self-start flex items-center min-w-0">
              {outputStats.characterCount > 0 ? (
                <span className="text-xs text-text-muted truncate">
                  {outputStats.lineCount} lines ·{' '}
                  {formatBytes(outputStats.byteCount)}
                  {outputStats.keyCount > 0 &&
                    ` · ${outputStats.keyCount} keys`}
                </span>
              ) : null}
            </div>

            {/* Right actions (Row 2 Col 2 on mobile/tablet, Column 3 on desktop) */}
            <div className="col-span-1 lg:col-span-1 lg:col-start-3 lg:row-start-1 justify-self-end flex items-center gap-1.5 shrink-0">
              <Button
                variant={copied ? 'accent' : 'ghost'}
                size="sm"
                aria-label="Copy JSON"
                onClick={handleCopy}
                disabled={!output}
                title="Copy formatted JSON to clipboard"
                className="h-7 gap-1.5 px-2 sm:px-2.5 text-xs disabled:opacity-30"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
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
                className="h-7 gap-1.5 px-2 sm:px-2.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30"
              >
                <Download className="h-3.5 w-3.5" />
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
              wordWrap={wordWrap}
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
