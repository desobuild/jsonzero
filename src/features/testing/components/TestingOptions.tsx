/**
 * JSONZero — TestingOptions Component
 *
 * Contextual options bar that dynamically adapts to the selected testing tool.
 */

import React from 'react'
import type { TestingType } from '../types'
import type { AssertionOptions } from '@/lib/json/assertions'
import type { MockJsonOptions } from '@/lib/json/mock'

export interface TestingOptionsProps {
  selectedTool: TestingType
  assertionOptions: AssertionOptions
  onAssertionOptionsChange: (opts: AssertionOptions) => void
  mockOptions: MockJsonOptions
  onMockOptionsChange: (opts: MockJsonOptions) => void
}

export const TestingOptions: React.FC<TestingOptionsProps> = ({
  selectedTool,
  assertionOptions,
  onAssertionOptionsChange,
  mockOptions,
  onMockOptionsChange,
}) => {
  const isAssertionTool =
    selectedTool === 'api-assertions' ||
    selectedTool === 'playwright-assertions' ||
    selectedTool === 'generic-assertions' ||
    selectedTool === 'diff-assertions'

  if (selectedTool === 'schema-validation') {
    return (
      <div className="flex min-h-8 items-center justify-between gap-2 border-b border-border bg-surface-elevated/40 px-3 py-1 text-3xs text-text-muted">
        <span className="font-mono">JSON Schema 2020-12 compatible subset</span>
        <span className="hidden sm:inline text-text-secondary">
          Supported: types, properties, required, additionalProperties, min/max,
          uniqueItems, patterns, anyOf/oneOf/allOf
        </span>
      </div>
    )
  }

  if (selectedTool === 'expected-actual') {
    return (
      <div className="flex min-h-8 items-center justify-between gap-2 border-b border-border bg-surface-elevated/40 px-3 py-1 text-3xs text-text-muted">
        <span className="font-mono">Expected vs Actual Diff Workflow</span>
        <span className="hidden sm:inline text-text-secondary">
          Compare API responses recursively using Phase 4 structural diff engine
        </span>
      </div>
    )
  }

  if (selectedTool === 'mock-json') {
    return (
      <div className="flex flex-wrap items-center gap-4 border-b border-border bg-surface-elevated/40 px-3 py-1.5 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="mock-strings"
            className="font-medium text-text-muted text-3xs"
          >
            Strings:
          </label>
          <select
            id="mock-strings"
            data-testid="mock-strings-select"
            value={mockOptions.stringValue || 'string'}
            onChange={(e) =>
              onMockOptionsChange({
                ...mockOptions,
                stringValue: e.target.value as 'string' | 'preserve',
              })
            }
            className="h-6 rounded border border-border bg-surface px-2 py-0.5 text-3xs text-text-primary"
          >
            <option value="string">Generic placeholder</option>
            <option value="preserve">Preserve original</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="mock-numbers"
            className="font-medium text-text-muted text-3xs"
          >
            Numbers:
          </label>
          <select
            id="mock-numbers"
            data-testid="mock-numbers-select"
            value={mockOptions.numberValue || 'zero'}
            onChange={(e) =>
              onMockOptionsChange({
                ...mockOptions,
                numberValue: e.target.value as 'zero' | 'preserve',
              })
            }
            className="h-6 rounded border border-border bg-surface px-2 py-0.5 text-3xs text-text-primary"
          >
            <option value="zero">Zero (0)</option>
            <option value="preserve">Preserve original</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="mock-booleans"
            className="font-medium text-text-muted text-3xs"
          >
            Booleans:
          </label>
          <select
            id="mock-booleans"
            data-testid="mock-booleans-select"
            value={mockOptions.booleanValue || 'true'}
            onChange={(e) =>
              onMockOptionsChange({
                ...mockOptions,
                booleanValue: e.target.value as 'true' | 'preserve',
              })
            }
            className="h-6 rounded border border-border bg-surface px-2 py-0.5 text-3xs text-text-primary"
          >
            <option value="true">True</option>
            <option value="preserve">Preserve original</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="mock-arrays"
            className="font-medium text-text-muted text-3xs"
          >
            Arrays:
          </label>
          <select
            id="mock-arrays"
            data-testid="mock-arrays-select"
            value={mockOptions.arrayStrategy || 'preserve'}
            onChange={(e) =>
              onMockOptionsChange({
                ...mockOptions,
                arrayStrategy: e.target.value as 'preserve' | 'single',
              })
            }
            className="h-6 rounded border border-border bg-surface px-2 py-0.5 text-3xs text-text-primary"
          >
            <option value="preserve">Preserve length</option>
            <option value="single">Sample (1 item)</option>
          </select>
        </div>
      </div>
    )
  }

  if (isAssertionTool) {
    return (
      <div className="flex flex-wrap items-center gap-4 border-b border-border bg-surface-elevated/40 px-3 py-1.5 text-xs text-text-secondary">
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-3xs">
          <input
            type="checkbox"
            data-testid="opt-structure"
            checked={assertionOptions.includeStructure ?? true}
            onChange={(e) =>
              onAssertionOptionsChange({
                ...assertionOptions,
                includeStructure: e.target.checked,
              })
            }
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span>Structure</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none text-3xs">
          <input
            type="checkbox"
            data-testid="opt-types"
            checked={assertionOptions.includeTypes ?? true}
            onChange={(e) =>
              onAssertionOptionsChange({
                ...assertionOptions,
                includeTypes: e.target.checked,
              })
            }
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span>Types</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none text-3xs">
          <input
            type="checkbox"
            data-testid="opt-values"
            checked={assertionOptions.includeValues ?? true}
            onChange={(e) =>
              onAssertionOptionsChange({
                ...assertionOptions,
                includeValues: e.target.checked,
              })
            }
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span>Values</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none text-3xs">
          <input
            type="checkbox"
            data-testid="opt-array-length"
            checked={assertionOptions.includeArrayLength ?? false}
            onChange={(e) =>
              onAssertionOptionsChange({
                ...assertionOptions,
                includeArrayLength: e.target.checked,
              })
            }
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span>Array length</span>
        </label>

        {selectedTool === 'playwright-assertions' && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-3xs">
            <input
              type="checkbox"
              data-testid="opt-status-assertion"
              checked={assertionOptions.includeStatusAssertion ?? true}
              onChange={(e) =>
                onAssertionOptionsChange({
                  ...assertionOptions,
                  includeStatusAssertion: e.target.checked,
                })
              }
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span>Response status</span>
          </label>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <label
            htmlFor="array-sample-limit"
            className="font-medium text-text-muted text-3xs"
          >
            Sample limit:
          </label>
          <select
            id="array-sample-limit"
            data-testid="array-sample-limit-select"
            value={assertionOptions.maxArrayItems || 5}
            onChange={(e) =>
              onAssertionOptionsChange({
                ...assertionOptions,
                maxArrayItems: Number(e.target.value),
              })
            }
            className="h-6 rounded border border-border bg-surface px-2 py-0.5 text-3xs text-text-primary"
          >
            <option value="3">3 items</option>
            <option value="5">5 items</option>
            <option value="10">10 items</option>
          </select>
        </div>
      </div>
    )
  }

  return null
}
