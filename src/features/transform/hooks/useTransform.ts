/**
 * JSONZero — useTransform Hook
 *
 * Coordinates transform state, non-destructive preview generation,
 * copy-to-clipboard, reset, and editor document application.
 */

import { useState, useMemo, useCallback } from 'react'
import type { ToastType } from '@/components/ui/toast'
import { isLikelyEscapedJson } from '@/lib/json/escape'
import type { TransformType } from '../types'
import { executeTransform } from '../utils'

export interface UseTransformProps {
  initialInput?: string
  onApply?: (newContent: string) => void
  onToast?: (message: string, type?: ToastType) => void
}

export function useTransform({
  initialInput = '',
  onApply,
  onToast,
}: UseTransformProps = {}) {
  const [input, setInput] = useState<string>(initialInput)
  const [selectedTransform, setSelectedTransform] =
    useState<TransformType>('sort-recursive')
  const [wordWrap, setWordWrap] = useState<boolean>(false)
  const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'preview'>(
    'preview'
  )

  // Compute transformation preview reactively and deterministically
  const execution = useMemo(
    () => executeTransform(selectedTransform, input),
    [selectedTransform, input]
  )

  // Detect whether the input appears to be escaped JSON
  const isEscapedJsonDetected = useMemo(() => {
    if (selectedTransform === 'unescape') return false
    return isLikelyEscapedJson(input)
  }, [selectedTransform, input])

  // Apply transformed result to the active document and update local input
  const apply = useCallback(() => {
    if (!execution.success || execution.result === undefined) {
      onToast?.(
        execution.error || 'Cannot apply: Transformation failed.',
        'error'
      )
      return
    }

    if (!execution.result.trim() && !input.trim()) {
      onToast?.('Nothing to apply: Input is empty.', 'info')
      return
    }

    const appliedContent = execution.result
    setInput(appliedContent)
    onApply?.(appliedContent)
    onToast?.('Applied transformed JSON to editor', 'success')
  }, [execution, input, onApply, onToast])

  // Copy only the transformed result to clipboard
  const copyResult = useCallback(async () => {
    if (!execution.success || !execution.result) {
      onToast?.('No valid transformed result to copy.', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(execution.result)
      onToast?.('Copied transformed JSON', 'success')
    } catch {
      onToast?.('Failed to copy to clipboard', 'error')
    }
  }, [execution, onToast])

  // Reset to original input
  const reset = useCallback(() => {
    setInput(initialInput)
    setSelectedTransform('sort-recursive')
    onToast?.('Reset transform workbench', 'info')
  }, [initialInput, onToast])

  // Quick action when escaped JSON is detected
  const unescapeAndFormat = useCallback(() => {
    setSelectedTransform('unescape')
    onToast?.('Selected Unescape transformation', 'info')
  }, [onToast])

  return {
    input,
    setInput,
    selectedTransform,
    setSelectedTransform,
    preview: execution.result ?? '',
    error: execution.success ? null : (execution.error ?? 'Transform failed'),
    isSuccess: execution.success,
    isEscapedJsonDetected,
    wordWrap,
    setWordWrap,
    activeMobileTab,
    setActiveMobileTab,
    apply,
    copyResult,
    reset,
    unescapeAndFormat,
  }
}
