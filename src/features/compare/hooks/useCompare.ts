import { useState, useMemo, useCallback } from 'react'
import { parseJSON, formatJSON } from '@/lib/json'
import { compareJson } from '@/lib/json/diff'
import type { ToastType } from '@/components/ui/toast'
import type {
  CompareState,
  CompareActions,
  CompareMobileTab,
} from '@/features/compare/types'
import { SAMPLE_JSON_A, SAMPLE_JSON_B } from '@/features/compare/utils'

export interface UseCompareOptions {
  initialJsonA?: string
  initialJsonB?: string
  onToast?: (message: string, type?: ToastType) => void
}

export function useCompare(
  options: UseCompareOptions = {}
): CompareState & CompareActions {
  const {
    initialJsonA = SAMPLE_JSON_A,
    initialJsonB = SAMPLE_JSON_B,
    onToast,
  } = options

  const [jsonA, setJsonA] = useState(initialJsonA)
  const [jsonB, setJsonB] = useState(initialJsonB)
  const [wordWrap, setWordWrap] = useState(false)
  const [activeMobileTab, setActiveMobileTab] =
    useState<CompareMobileTab>('diff')

  // Parse both inputs independently
  const parsedA = useMemo(() => parseJSON(jsonA), [jsonA])
  const parsedB = useMemo(() => parseJSON(jsonB), [jsonB])

  // Compute diff when both inputs are valid
  const diffResult = useMemo(() => {
    if (!parsedA.success || !parsedB.success) {
      return null
    }
    return compareJson(parsedA.data, parsedB.data)
  }, [parsedA, parsedB])

  // Format Left (JSON A)
  const formatA = useCallback(() => {
    if (!jsonA.trim()) return
    const result = formatJSON(jsonA)
    if (result.success && result.formatted) {
      setJsonA(result.formatted)
      onToast?.('Formatted JSON A', 'success')
    } else {
      onToast?.('Cannot format JSON A: Invalid JSON syntax', 'error')
    }
  }, [jsonA, onToast])

  // Format Right (JSON B)
  const formatB = useCallback(() => {
    if (!jsonB.trim()) return
    const result = formatJSON(jsonB)
    if (result.success && result.formatted) {
      setJsonB(result.formatted)
      onToast?.('Formatted JSON B', 'success')
    } else {
      onToast?.('Cannot format JSON B: Invalid JSON syntax', 'error')
    }
  }, [jsonB, onToast])

  const clearA = useCallback(() => {
    setJsonA('')
    onToast?.('Cleared JSON A', 'info')
  }, [onToast])

  const clearB = useCallback(() => {
    setJsonB('')
    onToast?.('Cleared JSON B', 'info')
  }, [onToast])

  const clearAll = useCallback(() => {
    setJsonA('')
    setJsonB('')
    onToast?.('Cleared both inputs', 'info')
  }, [onToast])

  const swapInputs = useCallback(() => {
    setJsonA(jsonB)
    setJsonB(jsonA)
    onToast?.('Swapped JSON A and JSON B', 'info')
  }, [jsonA, jsonB, onToast])

  const loadSample = useCallback(() => {
    setJsonA(SAMPLE_JSON_A)
    setJsonB(SAMPLE_JSON_B)
    onToast?.('Loaded sample JSON comparison', 'info')
  }, [onToast])

  return {
    jsonA,
    jsonB,
    parsedA,
    parsedB,
    diffResult,
    wordWrap,
    activeMobileTab,
    setJsonA,
    setJsonB,
    formatA,
    formatB,
    clearA,
    clearB,
    clearAll,
    swapInputs,
    loadSample,
    setWordWrap,
    setActiveMobileTab,
  }
}
