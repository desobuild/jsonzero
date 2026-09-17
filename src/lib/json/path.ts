/**
 * JSONZero — JSON Path Formatting and Helpers
 *
 * Generates valid, unambiguous JSONPath strings for tree nodes and queries.
 * Safe handling of object keys with special characters, spaces, and numbers.
 */

const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

/**
 * Format a single segment (object key or array index) into JSONPath notation.
 */
export function formatPathSegment(segment: string | number): string {
  if (typeof segment === 'number') {
    return `[${segment}]`
  }

  if (VALID_IDENTIFIER_REGEX.test(segment)) {
    return `.${segment}`
  }

  // Escape backslashes and double quotes
  const escaped = segment.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `["${escaped}"]`
}

/**
 * Formats a series of path segments into a full JSONPath string (e.g. `$.user["first-name"][0]`).
 */
export function formatJsonPath(segments: (string | number)[]): string {
  if (segments.length === 0) {
    return '$'
  }

  let result = '$'
  for (const seg of segments) {
    result += formatPathSegment(seg)
  }
  return result
}

/**
 * Appends a segment to an existing JSONPath.
 */
export function appendJsonPath(
  currentPath: string,
  segment: string | number
): string {
  const base = currentPath || '$'
  return `${base}${formatPathSegment(segment)}`
}
