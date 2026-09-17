/**
 * JSONZero — TransformSelector Component
 *
 * Categorized selector for transformation operations.
 * Fully keyboard accessible, screen-reader friendly, and touch-ready.
 */

import React from 'react'
import type { TransformType } from '../types'
import { TRANSFORM_DEFINITIONS } from '../utils'

export interface TransformSelectorProps {
  value: TransformType
  onChange: (value: TransformType) => void
  disabled?: boolean
}

export const TransformSelector: React.FC<TransformSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="transform-selector"
        className="text-xs font-medium text-text-muted select-none"
      >
        Transformation:
      </label>
      <div className="relative">
        <select
          id="transform-selector"
          data-testid="transform-selector"
          aria-label="Select Transformation"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as TransformType)}
          className="h-8 rounded border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-primary outline-none transition-colors hover:border-border-focus focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <optgroup
            label="SORT"
            className="bg-surface font-semibold text-text-muted"
          >
            <option
              value="sort-keys"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {TRANSFORM_DEFINITIONS['sort-keys'].label}
            </option>
            <option
              value="sort-recursive"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {TRANSFORM_DEFINITIONS['sort-recursive'].label}
            </option>
          </optgroup>

          <optgroup
            label="STRUCTURE"
            className="bg-surface font-semibold text-text-muted"
          >
            <option
              value="flatten"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {TRANSFORM_DEFINITIONS['flatten'].label}
            </option>
            <option
              value="unflatten"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {TRANSFORM_DEFINITIONS['unflatten'].label}
            </option>
          </optgroup>

          <optgroup
            label="ESCAPE"
            className="bg-surface font-semibold text-text-muted"
          >
            <option
              value="escape"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {TRANSFORM_DEFINITIONS['escape'].label}
            </option>
            <option
              value="unescape"
              className="bg-surface-elevated text-text-primary font-normal"
            >
              {TRANSFORM_DEFINITIONS['unescape'].label}
            </option>
          </optgroup>
        </select>
      </div>
    </div>
  )
}
