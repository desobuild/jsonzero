import { useState, useCallback, useMemo } from 'react'
import {
  formatJSON,
  minifyJSON,
  validateJSON,
  computeJsonStats,
  type IndentOption,
} from '@/lib/json'
import type {
  FormatterState,
  FormatterActions,
  ValidationState,
  FormatMode,
  FormatterError,
} from '@/features/formatter/types'

export const DEFAULT_SAMPLE_JSON = JSON.stringify(
  {
    customer: {
      id: 'CUS-1042',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      active: true,
      profile: {
        country: 'India',
        verified: true,
      },
    },
    orders: [
      {
        id: 'ORD-1001',
        status: 'completed',
        total: 1499,
      },
      {
        id: 'ORD-1002',
        status: 'processing',
        total: 2499,
      },
    ],
  },
  null,
  2
)

export function useFormatter(
  initialInput: string = DEFAULT_SAMPLE_JSON
): FormatterState & FormatterActions {
  const [input, setInputState] = useState<string>(initialInput)
  const [output, setOutput] = useState<string>('')
  const [indent, setIndentState] = useState<IndentOption>('2')
  const [lastOperation, setLastOperation] = useState<FormatMode | null>(null)
  const [validationState, setValidationState] =
    useState<ValidationState>('idle')
  const [error, setError] = useState<FormatterError | null>(null)
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null)

  // Compute metrics in real-time
  const inputStats = useMemo(() => computeJsonStats(input), [input])
  const outputStats = useMemo(() => computeJsonStats(output), [output])

  const setInput = useCallback((value: string) => {
    setInputState(value)
    // Clear error state if input changed and was previously in error
    setError((prev) => (prev ? null : null))
    setValidationState((prev) => (prev === 'invalid' ? 'idle' : prev))
  }, [])

  const format = useCallback(() => {
    const startTime = performance.now()
    const result = formatJSON(input, indent)
    const elapsed = Math.max(
      0.1,
      Number((performance.now() - startTime).toFixed(1))
    )
    setProcessingTimeMs(elapsed)
    setLastOperation('format')

    if (result.success && result.formatted !== undefined) {
      setOutput(result.formatted)
      setValidationState('valid')
      setError(null)
    } else {
      setValidationState('invalid')
      setError({
        message: result.error ?? 'Invalid JSON syntax',
        line: result.errorLine,
        column: result.errorColumn,
        snippet: result.snippet,
      })
    }
  }, [input, indent])

  const minify = useCallback(() => {
    const startTime = performance.now()
    const result = minifyJSON(input)
    const elapsed = Math.max(
      0.1,
      Number((performance.now() - startTime).toFixed(1))
    )
    setProcessingTimeMs(elapsed)
    setLastOperation('minify')

    if (result.success && result.minified !== undefined) {
      setOutput(result.minified)
      setValidationState('valid')
      setError(null)
    } else {
      setValidationState('invalid')
      setError({
        message: result.error ?? 'Invalid JSON syntax',
        line: result.errorLine,
        column: result.errorColumn,
        snippet: result.snippet,
      })
    }
  }, [input])

  const validate = useCallback(() => {
    const startTime = performance.now()
    const result = validateJSON(input)
    const elapsed = Math.max(
      0.1,
      Number((performance.now() - startTime).toFixed(1))
    )
    setProcessingTimeMs(elapsed)
    setLastOperation('validate')

    if (result.valid) {
      setValidationState('valid')
      setError(null)
    } else {
      setValidationState('invalid')
      const firstErr = result.errors[0]
      setError({
        message: firstErr?.message ?? 'Invalid JSON syntax',
        line: firstErr?.line,
        column: firstErr?.column,
        snippet: firstErr?.snippet,
      })
    }
  }, [input])

  const clear = useCallback(() => {
    setInputState('')
    setOutput('')
    setValidationState('idle')
    setError(null)
    setLastOperation(null)
    setProcessingTimeMs(null)
  }, [])

  const setIndent = useCallback(
    (newIndent: IndentOption) => {
      setIndentState(newIndent)
      // If output is already formatted, re-format with new indentation
      if (output && lastOperation === 'format') {
        const res = formatJSON(input, newIndent)
        if (res.success && res.formatted !== undefined) {
          setOutput(res.formatted)
        }
      }
    },
    [input, output, lastOperation]
  )

  const loadText = useCallback((text: string) => {
    setInputState(text)
    setError(null)
    setValidationState('idle')
  }, [])

  const loadFile = useCallback(async (file: File): Promise<boolean> => {
    if (
      !file.name.toLowerCase().endsWith('.json') &&
      file.type !== 'application/json'
    ) {
      setError({
        message: 'Unsupported file type. Please select or drop a .json file.',
      })
      setValidationState('invalid')
      return false
    }

    try {
      const text = await file.text()
      setInputState(text)
      setError(null)
      setValidationState('idle')
      return true
    } catch {
      setError({
        message: 'Failed to read file locally. Please try again.',
      })
      setValidationState('invalid')
      return false
    }
  }, [])

  return {
    input,
    output,
    indent,
    lastOperation,
    validationState,
    error,
    processingTimeMs,
    inputStats,
    outputStats,
    setInput,
    setIndent,
    format,
    minify,
    validate,
    clear,
    loadFile,
    loadText,
  }
}
