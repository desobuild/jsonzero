import { useEffect, useState, useCallback, useRef } from 'react'
import { Header } from '@/components/shared/Header'
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'
import { Toolbar } from '@/components/shared/Toolbar'
import { StatusBar } from '@/components/shared/StatusBar'
import { Toast, type ToastType } from '@/components/ui/toast'
import { Workbench, useFormatter } from '@/features/formatter'
import { useSearch } from '@/features/search'
import { Inspector } from '@/features/inspector'
import { CompareWorkbench } from '@/features/compare'
import { TransformWorkbench, type TransformType } from '@/features/transform'

export function App() {
  const formatter = useFormatter()
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [activeView, setActiveView] = useState<
    'editor' | 'tree' | 'diff' | 'transform'
  >('editor')
  const [selectedTransformTool, setSelectedTransformTool] = useState<
    TransformType | undefined
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

  const handleToggleSearch = useCallback(() => {
    if (search.isOpen) {
      search.closeSearch()
    } else {
      search.openSearch()
    }
  }, [search])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header />

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
        isSearchActive={search.isOpen}
        onToggleSearch={handleToggleSearch}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view)
        }}
      />

      {/* Main Dual-Pane Editor Area OR Inspector Area OR Compare Area OR Transform Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {activeView === 'editor' ? (
          <Workbench
            formatter={formatter}
            search={search}
            inputTextareaRef={inputTextareaRef}
          />
        ) : activeView === 'tree' ? (
          <Inspector
            input={formatter.input}
            onToast={showToast}
            onSwitchToEditor={() => setActiveView('editor')}
          />
        ) : activeView === 'diff' ? (
          <CompareWorkbench
            initialJsonA={formatter.input || undefined}
            onToast={showToast}
          />
        ) : (
          <TransformWorkbench
            initialInput={formatter.input}
            initialTransform={selectedTransformTool}
            onApply={(newContent) => {
              formatter.setInput(newContent)
            }}
            onToast={showToast}
          />
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
