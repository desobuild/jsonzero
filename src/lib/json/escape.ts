/**
 * JSONZero — Pure JSON String Escape & Unescape Utilities
 *
 * Designed for developer workflows where JSON needs to be embedded
 * as a string literal (e.g., inside code, configuration, or CLI arguments).
 *
 * Escape:
 * - If valid JSON, minifies to compact form and serializes as a JSON string literal.
 * - If raw text, standard JSON string escaping is applied.
 *
 * Unescape:
 * - Supports quoted escaped JSON (`"{\"name\":\"Alice\"}"`) and raw escaped JSON (`{\"name\":\"Alice\"}`).
 * - Validates that the resulting unescaped string is valid JSON before returning pretty-printed JSON.
 * - Does not blindly strip backslashes.
 */

import { parseJSON } from '@/lib/json'

export interface EscapeResult {
  success: boolean
  result?: string
  error?: string
}

export interface UnescapeResult {
  success: boolean
  result?: string
  data?: unknown
  error?: string
}

/**
 * Escapes a JSON document or string for embedding as a JSON string literal.
 */
export function escapeJson(input: string): EscapeResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { success: true, result: '""' }
  }

  try {
    const parsed = parseJSON(trimmed)
    if (parsed.success) {
      // Minify first to produce a clean compact JSON string
      const minified = JSON.stringify(parsed.data)
      // JSON.stringify on the string turns it into an escaped JSON string literal
      const escaped = JSON.stringify(minified)
      return { success: true, result: escaped }
    } else {
      // For raw text that is not valid JSON, still produce a valid JSON string literal
      const escaped = JSON.stringify(input)
      return { success: true, result: escaped }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to escape input',
    }
  }
}

/**
 * Unescapes standard JSON string escape sequences.
 */
function unescapeStringContent(str: string): string {
  return str.replace(/\\(["\\/bfnrt]|u[0-9a-fA-F]{4})/g, (_, match: string) => {
    switch (match[0]) {
      case '"':
        return '"'
      case '\\':
        return '\\'
      case '/':
        return '/'
      case 'b':
        return '\b'
      case 'f':
        return '\f'
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      case 'u':
        return String.fromCharCode(parseInt(match.slice(1), 16))
      default:
        return match
    }
  })
}

/**
 * Unescapes an escaped JSON string back to formatted JSON.
 * Ensures the result is valid JSON before presenting.
 */
export function unescapeJson(input: string): UnescapeResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      success: false,
      error: 'Cannot unescape empty input. Please provide escaped JSON.',
    }
  }

  // Attempt 1: If input starts and ends with double quotes, try parsing as a JSON string literal
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    try {
      const unquoted = JSON.parse(trimmed)
      if (typeof unquoted === 'string') {
        const parsedInner = parseJSON(unquoted)
        if (parsedInner.success) {
          return {
            success: true,
            result: JSON.stringify(parsedInner.data, null, 2),
            data: parsedInner.data,
          }
        }
        // If unquoted was itself double-escaped, try unescaping inner string content
        const unescapedInner = unescapeStringContent(unquoted)
        const parsedDouble = parseJSON(unescapedInner)
        if (parsedDouble.success) {
          return {
            success: true,
            result: JSON.stringify(parsedDouble.data, null, 2),
            data: parsedDouble.data,
          }
        }
      }
    } catch {
      // Fall through to Attempt 2
    }
  }

  // Attempt 2: Unquoted escaped JSON (e.g., {\"name\":\"Alice\"})
  const unescaped = unescapeStringContent(trimmed)
  const parsed = parseJSON(unescaped)
  if (parsed.success) {
    return {
      success: true,
      result: JSON.stringify(parsed.data, null, 2),
      data: parsed.data,
    }
  }

  // Attempt 3: Try wrapping in quotes and JSON.parse if raw string has unhandled sequences
  try {
    const wrapped = `"${trimmed.replace(/"/g, '\\"')}"`
    const evaluated = JSON.parse(wrapped)
    const evaluatedParsed = parseJSON(evaluated)
    if (evaluatedParsed.success) {
      return {
        success: true,
        result: JSON.stringify(evaluatedParsed.data, null, 2),
        data: evaluatedParsed.data,
      }
    }
  } catch {
    // Ignore and proceed to error return
  }

  return {
    success: false,
    error: `Unable to unescape: Resulting content is not valid JSON.\n\n${parsed.error || 'Invalid JSON syntax after unescaping.'}`,
  }
}

/**
 * Heuristic detector for content that appears to be escaped JSON.
 */
export function isLikelyEscapedJson(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false

  const hasEscapedQuotes = trimmed.includes('\\"') || trimmed.includes('\\\\"')
  if (!hasEscapedQuotes) return false

  // Validate by attempting unescape
  const unescaped = unescapeJson(trimmed)
  return unescaped.success
}
