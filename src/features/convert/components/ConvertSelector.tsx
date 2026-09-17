/**
 * JSONZero — ConvertSelector Component
 *
 * Categorized dropdown selector for JSON conversion targets.
 * Fully keyboard accessible, screen-reader friendly, and touch-ready.
 */

import React from 'react'
import type { ConvertType } from '../types'
import { CONVERT_DEFINITIONS } from '../utils'

export interface ConvertSelectorProps {
  value: ConvertType
  onChange: (value: ConvertType) => void
  disabled?: boolean
}

export const ConvertSelector: React.FC<ConvertSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="convert-selector"
        className="text-xs font-medium text-text-muted select-none"
      >
        Target:
      </label>
      <div className="relative">
        <select
          id="convert-selector"
          data-testid="convert-selector"
          aria-label="Select Conversion Target"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as ConvertType)}
          className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-primary outline-none transition-colors hover:border-border-focus focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <optgroup
            label="DATA"
            className="bg-surface font-semibold text-text-muted"
          >
            <option
              value="table"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {CONVERT_DEFINITIONS['table'].label}
            </option>
            <option
              value="csv"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {CONVERT_DEFINITIONS['csv'].label}
            </option>
          </optgroup>

          <optgroup
            label="CODE"
            className="bg-surface font-semibold text-text-muted"
          >
            <option
              value="typescript"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {CONVERT_DEFINITIONS['typescript'].label}
            </option>
            <option
              value="dart"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {CONVERT_DEFINITIONS['dart'].label}
            </option>
          </optgroup>

          <optgroup
            label="SCHEMA"
            className="bg-surface font-semibold text-text-muted"
          >
            <option
              value="json-schema"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {CONVERT_DEFINITIONS['json-schema'].label}
            </option>
          </optgroup>
        </select>
      </div>
    </div>
  )
}
