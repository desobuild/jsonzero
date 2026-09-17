import { useState } from 'react'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonTree } from '@/features/inspector/components/JsonTree'
import { InspectorToolbar } from '@/features/inspector/components/InspectorToolbar'
import { JsonPathQuery } from '@/features/inspector/components/JsonPathQuery'
import { StatisticsPanel } from '@/features/inspector/components/StatisticsPanel'
import {
  useInspector,
  type UseInspectorOptions,
} from '@/features/inspector/hooks/useInspector'
import type { InspectorMobileTab } from '@/features/inspector/types'
import { cn } from '@/lib/utils'

export interface InspectorProps extends UseInspectorOptions {
  onSwitchToEditor?: () => void
}

export function Inspector({
  input,
  onToast,
  onSwitchToEditor,
}: InspectorProps) {
  const inspector = useInspector({ input, onToast })
  const [mobileTab, setMobileTab] = useState<InspectorMobileTab>('tree')

  const {
    parsedData,
    isJsonValid,
    parseError,
    expandedPaths,
    searchQuery,
    matches,
    currentMatchIndex,
    activeMatchPath,
    jsonPathQuery,
    jsonPathResults,
    jsonPathError,
    statistics,
    toggleExpand,
    expandAll,
    collapseAll,
    setSearchQuery,
    nextMatch,
    prevMatch,
    clearSearch,
    setJsonPathQuery,
    runJsonPathQuery,
    copyKey,
    copyValue,
    copyPath,
    copyJsonPathResultValue,
    copyJsonPathResultPath,
    copyAllJsonPathResults,
  } = inspector

  // 1. Invalid JSON Graceful State
  if (!isJsonValid) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center bg-background">
        <div className="max-w-md rounded-lg border border-error/30 bg-surface p-6 shadow-lg">
          <div className="flex justify-center mb-3 text-error">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-1">
            Unable to inspect JSON
          </h2>
          <p className="text-xs text-text-muted mb-4">
            Fix the JSON in the editor to view the tree.
          </p>

          {parseError && (
            <div className="rounded border border-error/20 bg-error/10 p-3 text-left font-mono text-2xs text-error mb-4">
              <p className="font-bold">
                {parseError.line
                  ? `Line ${parseError.line}${
                      parseError.column ? `, Column ${parseError.column}` : ''
                    }`
                  : 'Syntax Error'}
                : {parseError.message}
              </p>
              {parseError.snippet && (
                <p className="mt-1 text-text-secondary opacity-80 break-all">
                  Near: &quot;{parseError.snippet}&quot;
                </p>
              )}
            </div>
          )}

          {onSwitchToEditor && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToEditor}
              className="gap-1.5 border-border bg-surface-elevated text-xs font-medium text-text-primary hover:bg-surface-elevated/80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Editor</span>
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Mobile Tab Switcher */}
      <div className="flex border-b border-border bg-surface md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('tree')}
          className={cn(
            'flex-1 py-2 text-center text-xs font-medium border-b-2 transition-colors',
            mobileTab === 'tree'
              ? 'border-accent text-accent font-semibold bg-surface-elevated'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Tree View
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('jsonpath')}
          className={cn(
            'flex-1 py-2 text-center text-xs font-medium border-b-2 transition-colors',
            mobileTab === 'jsonpath'
              ? 'border-accent text-accent font-semibold bg-surface-elevated'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          JSONPath
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('statistics')}
          className={cn(
            'flex-1 py-2 text-center text-xs font-medium border-b-2 transition-colors',
            mobileTab === 'statistics'
              ? 'border-accent text-accent font-semibold bg-surface-elevated'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          Statistics
        </button>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border">
        {/* LEFT COLUMN: TREE VIEW & SEARCH (~60% / 7 cols) */}
        <div
          className={cn(
            'flex flex-col overflow-hidden md:col-span-7 bg-background',
            mobileTab === 'tree' ? 'flex' : 'hidden md:flex'
          )}
        >
          <InspectorToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            matchCount={matches.length}
            currentMatchIndex={currentMatchIndex}
            onNextMatch={nextMatch}
            onPrevMatch={prevMatch}
            onClearSearch={clearSearch}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            totalNodes={statistics?.totalNodes}
          />
          <JsonTree
            data={parsedData}
            expandedPaths={expandedPaths}
            onToggleExpand={toggleExpand}
            onCopyKey={copyKey}
            onCopyValue={copyValue}
            onCopyPath={copyPath}
            searchQuery={searchQuery}
            activeMatchPath={activeMatchPath}
          />
        </div>

        {/* RIGHT COLUMN: JSONPATH & STATISTICS (~40% / 5 cols) */}
        <div
          className={cn(
            'flex flex-col overflow-hidden md:col-span-5 divide-y divide-border bg-background',
            mobileTab !== 'tree' ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* JSONPath Query Top Half */}
          <div
            className={cn(
              'flex flex-1 flex-col overflow-hidden min-h-0',
              mobileTab === 'jsonpath'
                ? 'flex'
                : mobileTab === 'statistics'
                  ? 'hidden md:flex'
                  : 'flex'
            )}
          >
            <JsonPathQuery
              query={jsonPathQuery}
              onQueryChange={setJsonPathQuery}
              onRunQuery={runJsonPathQuery}
              results={jsonPathResults}
              error={jsonPathError}
              onCopyResultValue={copyJsonPathResultValue}
              onCopyResultPath={copyJsonPathResultPath}
              onCopyAllResults={copyAllJsonPathResults}
            />
          </div>

          {/* Structure Statistics Bottom Half */}
          <div
            className={cn(
              'flex flex-1 flex-col overflow-hidden min-h-0',
              mobileTab === 'statistics'
                ? 'flex'
                : mobileTab === 'jsonpath'
                  ? 'hidden md:flex'
                  : 'flex'
            )}
          >
            <StatisticsPanel statistics={statistics} />
          </div>
        </div>
      </div>
    </div>
  )
}
