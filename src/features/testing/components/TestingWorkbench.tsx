/**
 * JSONZero — TestingWorkbench Component
 *
 * Primary interactive workbench for Phase 7 Developer & Testing Tools.
 * Adapts between 2-pane and 3-pane layouts on desktop, and tabbed view on mobile.
 */

import React, { useState } from 'react'
import { Toast, type ToastType } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { useTesting } from '../hooks/useTesting'
import { TestingToolbar } from './TestingToolbar'
import { TestingOptions } from './TestingOptions'
import { TestingInput } from './TestingInput'
import { SchemaEditor } from './SchemaEditor'
import { TestingPreview } from './TestingPreview'
import type { TestingType } from '../types'
import {
  SAMPLE_TESTING_JSON,
  SAMPLE_SCHEMA_DATA,
  SAMPLE_EXPECTED_JSON,
  SAMPLE_ACTUAL_JSON,
} from '../utils'

export interface TestingWorkbenchProps {
  initialInput?: string
  initialTool?: TestingType
  onToast?: (message: string, type?: ToastType) => void
}

export const TestingWorkbench: React.FC<TestingWorkbenchProps> = ({
  initialInput = '',
  initialTool,
  onToast: externalToast,
}) => {
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

  const testing = useTesting({
    initialInput,
    initialTool: initialTool || 'api-assertions',
    onToast: handleToast,
  })

  // Support changing tool if passed from parent
  React.useEffect(() => {
    if (initialTool) {
      testing.setSelectedTool(initialTool)
    }
  }, [initialTool]) // eslint-disable-line react-hooks/exhaustive-deps

  const isThreePane =
    testing.selectedTool === 'schema-validation' ||
    testing.selectedTool === 'expected-actual' ||
    testing.selectedTool === 'diff-assertions'

  const canExport = Boolean(testing.exportContent && testing.isSuccess)

  return (
    <div
      id="testing-workbench"
      data-testid="testing-workbench"
      className="flex flex-1 flex-col overflow-hidden bg-background"
    >
      {/* Testing Toolbar */}
      <TestingToolbar
        selectedTool={testing.selectedTool}
        onSelectTool={testing.setSelectedTool}
        onCopyResult={testing.copyResult}
        onDownloadResult={testing.downloadResult}
        onReset={testing.reset}
        canExport={canExport}
        wordWrap={testing.wordWrap}
        onToggleWordWrap={() => testing.setWordWrap((prev) => !prev)}
        activeMobileTab={testing.activeMobileTab}
        onMobileTabChange={testing.setActiveMobileTab}
      />

      {/* Dynamic Options Bar */}
      <TestingOptions
        selectedTool={testing.selectedTool}
        assertionOptions={testing.assertionOptions}
        onAssertionOptionsChange={testing.setAssertionOptions}
        mockOptions={testing.mockOptions}
        onMockOptionsChange={testing.setMockOptions}
      />

      {/* Main Multi-Pane Workbench Body */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Pane 1: Primary Input (Input JSON or Expected JSON) */}
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            testing.activeMobileTab === 'input' ? 'flex' : 'hidden md:flex'
          )}
        >
          <TestingInput
            id="testing-input"
            title={
              testing.selectedTool === 'expected-actual' ||
              testing.selectedTool === 'diff-assertions'
                ? 'Expected JSON'
                : 'Input JSON'
            }
            value={testing.input}
            onChange={testing.setInput}
            onLoadSample={() => {
              if (testing.selectedTool === 'schema-validation') {
                testing.setInput(SAMPLE_SCHEMA_DATA)
              } else if (
                testing.selectedTool === 'expected-actual' ||
                testing.selectedTool === 'diff-assertions'
              ) {
                testing.setInput(SAMPLE_EXPECTED_JSON)
              } else {
                testing.setInput(SAMPLE_TESTING_JSON)
              }
            }}
            wordWrap={testing.wordWrap}
            placeholder={
              testing.selectedTool === 'expected-actual'
                ? 'Paste Expected API response here...'
                : 'Paste or type JSON here...'
            }
          />
        </div>

        {/* Pane 2: Middle Pane (Schema Editor OR Actual JSON input if 3-pane mode) */}
        {testing.selectedTool === 'schema-validation' && (
          <div
            className={cn(
              'flex flex-1 flex-col overflow-hidden',
              testing.activeMobileTab === 'schema' ? 'flex' : 'hidden md:flex'
            )}
          >
            <SchemaEditor
              value={testing.schemaInput}
              onChange={testing.setSchemaInput}
              wordWrap={testing.wordWrap}
            />
          </div>
        )}

        {(testing.selectedTool === 'expected-actual' ||
          testing.selectedTool === 'diff-assertions') && (
          <div
            className={cn(
              'flex flex-1 flex-col overflow-hidden',
              testing.activeMobileTab === 'actual' ? 'flex' : 'hidden md:flex'
            )}
          >
            <TestingInput
              id="testing-actual"
              title="Actual JSON"
              value={testing.actualInput}
              onChange={testing.setActualInput}
              onLoadSample={() => testing.setActualInput(SAMPLE_ACTUAL_JSON)}
              wordWrap={testing.wordWrap}
              placeholder="Paste Actual API response here to compare..."
            />
          </div>
        )}

        {/* Pane 3 (or 2 in standard mode): Preview / Results */}
        <div
          id="testing-preview-pane"
          data-testid="testing-preview-pane"
          className={cn(
            'flex flex-col overflow-hidden',
            isThreePane ? 'flex-1 md:flex-1' : 'flex-1',
            testing.activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'
          )}
        >
          <TestingPreview
            selectedTool={testing.selectedTool}
            error={testing.error}
            errorLine={testing.errorLine}
            errorColumn={testing.errorColumn}
            isSuccess={testing.isSuccess}
            schemaResult={testing.schemaResult}
            generatedAssertions={testing.generatedAssertions}
            mockJsonString={testing.mockJsonString}
            diffResult={testing.diffResult}
            wordWrap={testing.wordWrap}
            onCopyAll={testing.copyResult}
            onDownload={testing.downloadResult}
            onGenerateDiffAssertions={() =>
              testing.setSelectedTool('diff-assertions')
            }
            onToast={handleToast}
          />
        </div>
      </div>

      {/* Internal Toast Fallback */}
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
