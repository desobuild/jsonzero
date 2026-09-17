/**
 * JSONZero — useConvert Hook
 *
 * Coordinates convert state, reactive preview/table generation,
 * copy-to-clipboard, client-side downloading, and responsive mobile view switching.
 */

import { useState, useMemo, useCallback } from 'react'
import type { ToastType } from '@/components/ui/toast'
import { tableToTsv } from '@/lib/json/table'
import type { ConvertType, ConvertOptionsState } from '../types'
import {
  CONVERT_DEFINITIONS,
  DEFAULT_CONVERT_OPTIONS,
  executeConvert,
} from '../utils'

export interface UseConvertProps {
  initialInput?: string
  initialConvert?: ConvertType
  onToast?: (message: string, type?: ToastType) => void
}

export function useConvert({
  initialInput = '',
  initialConvert = 'table',
  onToast,
}: UseConvertProps = {}) {
  const [input, setInput] = useState<string>(initialInput)
  const [selectedConvert, setSelectedConvert] =
    useState<ConvertType>(initialConvert)
  const [options, setOptions] = useState<ConvertOptionsState>(
    DEFAULT_CONVERT_OPTIONS
  )
  const [wordWrap, setWordWrap] = useState<boolean>(false)
  const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'preview'>(
    'preview'
  )

  // Reactive and deterministic conversion execution
  const execution = useMemo(
    () => executeConvert(selectedConvert, input, options),
    [selectedConvert, input, options]
  )

  const definition = CONVERT_DEFINITIONS[selectedConvert]

  // Copy result to clipboard
  const copyResult = useCallback(async () => {
    if (!execution.success) {
      onToast?.('Cannot copy: Invalid JSON or conversion error.', 'error')
      return
    }

    let textToCopy = ''
    if (selectedConvert === 'table') {
      if (!execution.tableData || execution.tableData.rows.length === 0) {
        onToast?.('Nothing to copy: Table is empty.', 'info')
        return
      }
      textToCopy = tableToTsv(execution.tableData)
    } else {
      textToCopy = execution.result ?? ''
      if (!textToCopy.trim()) {
        onToast?.('Nothing to copy: Output is empty.', 'info')
        return
      }
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      const labelMap: Record<ConvertType, string> = {
        table: 'Table TSV',
        csv: 'CSV',
        typescript: 'TypeScript',
        dart: 'Dart',
        'json-schema': 'JSON Schema',
      }
      onToast?.(`Copied ${labelMap[selectedConvert]}`, 'success')
    } catch {
      onToast?.('Failed to copy to clipboard', 'error')
    }
  }, [execution, selectedConvert, onToast])

  // Download converted file directly in the browser
  const downloadResult = useCallback(() => {
    if (!execution.success) {
      onToast?.('Cannot download: Invalid JSON or conversion error.', 'error')
      return
    }

    let content = ''
    const filename = definition.defaultFileName
    const mimeType = definition.mimeType

    if (selectedConvert === 'table') {
      if (!execution.tableData || execution.tableData.rows.length === 0) {
        onToast?.('Nothing to download: Table is empty.', 'info')
        return
      }
      content = tableToTsv(execution.tableData)
    } else {
      content = execution.result ?? ''
      if (!content.trim()) {
        onToast?.('Nothing to download: Output is empty.', 'info')
        return
      }
    }

    try {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onToast?.(`Downloaded ${filename}`, 'success')
    } catch {
      onToast?.('Failed to download file', 'error')
    }
  }, [execution, selectedConvert, definition, onToast])

  // Reset to initial state
  const reset = useCallback(() => {
    setInput(initialInput)
    setSelectedConvert('table')
    setOptions(DEFAULT_CONVERT_OPTIONS)
    onToast?.('Reset convert workbench', 'info')
  }, [initialInput, onToast])

  return {
    input,
    setInput,
    selectedConvert,
    setSelectedConvert,
    options,
    setOptions,
    preview: execution.result ?? '',
    tableData: execution.tableData ?? null,
    error: execution.success ? null : (execution.error ?? 'Conversion failed'),
    errorLine: execution.errorLine,
    errorColumn: execution.errorColumn,
    isSuccess: execution.success,
    wordWrap,
    setWordWrap,
    activeMobileTab,
    setActiveMobileTab,
    definition,
    copyResult,
    downloadResult,
    reset,
  }
}
