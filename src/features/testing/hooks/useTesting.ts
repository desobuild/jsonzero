/**
 * JSONZero — useTesting Hook
 *
 * Central state and execution hook for Phase 7 Developer & Testing Workbench.
 * Pure in-memory calculation with zero backend or network dependencies.
 */

import { useState, useMemo, useCallback } from 'react'
import type { ToastType } from '@/components/ui/toast'
import {
  parseJSON,
  validateJsonSchema,
  generateAssertions,
  generateDiffAssertions,
  generateMockJson,
  compareJson,
  type AssertionOptions,
  type MockJsonOptions,
  type SchemaValidationResult,
  type GeneratedAssertions,
  type DiffResult,
} from '@/lib/json'
import type { TestingType, MobileTestingTab } from '../types'
import {
  SAMPLE_TESTING_JSON,
  SAMPLE_SCHEMA_DATA,
  SAMPLE_SCHEMA,
  SAMPLE_EXPECTED_JSON,
  SAMPLE_ACTUAL_JSON,
  downloadFile,
  copyToClipboard,
} from '../utils'

export interface UseTestingProps {
  initialInput?: string
  initialTool?: TestingType
  onToast?: (message: string, type?: ToastType) => void
}

export function useTesting({
  initialInput = '',
  initialTool = 'api-assertions',
  onToast,
}: UseTestingProps = {}) {
  const [selectedTool, setSelectedTool] = useState<TestingType>(initialTool)
  const [input, setInput] = useState<string>(initialInput)
  const [schemaInput, setSchemaInput] = useState<string>(SAMPLE_SCHEMA)
  const [actualInput, setActualInput] = useState<string>(SAMPLE_ACTUAL_JSON)
  const [wordWrap, setWordWrap] = useState<boolean>(true)
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileTestingTab>('input')

  const [assertionOptions, setAssertionOptions] = useState<AssertionOptions>({
    includeStructure: true,
    includeTypes: true,
    includeValues: true,
    includeArrayLength: false,
    maxArrayItems: 5,
    includeStatusAssertion: true,
    responseVariable: 'body',
  })

  const [mockOptions, setMockOptions] = useState<MockJsonOptions>({
    stringValue: 'string',
    numberValue: 'zero',
    booleanValue: 'true',
    arrayStrategy: 'preserve',
  })

  // Parse primary input
  const parsedInput = useMemo(() => {
    if (!input.trim()) return null
    return parseJSON(input)
  }, [input])

  // Parse schema input
  const parsedSchema = useMemo(() => {
    if (selectedTool !== 'schema-validation' || !schemaInput.trim()) return null
    return parseJSON(schemaInput)
  }, [selectedTool, schemaInput])

  // Parse actual input (for diff/expected-actual)
  const parsedActual = useMemo(() => {
    if (
      (selectedTool !== 'expected-actual' &&
        selectedTool !== 'diff-assertions') ||
      !actualInput.trim()
    ) {
      return null
    }
    return parseJSON(actualInput)
  }, [selectedTool, actualInput])

  // Compute Schema Validation Result
  const schemaResult: SchemaValidationResult | null = useMemo(() => {
    if (selectedTool !== 'schema-validation') return null
    if (
      !parsedInput ||
      !parsedInput.success ||
      !parsedSchema ||
      !parsedSchema.success
    ) {
      return null
    }
    return validateJsonSchema(parsedInput.data, parsedSchema.data)
  }, [selectedTool, parsedInput, parsedSchema])

  // Compute Diff Result for Expected vs Actual / Diff Assertions
  const diffResult: DiffResult | null = useMemo(() => {
    if (
      selectedTool !== 'expected-actual' &&
      selectedTool !== 'diff-assertions'
    ) {
      return null
    }
    if (
      !parsedInput ||
      !parsedInput.success ||
      !parsedActual ||
      !parsedActual.success
    ) {
      return null
    }
    return compareJson(parsedInput.data, parsedActual.data)
  }, [selectedTool, parsedInput, parsedActual])

  // Compute Generated Assertions
  const generatedAssertions: GeneratedAssertions | null = useMemo(() => {
    if (
      selectedTool !== 'api-assertions' &&
      selectedTool !== 'playwright-assertions' &&
      selectedTool !== 'generic-assertions' &&
      selectedTool !== 'diff-assertions'
    ) {
      return null
    }

    if (!parsedInput || !parsedInput.success) return null

    if (selectedTool === 'diff-assertions') {
      if (!diffResult) return null
      return generateDiffAssertions(diffResult, parsedInput.data, {
        ...assertionOptions,
        style: 'api',
      })
    }

    const style =
      selectedTool === 'playwright-assertions'
        ? 'playwright'
        : selectedTool === 'generic-assertions'
          ? 'generic'
          : 'api'

    return generateAssertions(parsedInput.data, {
      ...assertionOptions,
      style,
    })
  }, [selectedTool, parsedInput, diffResult, assertionOptions])

  // Compute Mock JSON
  const mockJsonString = useMemo(() => {
    if (selectedTool !== 'mock-json') return ''
    if (!parsedInput || !parsedInput.success) return ''
    try {
      const mocked = generateMockJson(parsedInput.data, mockOptions)
      return JSON.stringify(mocked, null, 2)
    } catch {
      return ''
    }
  }, [selectedTool, parsedInput, mockOptions])

  // Check error states
  const { error, errorLine, errorColumn, isSuccess } = useMemo(() => {
    if (!input.trim()) {
      return { error: null, isSuccess: false }
    }

    if (parsedInput && !parsedInput.success) {
      return {
        error: `Input JSON error: ${parsedInput.error}`,
        errorLine: parsedInput.errorLine,
        errorColumn: parsedInput.errorColumn,
        isSuccess: false,
      }
    }

    if (selectedTool === 'schema-validation') {
      if (!schemaInput.trim()) {
        return {
          error: 'Please enter a JSON Schema to validate against',
          isSuccess: false,
        }
      }
      if (parsedSchema && !parsedSchema.success) {
        return {
          error: `Schema JSON error: ${parsedSchema.error}`,
          errorLine: parsedSchema.errorLine,
          errorColumn: parsedSchema.errorColumn,
          isSuccess: false,
        }
      }
      return { error: null, isSuccess: true }
    }

    if (
      selectedTool === 'expected-actual' ||
      selectedTool === 'diff-assertions'
    ) {
      if (!actualInput.trim()) {
        return {
          error: 'Please enter Actual JSON to compare with',
          isSuccess: false,
        }
      }
      if (parsedActual && !parsedActual.success) {
        return {
          error: `Actual JSON error: ${parsedActual.error}`,
          errorLine: parsedActual.errorLine,
          errorColumn: parsedActual.errorColumn,
          isSuccess: false,
        }
      }
      return { error: null, isSuccess: true }
    }

    return { error: null, isSuccess: true }
  }, [
    input,
    parsedInput,
    selectedTool,
    schemaInput,
    parsedSchema,
    actualInput,
    parsedActual,
  ])

  // Load sample data depending on current tool
  const loadSample = useCallback(() => {
    if (selectedTool === 'schema-validation') {
      setInput(SAMPLE_SCHEMA_DATA)
      setSchemaInput(SAMPLE_SCHEMA)
    } else if (
      selectedTool === 'expected-actual' ||
      selectedTool === 'diff-assertions'
    ) {
      setInput(SAMPLE_EXPECTED_JSON)
      setActualInput(SAMPLE_ACTUAL_JSON)
    } else {
      setInput(SAMPLE_TESTING_JSON)
    }
    onToast?.('Loaded sample data', 'info')
  }, [selectedTool, onToast])

  // Reset inputs
  const reset = useCallback(() => {
    setInput('')
    if (selectedTool === 'schema-validation') {
      setSchemaInput('')
    } else if (
      selectedTool === 'expected-actual' ||
      selectedTool === 'diff-assertions'
    ) {
      setActualInput('')
    }
    onToast?.('Cleared inputs', 'info')
  }, [selectedTool, onToast])

  // Generate printable text for copying/downloading
  const exportContent = useMemo(() => {
    if (selectedTool === 'schema-validation') {
      if (!schemaResult) return ''
      if (schemaResult.valid) {
        return 'JSON Schema Validation: PASSED\nThe JSON document strictly satisfies the schema.'
      }
      const lines = [
        `JSON Schema Validation: FAILED (${schemaResult.errors.length} error${
          schemaResult.errors.length === 1 ? '' : 's'
        })\n`,
      ]
      schemaResult.errors.forEach((err, idx) => {
        lines.push(
          `#${idx + 1} Path: ${err.path}\n   Keyword:  ${err.keyword}\n   Expected: ${err.expected}\n   Actual:   ${err.actual}\n   Message:  ${err.message}\n`
        )
      })
      return lines.join('\n')
    }

    if (selectedTool === 'mock-json') {
      return mockJsonString
    }

    if (selectedTool === 'expected-actual') {
      if (!diffResult) return ''
      const lines = [
        `Expected vs Actual Diff Summary:`,
        `Status: ${diffResult.summary.isIdentical ? 'Identical' : 'Differences detected'}`,
        `Added: ${diffResult.summary.added}, Removed: ${diffResult.summary.removed}, Changed: ${diffResult.summary.changed}, Total: ${diffResult.summary.total}\n`,
      ]
      for (const entry of diffResult.entries) {
        lines.push(
          `[${entry.kind.toUpperCase()}] ${entry.path}: ${
            entry.kind === 'changed'
              ? `${JSON.stringify(entry.oldValue)} -> ${JSON.stringify(entry.newValue)}`
              : entry.kind === 'added'
                ? JSON.stringify(entry.newValue)
                : JSON.stringify(entry.oldValue)
          }`
        )
      }
      return lines.join('\n')
    }

    if (generatedAssertions) {
      return generatedAssertions.code
    }

    return ''
  }, [
    selectedTool,
    schemaResult,
    mockJsonString,
    diffResult,
    generatedAssertions,
  ])

  const copyResult = useCallback(async () => {
    if (!exportContent) {
      onToast?.('No output available to copy', 'error')
      return
    }
    const success = await copyToClipboard(exportContent)
    if (success) {
      onToast?.('Copied to clipboard', 'success')
    } else {
      onToast?.('Failed to copy', 'error')
    }
  }, [exportContent, onToast])

  const downloadResult = useCallback(() => {
    if (!exportContent) {
      onToast?.('No output available to download', 'error')
      return
    }

    let filename = 'jsonzero-assertions.ts'
    let mimeType = 'text/plain'

    if (selectedTool === 'schema-validation') {
      filename = 'jsonzero-validation.txt'
    } else if (selectedTool === 'mock-json') {
      filename = 'jsonzero-mock.json'
      mimeType = 'application/json'
    } else if (selectedTool === 'expected-actual') {
      filename = 'jsonzero-diff.txt'
    } else if (selectedTool === 'generic-assertions') {
      filename = 'jsonzero-assertions.txt'
    }

    downloadFile(exportContent, filename, mimeType)
    onToast?.(`Downloaded ${filename}`, 'success')
  }, [exportContent, selectedTool, onToast])

  return {
    selectedTool,
    setSelectedTool,
    input,
    setInput,
    schemaInput,
    setSchemaInput,
    actualInput,
    setActualInput,
    wordWrap,
    setWordWrap,
    activeMobileTab,
    setActiveMobileTab,
    assertionOptions,
    setAssertionOptions,
    mockOptions,
    setMockOptions,
    parsedInput,
    parsedSchema,
    parsedActual,
    schemaResult,
    diffResult,
    generatedAssertions,
    mockJsonString,
    error,
    errorLine,
    errorColumn,
    isSuccess,
    exportContent,
    loadSample,
    reset,
    copyResult,
    downloadResult,
  }
}
