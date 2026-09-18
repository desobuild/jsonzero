import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConvertWorkbench } from '@/features/convert/components/ConvertWorkbench'
import { ConvertSelector } from '@/features/convert/components/ConvertSelector'
import { ConvertOptions } from '@/features/convert/components/ConvertOptions'
import { ConvertPreview } from '@/features/convert/components/ConvertPreview'
import { ConvertTable } from '@/features/convert/components/ConvertTable'
import { jsonToTable } from '@/lib/json/table'
import type { ConvertOptionsState } from '@/features/convert/types'

describe('Convert Feature Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  describe('ConvertSelector', () => {
    it('renders all options grouped under DATA, CODE, and SCHEMA', () => {
      const onChange = vi.fn()
      render(<ConvertSelector value="table" onChange={onChange} />)

      const select = screen.getByRole('combobox', {
        name: /Select Conversion Target/i,
      })
      expect(select).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'JSON → Table' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'JSON → CSV' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'JSON → TypeScript' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'JSON → Dart' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'JSON → JSON Schema' })
      ).toBeInTheDocument()

      fireEvent.change(select, { target: { value: 'csv' } })
      expect(onChange).toHaveBeenCalledWith('csv')
    })
  })

  describe('ConvertOptions', () => {
    const defaultOptions: ConvertOptionsState = {
      csvDelimiter: ',',
      csvIncludeHeader: true,
      tsRootName: 'Root',
      dartRootName: 'Root',
    }

    it('renders CSV options (delimiter select and header checkbox)', () => {
      const setOptions = vi.fn()
      render(
        <ConvertOptions
          selectedConvert="csv"
          options={defaultOptions}
          onOptionsChange={setOptions}
        />
      )

      expect(screen.getByLabelText(/CSV Delimiter/i)).toBeInTheDocument()
      expect(
        screen.getByLabelText(/Include Header in CSV/i)
      ).toBeInTheDocument()
    })

    it('renders TypeScript root name input', () => {
      const setOptions = vi.fn()
      render(
        <ConvertOptions
          selectedConvert="typescript"
          options={defaultOptions}
          onOptionsChange={setOptions}
        />
      )

      expect(
        screen.getByLabelText(/TypeScript Root Type Name/i)
      ).toBeInTheDocument()
    })

    it('renders Dart root name input', () => {
      const setOptions = vi.fn()
      render(
        <ConvertOptions
          selectedConvert="dart"
          options={defaultOptions}
          onOptionsChange={setOptions}
        />
      )

      expect(screen.getByLabelText(/Dart Root Model Name/i)).toBeInTheDocument()
    })

    it('renders JSON Schema Draft badge', () => {
      render(
        <ConvertOptions
          selectedConvert="json-schema"
          options={defaultOptions}
          onOptionsChange={vi.fn()}
        />
      )

      expect(screen.getByText('Draft 2020-12')).toBeInTheDocument()
    })
  })

  describe('ConvertTable', () => {
    const sampleTable = jsonToTable([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])

    it('renders table columns and rows', () => {
      render(<ConvertTable tableData={sampleTable} />)

      expect(screen.getByTestId('column-header-id')).toBeInTheDocument()
      expect(screen.getByTestId('column-header-name')).toBeInTheDocument()
      expect(screen.getByTestId('table-cell-0-name')).toHaveTextContent('Alice')
      expect(screen.getByTestId('table-cell-1-name')).toHaveTextContent('Bob')
    })

    it('handles cell copy click and copies cell text', async () => {
      const onToast = vi.fn()
      render(<ConvertTable tableData={sampleTable} onToast={onToast} />)

      const cell = screen.getByTestId('table-cell-0-name')
      fireEvent.click(cell)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Alice')
      await waitFor(() => {
        expect(onToast).toHaveBeenCalledWith('Copied cell value', 'success')
      })
    })

    it('handles row copy action', async () => {
      const onToast = vi.fn()
      render(<ConvertTable tableData={sampleTable} onToast={onToast} />)

      const copyRowBtn = screen.getByTestId('copy-row-btn-0')
      fireEvent.click(copyRowBtn)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1\tAlice')
      await waitFor(() => {
        expect(onToast).toHaveBeenCalledWith('Copied row', 'success')
      })
    })

    it('handles copy entire table button', async () => {
      const onToast = vi.fn()
      render(<ConvertTable tableData={sampleTable} onToast={onToast} />)

      const copyTableBtn = screen.getByTestId('copy-table-btn')
      fireEvent.click(copyTableBtn)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'id\tname\n1\tAlice\n2\tBob'
      )
      await waitFor(() => {
        expect(onToast).toHaveBeenCalledWith(
          'Copied table data (TSV)',
          'success'
        )
      })
    })

    it('renders empty message when table is empty', () => {
      render(<ConvertTable tableData={null} />)
      expect(screen.getByTestId('convert-table-empty')).toBeInTheDocument()
    })
  })

  describe('ConvertPreview', () => {
    it('renders error alert when error is provided', () => {
      render(
        <ConvertPreview
          selectedConvert="typescript"
          preview=""
          tableData={null}
          error="Unexpected token"
          errorLine={3}
          errorColumn={5}
          isSuccess={false}
          wordWrap={false}
          onCopy={vi.fn()}
          onDownload={vi.fn()}
        />
      )

      expect(screen.getByTestId('convert-error')).toBeInTheDocument()
      expect(screen.getByText(/Unable to convert JSON/i)).toBeInTheDocument()
      expect(screen.getByText(/Line 3, column 5/i)).toBeInTheDocument()
    })

    it('renders code output for non-table targets', () => {
      render(
        <ConvertPreview
          selectedConvert="typescript"
          preview="export interface Root { id: number; }"
          tableData={null}
          error={null}
          isSuccess={true}
          wordWrap={false}
          onCopy={vi.fn()}
          onDownload={vi.fn()}
        />
      )

      expect(screen.getByTestId('convert-preview-output')).toHaveTextContent(
        'export interface Root { id: number; }'
      )
    })
  })

  describe('ConvertWorkbench', () => {
    it('renders workbench with dual panes and loads sample JSON', async () => {
      render(<ConvertWorkbench initialInput="" />)

      expect(screen.getByTestId('convert-workbench')).toBeInTheDocument()
      expect(screen.getByTestId('convert-input-editor')).toBeInTheDocument()

      const loadSampleBtn = screen.getByTestId('convert-load-sample-btn')
      fireEvent.click(loadSampleBtn)

      const inputEditor = screen.getByTestId(
        'convert-input-editor'
      ) as HTMLTextAreaElement
      expect(inputEditor.value).toContain('Alice')
      expect(inputEditor.value).toContain('Belagavi')

      // Since default is table, verify table rows are rendered
      expect(await screen.findByTestId('table-cell-0-name')).toHaveTextContent(
        'Alice'
      )
      expect(await screen.findByTestId('table-cell-1-name')).toHaveTextContent(
        'Bob'
      )
    })

    it('switches targets dynamically and updates preview', async () => {
      render(
        <ConvertWorkbench
          initialInput={JSON.stringify([{ id: 1, name: 'Alice' }])}
          initialConvert="table"
        />
      )

      expect(screen.getByTestId('convert-table-container')).toBeInTheDocument()

      // Switch to TypeScript
      const selector = screen.getByTestId('convert-selector')
      fireEvent.change(selector, { target: { value: 'typescript' } })

      const codeOutput = await screen.findByTestId('convert-preview-output')
      expect(codeOutput).toHaveTextContent('export interface RootItem')
      expect(codeOutput).toHaveTextContent('name: string;')
    })

    it('copies result to clipboard when Copy button is clicked', async () => {
      const onToast = vi.fn()
      render(
        <ConvertWorkbench
          initialInput={JSON.stringify([{ id: 1, name: 'Alice' }])}
          initialConvert="csv"
          onToast={onToast}
        />
      )

      const copyBtn = screen.getByTestId('convert-copy-btn')
      fireEvent.click(copyBtn)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'id,name\n1,Alice'
        )
        expect(onToast).toHaveBeenCalledWith('Copied CSV', 'success')
      })
    })

    it('handles mobile view toggling between input and output', () => {
      render(<ConvertWorkbench initialInput='{"a": 1}' />)

      const inputTab = screen.getByTestId('mobile-tab-input')
      const previewTab = screen.getByTestId('mobile-tab-preview')

      fireEvent.click(inputTab)
      expect(inputTab).toHaveClass('font-semibold')

      fireEvent.click(previewTab)
      expect(previewTab).toHaveClass('font-semibold')
    })

    it('paginates large tables to prevent DOM explosion while preserving full copy', async () => {
      const rows = Array.from({ length: 75 }, (_, i) => ({
        id: i + 1,
        title: `Item ${i + 1}`,
      }))
      const onToast = vi.fn()
      render(
        <ConvertWorkbench
          initialInput={JSON.stringify(rows)}
          onToast={onToast}
        />
      )

      // Shows row 1 to 50
      expect(await screen.findByText(/Rows 1–50 of 75/i)).toBeInTheDocument()
      expect(screen.getByTestId('table-cell-0-title')).toHaveTextContent(
        'Item 1'
      )

      // Next page button
      const nextBtn = screen.getByRole('button', { name: 'Next Page' })
      fireEvent.click(nextBtn)

      // Shows row 51 to 75
      expect(await screen.findByText(/Rows 51–75 of 75/i)).toBeInTheDocument()
      expect(screen.getByTestId('table-cell-50-title')).toHaveTextContent(
        'Item 51'
      )

      // Copy table copies all 75 rows (not just visible 25)
      const copyTableBtn = screen.getByTestId('copy-table-btn')
      fireEvent.click(copyTableBtn)
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled()
        const copiedText = vi.mocked(navigator.clipboard.writeText).mock
          .calls[0][0]
        expect(copiedText).toContain('Item 1')
        expect(copiedText).toContain('Item 75')
      })
    })
  })
})
