/**
 * JSONZero — JSON to Table Conversion Engine
 *
 * Converts arbitrary JSON data structures into interactive tabular data.
 * Handles Array<Object>, objects as key-value pairs, primitive arrays, and primitive roots.
 * Pure, deterministic, and 100% client-side with zero dependencies.
 */

export interface TableColumn {
  id: string
  label: string
}

export interface TableRow {
  id: string
  cells: Record<string, string>
  rawValues: Record<string, unknown>
}

export interface TableData {
  columns: TableColumn[]
  rows: TableRow[]
  totalRows: number
  shape:
    | 'array-of-objects'
    | 'array-of-primitives'
    | 'key-value'
    | 'primitive'
    | 'empty'
}

/**
 * Format a cell value cleanly for tabular representation.
 * Nested objects/arrays are converted into compact JSON strings.
 */
export function formatTableCell(value: unknown): string {
  if (value === undefined) {
    return '—'
  }
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[Complex Object]'
    }
  }
  return String(value)
}

/**
 * Convert any JSON value into structured table data.
 */
export function jsonToTable(data: unknown): TableData {
  if (data === null || data === undefined) {
    return {
      columns: [{ id: 'value', label: 'Value' }],
      rows: [
        {
          id: 'row-0',
          cells: { value: formatTableCell(data) },
          rawValues: { value: data },
        },
      ],
      totalRows: 1,
      shape: 'primitive',
    }
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return {
        columns: [],
        rows: [],
        totalRows: 0,
        shape: 'empty',
      }
    }

    const hasObjects = data.some(
      (item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    )

    if (hasObjects) {
      // Array of objects (or mixed with non-objects)
      // Accumulate columns in order of appearance across all objects
      const columnKeys: string[] = []
      const seenKeys = new Set<string>()

      for (const item of data) {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          for (const key of Object.keys(item as Record<string, unknown>)) {
            if (!seenKeys.has(key)) {
              seenKeys.add(key)
              columnKeys.push(key)
            }
          }
        }
      }

      // If no keys found (e.g. array of empty objects `[{}]`)
      if (columnKeys.length === 0) {
        return {
          columns: [{ id: 'item', label: 'Item' }],
          rows: data.map((item, idx) => ({
            id: `row-${idx}`,
            cells: { item: formatTableCell(item) },
            rawValues: { item },
          })),
          totalRows: data.length,
          shape: 'array-of-objects',
        }
      }

      const columns: TableColumn[] = columnKeys.map((k) => ({
        id: k,
        label: k,
      }))

      const rows: TableRow[] = data.map((item, idx) => {
        const cells: Record<string, string> = {}
        const rawValues: Record<string, unknown> = {}

        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          const rec = item as Record<string, unknown>
          for (const key of columnKeys) {
            cells[key] = formatTableCell(rec[key])
            rawValues[key] = rec[key]
          }
        } else {
          // If a non-object is in the array, place it in the first column or format
          for (const key of columnKeys) {
            cells[key] = '—'
          }
          const firstCol = columnKeys[0]
          cells[firstCol] = formatTableCell(item)
          rawValues[firstCol] = item
        }

        return {
          id: `row-${idx}`,
          cells,
          rawValues,
        }
      })

      return {
        columns,
        rows,
        totalRows: rows.length,
        shape: 'array-of-objects',
      }
    }

    // Array of primitives or arrays
    const columns: TableColumn[] = [
      { id: 'index', label: '#' },
      { id: 'value', label: 'Value' },
    ]

    const rows: TableRow[] = data.map((item, idx) => ({
      id: `row-${idx}`,
      cells: {
        index: String(idx + 1),
        value: formatTableCell(item),
      },
      rawValues: {
        index: idx + 1,
        value: item,
      },
    }))

    return {
      columns,
      rows,
      totalRows: rows.length,
      shape: 'array-of-primitives',
    }
  }

  // Handle single Object
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)
    if (entries.length === 0) {
      return {
        columns: [
          { id: 'key', label: 'Key' },
          { id: 'value', label: 'Value' },
        ],
        rows: [],
        totalRows: 0,
        shape: 'empty',
      }
    }

    const columns: TableColumn[] = [
      { id: 'key', label: 'Key' },
      { id: 'value', label: 'Value' },
    ]

    const rows: TableRow[] = entries.map(([key, val], idx) => ({
      id: `row-${idx}`,
      cells: {
        key,
        value: formatTableCell(val),
      },
      rawValues: {
        key,
        value: val,
      },
    }))

    return {
      columns,
      rows,
      totalRows: rows.length,
      shape: 'key-value',
    }
  }

  // Primitive root (number, string, boolean)
  return {
    columns: [{ id: 'value', label: 'Value' }],
    rows: [
      {
        id: 'row-0',
        cells: { value: formatTableCell(data) },
        rawValues: { value: data },
      },
    ],
    totalRows: 1,
    shape: 'primitive',
  }
}

/**
 * Export table data to Tab-Separated Values (TSV) for clipboard paste into Excel / Sheets.
 */
export function tableToTsv(table: TableData): string {
  if (table.rows.length === 0 || table.columns.length === 0) {
    return ''
  }

  const headerLine = table.columns.map((c) => c.label).join('\t')
  const rowLines = table.rows.map((row) =>
    table.columns
      .map((c) => (row.cells[c.id] === '—' ? '' : row.cells[c.id]))
      .join('\t')
  )

  return [headerLine, ...rowLines].join('\n')
}
