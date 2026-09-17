/**
 * JSONZero — JSON Processing Boundary
 *
 * All JSON processing logic is centralized here, independent from UI components.
 * This module provides pure utility functions for JSON operations.
 *
 * JSON processing in JSONZero:
 * - Happens locally in the browser
 * - Never uploads JSON to any server
 * - Never sends JSON to third-party APIs
 * - Never sends JSON to analytics services
 */

/** Result of a JSON parse attempt */
export interface JsonParseResult {
  success: boolean
  data?: unknown
  error?: string
  /** Line number where the error occurred (1-indexed) */
  errorLine?: number
  /** Column number where the error occurred (1-indexed) */
  errorColumn?: number
  /** Context snippet around the error line */
  snippet?: string
}

/** Result of a JSON validation */
export interface JsonValidationResult {
  valid: boolean
  errors: JsonValidationError[]
}

export interface JsonValidationError {
  message: string
  line?: number
  column?: number
  snippet?: string
}

/** Statistics about a JSON document */
export interface JsonStats {
  lineCount: number
  characterCount: number
  byteCount: number
  keyCount: number
}

/** Indentation options supported for formatting */
export type IndentOption = '2' | '4' | 'tab' | number

/**
 * Resolve an IndentOption to a string or number accepted by JSON.stringify
 */
export function resolveIndent(indent: IndentOption): string | number {
  if (indent === 'tab') return '\t'
  if (indent === '4' || indent === 4) return 4
  return 2
}

/**
 * Calculate 1-indexed line and column from character position offset in a string
 */
export function getLineAndColumnFromPosition(
  text: string,
  position: number
): { line: number; column: number } {
  const safePos = Math.max(0, Math.min(position, text.length))
  const slice = text.slice(0, safePos)
  const lines = slice.split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1
  return { line, column }
}

/**
 * Extract error line, column, and clean message from a SyntaxError
 */
export function extractErrorDetails(
  input: string,
  err: unknown
): {
  error: string
  errorLine?: number
  errorColumn?: number
  snippet?: string
} {
  const rawMessage =
    err instanceof Error ? err.message : 'Invalid JSON: Unknown parse error'

  let line: number | undefined
  let column: number | undefined

  // 1. Check for explicit "line X column Y" in error message (Chrome 115+, Safari, Firefox)
  const lineColMatch = rawMessage.match(
    /(?:line\s*(\d+)[^\d]+column\s*(\d+))|(?:line\s*(\d+),\s*column\s*(\d+))/i
  )
  if (lineColMatch) {
    line = parseInt(lineColMatch[1] || lineColMatch[3], 10)
    column = parseInt(lineColMatch[2] || lineColMatch[4], 10)
  }

  // 2. Check for "position X" in error message (Standard V8 format)
  if (line === undefined) {
    const posMatch = rawMessage.match(/position\s+(\d+)/i)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const loc = getLineAndColumnFromPosition(input, pos)
      line = loc.line
      column = loc.column
    }
  }

  // 3. Check for standalone "line X" (some Firefox formats)
  if (line === undefined) {
    const lineMatch = rawMessage.match(/line\s+(\d+)/i)
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10)
    }
  }

  // 4. Generate snippet if line is known
  let snippet: string | undefined
  if (line !== undefined) {
    const allLines = input.split('\n')
    if (line > 0 && line <= allLines.length) {
      const offendingLine = allLines[line - 1]
      const trimmed = offendingLine.slice(0, 80)
      snippet = trimmed
    }
  }

  // 5. Clean up error message for display
  let cleanMessage = rawMessage
    .replace(/^JSON\.parse:\s*/i, '')
    .replace(/^JSON Parse error:\s*/i, '')
    .replace(/\s+in JSON at position \d+.*$/i, '')
    .replace(/\s+at position \d+.*$/i, '')
    .trim()

  if (!cleanMessage) {
    cleanMessage = 'Invalid JSON syntax'
  }

  return {
    error: cleanMessage,
    errorLine: line,
    errorColumn: column,
    snippet,
  }
}

/**
 * Parse a JSON string safely, returning a structured result.
 * Does not throw on invalid JSON.
 */
export function parseJSON(input: string): JsonParseResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'JSON string is empty',
      errorLine: 1,
      errorColumn: 1,
    }
  }

  try {
    const data: unknown = JSON.parse(input)
    return { success: true, data }
  } catch (err) {
    const details = extractErrorDetails(input, err)
    return {
      success: false,
      error: details.error,
      errorLine: details.errorLine,
      errorColumn: details.errorColumn,
      snippet: details.snippet,
    }
  }
}

/**
 * Format (pretty-print) a JSON string.
 * Returns the formatted string or an error result.
 */
export function formatJSON(
  input: string,
  indent: IndentOption = 2
): JsonParseResult & { formatted?: string } {
  const parsed = parseJSON(input)
  if (!parsed.success) return parsed
  const indentVal = resolveIndent(indent)
  return {
    ...parsed,
    formatted: JSON.stringify(parsed.data, null, indentVal),
  }
}

/**
 * Minify a JSON string (remove all whitespace).
 * Returns the minified string or an error result.
 */
export function minifyJSON(
  input: string
): JsonParseResult & { minified?: string } {
  const parsed = parseJSON(input)
  if (!parsed.success) return parsed
  return {
    ...parsed,
    minified: JSON.stringify(parsed.data),
  }
}

/**
 * Validate a JSON string.
 * Returns whether the JSON is valid and any errors found.
 */
export function validateJSON(input: string): JsonValidationResult {
  const parsed = parseJSON(input)
  if (parsed.success) {
    return { valid: true, errors: [] }
  }
  return {
    valid: false,
    errors: [
      {
        message: parsed.error ?? 'Invalid JSON',
        line: parsed.errorLine,
        column: parsed.errorColumn,
        snippet: parsed.snippet,
      },
    ],
  }
}

/**
 * Recursively count all keys across nested objects within a JSON value
 */
export function countJsonKeys(data: unknown): number {
  if (data === null || typeof data !== 'object') {
    return 0
  }
  if (Array.isArray(data)) {
    return data.reduce((sum, item) => sum + countJsonKeys(item), 0)
  }
  const record = data as Record<string, unknown>
  const keys = Object.keys(record)
  let count = keys.length
  for (const key of keys) {
    count += countJsonKeys(record[key])
  }
  return count
}

/**
 * Compute real-time metrics for a JSON document
 */
export function computeJsonStats(input: string, data?: unknown): JsonStats {
  if (!input) {
    return {
      lineCount: 0,
      characterCount: 0,
      byteCount: 0,
      keyCount: 0,
    }
  }

  const lineCount = input.split('\n').length
  const characterCount = input.length
  const byteCount = new TextEncoder().encode(input).length

  let keyCount = 0
  if (data !== undefined && data !== null) {
    keyCount = countJsonKeys(data)
  } else {
    try {
      keyCount = countJsonKeys(JSON.parse(input))
    } catch {
      keyCount = 0
    }
  }

  return {
    lineCount,
    characterCount,
    byteCount,
    keyCount,
  }
}

export * from '@/lib/json/tokenizer'
