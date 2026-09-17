/**
 * JSONZero — TestingSelector Component
 *
 * Categorized dropdown selector for testing and developer tools.
 * Fully keyboard accessible and consistent with Phase 6 selector styling.
 */

import React from 'react'
import type { TestingType } from '../types'
import { TESTING_TOOLS } from '../utils'

export interface TestingSelectorProps {
  value: TestingType
  onChange: (value: TestingType) => void
  disabled?: boolean
}

export const TestingSelector: React.FC<TestingSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const validateTools = TESTING_TOOLS.filter((t) => t.category === 'VALIDATE')
  const assertionTools = TESTING_TOOLS.filter(
    (t) => t.category === 'ASSERTIONS'
  )
  const mockTools = TESTING_TOOLS.filter((t) => t.category === 'MOCK')
  const workflowTools = TESTING_TOOLS.filter((t) => t.category === 'WORKFLOW')

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="testing-selector"
        className="text-xs font-medium text-text-muted select-none"
      >
        Tool:
      </label>
      <div className="relative">
        <select
          id="testing-selector"
          data-testid="testing-selector"
          aria-label="Select Testing Tool"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as TestingType)}
          className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-primary outline-none transition-colors hover:border-border-focus focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <optgroup
            label="VALIDATE"
            className="bg-surface font-semibold text-text-muted"
          >
            {validateTools.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-surface-elevated text-text-primary font-normal"
              >
                {t.label}
              </option>
            ))}
          </optgroup>

          <optgroup
            label="ASSERTIONS"
            className="bg-surface font-semibold text-text-muted"
          >
            {assertionTools.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-surface-elevated text-text-primary font-normal"
              >
                {t.label}
              </option>
            ))}
          </optgroup>

          <optgroup
            label="MOCK"
            className="bg-surface font-semibold text-text-muted"
          >
            {mockTools.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-surface-elevated text-text-primary font-normal"
              >
                {t.label}
              </option>
            ))}
          </optgroup>

          <optgroup
            label="WORKFLOW"
            className="bg-surface font-semibold text-text-muted"
          >
            {workflowTools.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-surface-elevated text-text-primary font-normal"
              >
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  )
}
