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
}

/**
 * Parse a JSON string safely, returning a structured result.
 * Does not throw on invalid JSON.
 */
export function parseJSON(input: string): JsonParseResult {
  try {
    const data: unknown = JSON.parse(input)
    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parse error'
    return { success: false, error: message }
  }
}

/**
 * Format (pretty-print) a JSON string.
 * Returns the formatted string or an error result.
 */
export function formatJSON(
  input: string,
  indent: number = 2
): JsonParseResult & { formatted?: string } {
  const parsed = parseJSON(input)
  if (!parsed.success) return parsed
  return {
    ...parsed,
    formatted: JSON.stringify(parsed.data, null, indent),
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
    errors: [{ message: parsed.error ?? 'Invalid JSON' }],
  }
}
