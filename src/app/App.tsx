import { useState } from 'react'
import { Header } from '@/components/shared/Header'
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'
import { Toolbar } from '@/components/shared/Toolbar'
import { StatusBar } from '@/components/shared/StatusBar'

export function App() {
  const [activeTool, setActiveTool] = useState<string>('format')

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Toolbar activeTool={activeTool} onToolSelect={setActiveTool} />

      {/* Main workbench area */}
      <main className="flex flex-1 flex-col">
        {/* Privacy indicator */}
        <PrivacyIndicator />

        {/* Workbench placeholder — Phase 1 will add the editor here */}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold text-accent">
                {'{ }'}
              </span>
              <span className="text-2xl font-bold text-text-primary">
                JSONZero
              </span>
            </div>
            <p className="text-sm text-text-muted">
              Paste or drop your JSON to get started.
            </p>
            <p className="text-xs text-text-dim">
              Phase 1 will add the full editor and formatter.
            </p>
          </div>
        </div>
      </main>

      <StatusBar />
    </div>
  )
}
