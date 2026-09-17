import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/shared/Header'
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'
import { Toolbar } from '@/components/shared/Toolbar'
import { StatusBar } from '@/components/shared/StatusBar'
import { Toast } from '@/components/ui/toast'
import { Workbench, useFormatter } from '@/features/formatter'

export function App() {
  const formatter = useFormatter()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Keyboard shortcut: Ctrl + Shift + F (or Cmd + Shift + F) for Format
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'F' || e.key === 'f')
      ) {
        e.preventDefault()
        formatter.format()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formatter])

  const handleFutureToolSelect = useCallback((toolName: string) => {
    setToastMessage(`${toolName} feature is coming in a future phase.`)
  }, [])

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
      />

      {/* Dual-Pane Workbench Editor Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Workbench formatter={formatter} />
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

      {/* Future Tool Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}
