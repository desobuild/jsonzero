/**
 * JSONZero — JSON to CSV Conversion Engine
 *
 * Converts arbitrary JSON documents into standards-compliant CSV (RFC 4180).
 * Nested objects and arrays are serialized as compact JSON strings inside quoted CSV cells.
 * Pure, deterministic, and 100% client-side with zero dependencies.
 */

export interface CsvOptions {
  delimiter?: ',' | '\t' | ';'
  includeHeader?: boolean
  newline?: '\n' | '\r\n'
}

/**
 * Escape a value according to RFC 4180 CSV specifications.
 * Values containing delimiters, quotes, or newlines must be enclosed in quotes,
 * and quotes inside the value must be escaped with double quotes ("").
 */
export function escapeCsvCell(value: unknown, delimiter: string = ','): string {
  if (value === undefined || value === null) {
    return ''
  }

  let str: string
  if (typeof value === 'object') {
    str = JSON.stringify(value)
  } else if (typeof value === 'boolean') {
    str = value ? 'true' : 'false'
  } else {
    str = String(value)
  }

  const needsQuoting =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')

  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Convert any JSON value to RFC 4180 compliant CSV.
 */
export function jsonToCsv(data: unknown, options: CsvOptions = {}): string {
  const delimiter = options.delimiter ?? ','
  const includeHeader = options.includeHeader ?? true
  const newline = options.newline ?? '\n'

  if (data === undefined || data === null) {
    return includeHeader ? `value${newline}` : ''
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return ''
    }

    const hasObjects = data.some(
      (item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    )

    if (hasObjects) {
      // Collect union of columns in order of appearance
      const columns: string[] = []
      const seen = new Set<string>()

      for (const item of data) {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          for (const key of Object.keys(item as Record<string, unknown>)) {
            if (!seen.has(key)) {
              seen.add(key)
              columns.push(key)
            }
          }
        }
      }

      if (columns.length === 0) {
        return ''
      }

      const lines: string[] = []
      if (includeHeader) {
        lines.push(
          columns.map((col) => escapeCsvCell(col, delimiter)).join(delimiter)
        )
      }

      for (const item of data) {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          const rec = item as Record<string, unknown>
          const rowCells = columns.map((col) =>
            escapeCsvCell(rec[col], delimiter)
          )
          lines.push(rowCells.join(delimiter))
        } else {
          // If non-object is mixed in, put in first column
          const rowCells = columns.map((_, idx) =>
            idx === 0 ? escapeCsvCell(item, delimiter) : ''
          )
          lines.push(rowCells.join(delimiter))
        }
      }

      return lines.join(newline)
    }

    // Array of primitives or nested arrays
    const lines: string[] = []
    if (includeHeader) {
      lines.push('value')
    }
    for (const item of data) {
      lines.push(escapeCsvCell(item, delimiter))
    }
    return lines.join(newline)
  }

  // Handle single Object
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length === 0) {
      return ''
    }

    const columns = entries.map(([k]) => k)
    const values = entries.map(([, v]) => v)

    const lines: string[] = []
    if (includeHeader) {
      lines.push(
        columns.map((col) => escapeCsvCell(col, delimiter)).join(delimiter)
      )
    }
    lines.push(
      values.map((val) => escapeCsvCell(val, delimiter)).join(delimiter)
    )
    return lines.join(newline)
  }

  // Handle primitive root
  const lines: string[] = []
  if (includeHeader) {
    lines.push('value')
  }
  lines.push(escapeCsvCell(data, delimiter))
  return lines.join(newline)
}
