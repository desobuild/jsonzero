/**
 * JSONZero — TransformOptions Component
 *
 * Displays operation description, notation guidelines,
 * and contextual suggestions (such as "Looks like escaped JSON").
 */

import React from 'react'
import { Sparkles, Info, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TransformType } from '../types'
import { TRANSFORM_DEFINITIONS } from '../utils'

export interface TransformOptionsProps {
  selectedTransform: TransformType
  isEscapedJsonDetected: boolean
  onUnescapeAndFormat: () => void
}

export const TransformOptions: React.FC<TransformOptionsProps> = ({
  selectedTransform,
  isEscapedJsonDetected,
  onUnescapeAndFormat,
}) => {
  const currentDef = TRANSFORM_DEFINITIONS[selectedTransform]

  return (
    <div
      id="transform-options-bar"
      className="flex flex-col border-b border-border bg-surface px-4 py-2 text-xs"
    >
      {/* Escaped JSON Suggestion Banner */}
      {isEscapedJsonDetected && (
        <div
          role="alert"
          data-testid="escaped-json-banner"
          className="mb-2 flex items-center justify-between rounded border border-accent/30 bg-accent/10 px-3 py-1.5 text-accent shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-accent animate-pulse" />
            <span className="font-medium">Looks like escaped JSON</span>
          </div>
          <Button
            size="sm"
            variant="accent"
            data-testid="unescape-detected-btn"
            onClick={onUnescapeAndFormat}
            className="h-6 px-2.5 text-3xs font-semibold text-accent-foreground hover:opacity-90"
          >
            Unescape & Format
          </Button>
        </div>
      )}

      {/* Transform Description & Privacy Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-text-muted">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-text-muted shrink-0" />
          <span>{currentDef.description}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-3xs text-text-muted">
            <ShieldCheck className="h-3 w-3 text-accent" />
            100% In-Browser
          </span>
          <span className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-3xs text-text-secondary">
            {currentDef.group}
          </span>
        </div>
      </div>
    </div>
  )
}
