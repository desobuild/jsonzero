import { useEffect, useState, useCallback, useRef } from 'react'
import { Header } from '@/components/shared/Header'
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'
import { Toolbar } from '@/components/shared/Toolbar'
import { StatusBar } from '@/components/shared/StatusBar'
import { Toast, type ToastType } from '@/components/ui/toast'
import { Workbench, useFormatter } from '@/features/formatter'
import { useSearch } from '@/features/search'

export function App() {
  const formatter = useFormatter()
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null)
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
        isSearchActive={search.isOpen}
        onToggleSearch={handleToggleSearch}
      />

      {/* Dual-Pane Workbench Editor Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Workbench
          formatter={formatter}
          search={search}
          inputTextareaRef={inputTextareaRef}
        />
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
