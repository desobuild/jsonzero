/**
 * JSONZero — ConvertTable Component
 *
 * Interactive, accessible data table for JSON inspection and conversion.
 * Features horizontal scrolling, copy cell value, copy row, copy entire table, and empty state.
 */

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TableData, TableRow } from '@/lib/json/table'
import { tableToTsv } from '@/lib/json/table'

export interface ConvertTableProps {
  tableData: TableData | null
  onToast?: (message: string, type?: 'info' | 'success' | 'error') => void
}

export const ConvertTable: React.FC<ConvertTableProps> = ({
  tableData,
  onToast,
}) => {
  const [copiedCellKey, setCopiedCellKey] = useState<string | null>(null)
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null)

  if (
    !tableData ||
    tableData.rows.length === 0 ||
    tableData.columns.length === 0
  ) {
    return (
      <div
        data-testid="convert-table-empty"
        className="flex flex-1 items-center justify-center p-8 text-center text-xs text-text-muted"
      >
        <p>
          No tabular data to display. Provide an array of objects or key-value
          JSON.
        </p>
      </div>
    )
  }

  const handleCopyCell = async (
    rowIdx: number,
    colId: string,
    value: string
  ) => {
    const rawVal = value === '—' ? '' : value
    try {
      await navigator.clipboard.writeText(rawVal)
      const cellKey = `${rowIdx}-${colId}`
      setCopiedCellKey(cellKey)
      setTimeout(() => setCopiedCellKey(null), 1500)
      onToast?.('Copied cell value', 'success')
    } catch {
      onToast?.('Failed to copy cell value', 'error')
    }
  }

  const handleCopyRow = async (row: TableRow) => {
    try {
      const rowTsv = tableData.columns
        .map((col) => (row.cells[col.id] === '—' ? '' : row.cells[col.id]))
        .join('\t')
      await navigator.clipboard.writeText(rowTsv)
      setCopiedRowId(row.id)
      setTimeout(() => setCopiedRowId(null), 1500)
      onToast?.('Copied row', 'success')
    } catch {
      onToast?.('Failed to copy row', 'error')
    }
  }

  const handleCopyAllTable = async () => {
    try {
      const tsv = tableToTsv(tableData)
      await navigator.clipboard.writeText(tsv)
      onToast?.('Copied table data (TSV)', 'success')
    } catch {
      onToast?.('Failed to copy table data', 'error')
    }
  }

  return (
    <div
      id="convert-table-container"
      data-testid="convert-table-container"
      className="flex flex-1 flex-col overflow-hidden bg-background"
    >
      {/* Table Subheader / Quick Actions */}
      <div className="flex h-8 items-center justify-between border-b border-border bg-surface px-3 py-1">
        <div className="flex items-center gap-2">
          <span className="text-3xs font-medium text-text-muted">
            {tableData.totalRows} {tableData.totalRows === 1 ? 'row' : 'rows'} ×{' '}
            {tableData.columns.length}{' '}
            {tableData.columns.length === 1 ? 'column' : 'columns'}
          </span>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyAllTable}
          data-testid="copy-table-btn"
          aria-label="Copy Table Data as TSV"
          className="h-6 gap-1 px-2 text-3xs text-text-secondary hover:text-text-primary"
        >
          <Copy className="h-3 w-3" />
          <span>Copy Table</span>
        </Button>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-left font-mono text-xs"
          role="table"
          aria-label="JSON Data Table"
        >
          <thead className="sticky top-0 z-10 border-b border-border bg-surface">
            <tr>
              <th
                scope="col"
                className="w-12 select-none border-r border-border px-2 py-2 text-center text-3xs font-semibold text-text-muted"
              >
                #
              </th>
              {tableData.columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  data-testid={`column-header-${col.id}`}
                  className="border-r border-border px-3 py-2 text-xs font-semibold text-text-primary whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th
                scope="col"
                className="w-16 select-none px-2 py-2 text-center text-3xs font-semibold text-text-muted"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {tableData.rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                data-testid={`table-row-${rowIdx}`}
                className="group transition-colors hover:bg-surface-elevated/50"
              >
                {/* Row Number */}
                <td className="select-none border-r border-border px-2 py-1.5 text-center text-3xs text-text-muted">
                  {rowIdx + 1}
                </td>

                {/* Cells */}
                {tableData.columns.map((col) => {
                  const cellVal = row.cells[col.id] ?? '—'
                  const cellKey = `${rowIdx}-${col.id}`
                  const isCopied = copiedCellKey === cellKey
                  const isMissing = cellVal === '—'

                  return (
                    <td
                      key={col.id}
                      data-testid={`table-cell-${rowIdx}-${col.id}`}
                      onClick={() => handleCopyCell(rowIdx, col.id, cellVal)}
                      title="Click to copy cell value"
                      className={cn(
                        'cursor-pointer border-r border-border px-3 py-1.5 transition-colors max-w-xs truncate select-text',
                        isMissing
                          ? 'text-text-muted font-normal'
                          : 'text-text-primary',
                        isCopied
                          ? 'bg-accent/20 text-accent font-semibold'
                          : 'hover:bg-accent/10'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{cellVal}</span>
                        {isCopied && (
                          <Check className="h-3 w-3 text-accent shrink-0" />
                        )}
                      </div>
                    </td>
                  )
                })}

                {/* Row Action: Copy Row */}
                <td className="px-2 py-1.5 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyRow(row)}
                    data-testid={`copy-row-btn-${rowIdx}`}
                    aria-label={`Copy row ${rowIdx + 1}`}
                    title="Copy row data"
                    className="h-5 w-5 p-0 text-text-muted hover:text-text-primary"
                  >
                    {copiedRowId === row.id ? (
                      <Check className="h-3 w-3 text-accent" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
