import { useState } from 'react'
import { Toast, type ToastType } from '@/components/ui/toast'
import { useCompare } from '@/features/compare/hooks/useCompare'
import { CompareToolbar } from '@/features/compare/components/CompareToolbar'
import { CompareEditor } from '@/features/compare/components/CompareEditor'
import { DiffView } from '@/features/compare/components/DiffView'
import { cn } from '@/lib/utils'

export interface CompareWorkbenchProps {
  initialJsonA?: string
  initialJsonB?: string
  onToast?: (message: string, type?: ToastType) => void
}

export function CompareWorkbench({
  initialJsonA,
  initialJsonB,
  onToast: externalToast,
}: CompareWorkbenchProps) {
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

  const compare = useCompare({
    initialJsonA,
    initialJsonB,
    onToast: handleToast,
  })

  const changeCount = compare.diffResult ? compare.diffResult.summary.total : 0

  return (
    <div
      id="compare-workbench"
      data-testid="compare-workbench"
      className="flex flex-1 flex-col overflow-hidden bg-background"
    >
      {/* Compare Toolbar */}
      <CompareToolbar
        onSwap={compare.swapInputs}
        onLoadSample={compare.loadSample}
        onClearAll={compare.clearAll}
        wordWrap={compare.wordWrap}
        onToggleWordWrap={() => compare.setWordWrap((prev) => !prev)}
        activeMobileTab={compare.activeMobileTab}
        onMobileTabChange={compare.setActiveMobileTab}
        changeCount={changeCount}
      />

      {/* Unified Responsive Layout */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top / Mobile Editor Section */}
        <div
          className={cn(
            'border-b border-border',
            'md:flex md:h-1/2 md:flex-row',
            compare.activeMobileTab === 'diff'
              ? 'hidden md:flex'
              : 'flex flex-1 flex-col'
          )}
        >
          {/* JSON A */}
          <div
            className={cn(
              'flex-1 border-r border-border overflow-hidden',
              compare.activeMobileTab === 'jsonB' ? 'hidden md:block' : 'block'
            )}
          >
            <CompareEditor
              id="compare-json-a"
              title="JSON A"
              value={compare.jsonA}
              onChange={compare.setJsonA}
              onFormat={compare.formatA}
              onClear={compare.clearA}
              parsed={compare.parsedA}
              wordWrap={compare.wordWrap}
              diffHighlights={compare.diffHighlightsA}
              diffLines={compare.diffLinesA}
              onToast={handleToast}
            />
          </div>

          {/* JSON B */}
          <div
            className={cn(
              'flex-1 overflow-hidden',
              compare.activeMobileTab === 'jsonA' ? 'hidden md:block' : 'block'
            )}
          >
            <CompareEditor
              id="compare-json-b"
              title="JSON B"
              value={compare.jsonB}
              onChange={compare.setJsonB}
              onFormat={compare.formatB}
              onClear={compare.clearB}
              parsed={compare.parsedB}
              wordWrap={compare.wordWrap}
              diffHighlights={compare.diffHighlightsB}
              diffLines={compare.diffLinesB}
              onToast={handleToast}
            />
          </div>
        </div>

        {/* Structural Diff Results Section */}
        <div
          className={cn(
            'overflow-hidden',
            'md:flex-1 md:block',
            compare.activeMobileTab === 'diff'
              ? 'flex-1 block'
              : 'hidden md:block'
          )}
        >
          <DiffView
            diffResult={compare.diffResult}
            isAValid={compare.parsedA.success}
            isBValid={compare.parsedB.success}
            filterState={compare.filterState}
            onToggleFilter={compare.toggleFilter}
            onToast={handleToast}
          />
        </div>
      </div>

      {/* Internal Toast fallback */}
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
