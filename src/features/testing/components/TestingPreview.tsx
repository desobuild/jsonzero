/**
 * JSONZero — TestingPreview Component
 *
 * Primary preview area for Phase 7 Testing Workbench.
 * Renders Schema validation results, Assertions, Mock output, or Expected vs Actual diffs.
 */

import React from 'react'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  TestingType,
  GeneratedAssertions,
  SchemaValidationResult,
  DiffResult,
} from '../types'
import { AssertionList } from './AssertionList'
import { MockJsonPanel } from './MockJsonPanel'
import { ExpectedActualPanel } from './ExpectedActualPanel'
import { copyToClipboard } from '../utils'

export interface TestingPreviewProps {
  selectedTool: TestingType
  error: string | null
  errorLine?: number
  errorColumn?: number
  isSuccess: boolean
  schemaResult: SchemaValidationResult | null
  generatedAssertions: GeneratedAssertions | null
  mockJsonString: string
  diffResult: DiffResult | null
  wordWrap: boolean
  onCopyAll: () => void
  onDownload: () => void
  onGenerateDiffAssertions: () => void
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void
}

export const TestingPreview: React.FC<TestingPreviewProps> = ({
  selectedTool,
  error,
  errorLine,
  errorColumn,
  schemaResult,
  generatedAssertions,
  mockJsonString,
  diffResult,
  wordWrap,
  onCopyAll,
  onDownload,
  onGenerateDiffAssertions,
  onToast,
}) => {
  const [copiedErrorIndex, setCopiedErrorIndex] = React.useState<number | null>(
    null
  )

  // 1. Error Banner
  if (error) {
    return (
      <div
        role="alert"
        data-testid="testing-error-alert"
        className="flex flex-1 flex-col items-center justify-center p-6 text-center bg-background"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Unable to Process Input
        </h3>
        <p className="max-w-md font-mono text-xs text-error mb-2">{error}</p>
        {errorLine && (
          <span className="font-mono text-3xs text-text-muted">
            Line {errorLine}
            {errorColumn ? `, Column ${errorColumn}` : ''}
          </span>
        )}
      </div>
    )
  }

  // 2. Schema Validation Result
  if (selectedTool === 'schema-validation') {
    if (!schemaResult) {
      return (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-muted bg-background">
          Enter JSON data and a JSON Schema to see validation results.
        </div>
      )
    }

    if (schemaResult.valid) {
      return (
        <div
          data-testid="schema-valid-result"
          className="flex flex-1 flex-col items-center justify-center p-6 text-center bg-background"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-success mb-1">
            Schema Validation: Valid
          </h3>
          <p className="max-w-sm text-xs text-text-secondary">
            The JSON document strictly satisfies the specified schema. Zero
            errors found.
          </p>
        </div>
      )
    }

    return (
      <div
        data-testid="schema-invalid-result"
        className="flex flex-1 flex-col overflow-hidden bg-background"
      >
        {/* Validation Error Header */}
        <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-error">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                Invalid — {schemaResult.errors.length}{' '}
                {schemaResult.errors.length === 1 ? 'error' : 'errors'}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onCopyAll}
            data-testid="copy-validation-report-btn"
            aria-label="Copy full validation report"
            className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
          >
            <Copy className="h-3 w-3" />
            <span className="hidden sm:inline">Copy Report</span>
          </Button>
        </div>

        {/* Structured error cards */}
        <div className="flex flex-1 flex-col overflow-y-auto p-3 space-y-2">
          {schemaResult.errors.map((err, idx) => (
            <div
              key={`${err.path}-${err.keyword}-${idx}`}
              data-testid="schema-error-item"
              className="group relative rounded border border-border/70 bg-surface-elevated/40 p-2.5 font-mono text-xs transition-colors hover:border-border-focus"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-accent">{err.path}</span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-3xs font-sans uppercase font-medium text-text-muted">
                    {err.keyword}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const text = `${err.path}: [${err.keyword}] ${err.message}`
                    const ok = await copyToClipboard(text)
                    if (ok) {
                      setCopiedErrorIndex(idx)
                      onToast?.('Copied error', 'success')
                      setTimeout(() => setCopiedErrorIndex(null), 2000)
                    }
                  }}
                  aria-label={`Copy error at ${err.path}`}
                  className="h-6 w-6 p-0 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedErrorIndex === idx ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              <p className="text-text-primary mb-1 text-xs">{err.message}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-3xs text-text-muted">
                <span>
                  Expected: <span className="text-success">{err.expected}</span>
                </span>
                <span>
                  Actual: <span className="text-error">{err.actual}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 3. Expected vs Actual Diff Workflow
  if (selectedTool === 'expected-actual') {
    return (
      <ExpectedActualPanel
        diffResult={diffResult}
        onGenerateAssertions={onGenerateDiffAssertions}
        onCopyDiff={onCopyAll}
      />
    )
  }

  // 4. Mock JSON Result
  if (selectedTool === 'mock-json') {
    return (
      <MockJsonPanel
        mockJsonString={mockJsonString}
        wordWrap={wordWrap}
        onCopy={onCopyAll}
        onDownload={onDownload}
      />
    )
  }

  // 5. Assertions Result
  if (generatedAssertions) {
    return (
      <AssertionList
        assertions={generatedAssertions}
        wordWrap={wordWrap}
        onCopyAll={onCopyAll}
        onToast={onToast}
      />
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-muted bg-background">
      Enter valid JSON to generate test assertions.
    </div>
  )
}
