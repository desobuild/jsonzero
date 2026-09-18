import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react'
import { Header } from '@/components/shared/Header'
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'
import { Toolbar } from '@/components/shared/Toolbar'
import { StatusBar } from '@/components/shared/StatusBar'
import { Toast, type ToastType } from '@/components/ui/toast'
import { Workbench, useFormatter } from '@/features/formatter'
import { useSearch } from '@/features/search'
import { Loader2 } from 'lucide-react'
import { usePwa } from '@/pwa'
import type { TransformType } from '@/features/transform'
import type { ConvertType } from '@/features/convert'
import type { TestingType } from '@/features/testing'

// Lazy-loaded feature workbenches to optimize initial JS bundle
const Inspector = lazy(() =>
  import('@/features/inspector').then((m) => ({ default: m.Inspector }))
)
const CompareWorkbench = lazy(() =>
  import('@/features/compare').then((m) => ({ default: m.CompareWorkbench }))
)
const TransformWorkbench = lazy(() =>
  import('@/features/transform').then((m) => ({
    default: m.TransformWorkbench,
  }))
)
const ConvertWorkbench = lazy(() =>
  import('@/features/convert').then((m) => ({ default: m.ConvertWorkbench }))
)
const TestingWorkbench = lazy(() =>
  import('@/features/testing').then((m) => ({ default: m.TestingWorkbench }))
)

function WorkbenchLoadingFallback({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-3 bg-background p-8 font-mono text-sm text-text-muted"
    >
      <div className="flex items-center gap-2 font-medium text-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>Loading {label}...</span>
      </div>
      <p className="text-3xs text-text-muted">
        Preparing client-side workbench module
      </p>
    </div>
  )
}

export function App() {
  const pwa = usePwa()
  const formatter = useFormatter()
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [activeView, setActiveView] = useState<
    'editor' | 'tree' | 'diff' | 'transform' | 'convert' | 'testing'
  >('editor')
  const [selectedTransformTool, setSelectedTransformTool] = useState<
    TransformType | undefined
  >(undefined)
  const [selectedConvertTool, setSelectedConvertTool] = useState<
    ConvertType | undefined
  >(undefined)
  const [selectedTestingTool, setSelectedTestingTool] = useState<
    TestingType | undefined
  >(undefined)
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
  } | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])

  const search = useSearch({
    text: formatter.input,
    setText: formatter.setInput,
    textareaRef: inputTextareaRef,
    onToast: (msg, type) => showToast(msg, type),
  })

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey

      // 1. Format: Ctrl + Shift + F / Cmd + Shift + F
      if (isModifier && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault()
        formatter.format()
        return
      }

      // 2. Search: Ctrl + F / Cmd + F
      if (isModifier && !e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault()
        search.openSearch()
        return
      }

      // 3. Replace: Ctrl + H / Cmd + H
      if (isModifier && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault()
        search.openSearch({ replace: true })
        return
      }

      // 4. Close Search: Escape (when search panel is open)
      if (e.key === 'Escape' && search.isOpen) {
        e.preventDefault()
        search.closeSearch()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formatter, search])

  const handleFutureToolSelect = useCallback(
    (toolName: string) => {
      showToast(`${toolName} feature is coming in a future phase.`, 'info')
    },
    [showToast]
  )

  const handleSelectTransform = useCallback(
    (type: 'sort-keys' | 'flatten' | 'unflatten' | 'escape' | 'unescape') => {
      setSelectedTransformTool(type)
      setActiveView('transform')
    },
    []
  )

  const handleSelectConvert = useCallback((type: ConvertType) => {
    setSelectedConvertTool(type)
    setActiveView('convert')
  }, [])

  const handleSelectTesting = useCallback((type: TestingType) => {
    setSelectedTestingTool(type)
    setActiveView('testing')
  }, [])

  const handleToggleSearch = useCallback(() => {
    if (search.isOpen) {
      search.closeSearch()
    } else {
      search.openSearch()
    }
  }, [search])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Update notification banner if a new version is waiting */}
      {pwa.isUpdateAvailable && (
        <div
          role="alert"
          className="flex shrink-0 items-center justify-between border-b border-accent/40 bg-surface-elevated px-3 py-1 text-xs text-text-primary"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>A new version of JSONZero is available.</span>
          </div>
          <button
            onClick={pwa.applyUpdate}
            className="rounded bg-accent px-2 py-0.5 font-mono text-3xs font-medium text-accent-foreground hover:bg-accent/90 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            Update & Reload
          </button>
        </div>
      )}

      {/* Header */}
      <Header canInstall={pwa.canInstall} onInstall={pwa.install} />

      {/* Privacy guarantee banner */}
      <PrivacyIndicator />

      {/* Primary workbench toolbar */}
      <Toolbar
        onFormat={formatter.format}
        onMinify={formatter.minify}
        onValidate={formatter.validate}
        indent={formatter.indent}
        onIndentChange={formatter.setIndent}
        onFutureToolSelect={handleFutureToolSelect}
        onSelectTransform={handleSelectTransform}
        onSelectConvert={handleSelectConvert}
        onSelectTesting={handleSelectTesting}
        isSearchActive={search.isOpen}
        onToggleSearch={handleToggleSearch}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view)
        }}
      />

      {/* Main Dual-Pane Editor Area OR Inspector Area OR Compare Area OR Transform Area OR Convert Area OR Testing Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {activeView === 'editor' ? (
          <Workbench
            formatter={formatter}
            search={search}
            inputTextareaRef={inputTextareaRef}
          />
        ) : activeView === 'tree' ? (
          <Suspense
            fallback={<WorkbenchLoadingFallback label="Tree Inspector" />}
          >
            <Inspector
              input={formatter.input}
              onToast={showToast}
              onSwitchToEditor={() => setActiveView('editor')}
            />
          </Suspense>
        ) : activeView === 'diff' ? (
          <Suspense
            fallback={<WorkbenchLoadingFallback label="Structural Diff" />}
          >
            <CompareWorkbench
              initialJsonA={formatter.input || undefined}
              onToast={showToast}
            />
          </Suspense>
        ) : activeView === 'transform' ? (
          <Suspense
            fallback={<WorkbenchLoadingFallback label="Transform Tools" />}
          >
            <TransformWorkbench
              initialInput={formatter.input}
              initialTransform={selectedTransformTool}
              onApply={(newContent) => {
                formatter.setInput(newContent)
              }}
              onToast={showToast}
            />
          </Suspense>
        ) : activeView === 'convert' ? (
          <Suspense
            fallback={<WorkbenchLoadingFallback label="Convert Tools" />}
          >
            <ConvertWorkbench
              initialInput={formatter.input}
              initialConvert={selectedConvertTool}
              onToast={showToast}
            />
          </Suspense>
        ) : (
          <Suspense
            fallback={<WorkbenchLoadingFallback label="Testing Tools" />}
          >
            <TestingWorkbench
              initialInput={formatter.input}
              initialTool={selectedTestingTool}
              onToast={showToast}
            />
          </Suspense>
        )}
      </main>

      {/* Live Status Bar */}
      <StatusBar
        validationState={formatter.validationState}
        lineCount={formatter.inputStats.lineCount}
        keyCount={formatter.inputStats.keyCount}
        byteCount={formatter.inputStats.byteCount}
        processingTimeMs={formatter.processingTimeMs}
        lastOperation={formatter.lastOperation}
        isOnline={pwa.isOnline}
      />

      {/* Toast Notifications */}
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
