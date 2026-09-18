import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toolbar } from '@/components/shared/Toolbar'
import { SearchPanel } from '@/features/search/components/SearchPanel'
import { Workbench } from '@/features/formatter/components/Workbench'
import { CompareToolbar } from '@/features/compare/components/CompareToolbar'
import { TransformToolbar } from '@/features/transform/components/TransformToolbar'
import { ConvertToolbar } from '@/features/convert/components/ConvertToolbar'
import { ConvertTable } from '@/features/convert/components/ConvertTable'
import { TestingToolbar } from '@/features/testing/components/TestingToolbar'

describe('Accessibility & Keyboard Usability Audit (Section 3 & 4)', () => {
  describe('1. Toolbar Semantics & Toggle Buttons', () => {
    it('renders role="toolbar" with accessible label and aria-pressed attributes', () => {
      render(<Toolbar activeView="editor" isSearchActive={false} />)

      const toolbar = screen.getByRole('toolbar', {
        name: /workbench actions/i,
      })
      expect(toolbar).toBeInTheDocument()

      const searchBtn = screen.getByRole('button', { name: /^search$/i })
      expect(searchBtn).toHaveAttribute('aria-pressed', 'false')

      const diffBtn = screen.getByRole('button', { name: /compare \/ diff/i })
      expect(diffBtn).toHaveAttribute('aria-pressed', 'false')

      const treeBtn = screen.getByRole('button', { name: /tree view/i })
      expect(treeBtn).toHaveAttribute('aria-pressed', 'false')

      const transformBtn = screen.getByRole('button', { name: /^transform$/i })
      expect(transformBtn).toHaveAttribute('aria-pressed', 'false')

      const convertBtn = screen.getByRole('button', { name: /^convert$/i })
      expect(convertBtn).toHaveAttribute('aria-pressed', 'false')

      const testBtn = screen.getByRole('button', {
        name: /developer & testing tools/i,
      })
      expect(testBtn).toHaveAttribute('aria-pressed', 'false')
    })

    it('updates aria-pressed to true when a view or search is active', () => {
      render(<Toolbar activeView="diff" isSearchActive={true} />)

      const searchBtn = screen.getByRole('button', { name: /^search$/i })
      expect(searchBtn).toHaveAttribute('aria-pressed', 'true')

      const diffBtn = screen.getByRole('button', { name: /compare \/ diff/i })
      expect(diffBtn).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('2. SearchPanel ARIA & Keyboard', () => {
    it('exposes aria-expanded on the disclosure button and role="status" on match count', () => {
      render(
        <SearchPanel
          isOpen={true}
          isReplaceOpen={false}
          query="test"
          replaceText=""
          options={{ matchCase: false, wholeWord: false }}
          matches={[{ start: 0, end: 4, line: 1 }]}
          currentMatchIndex={0}
          onQueryChange={() => {}}
          onReplaceTextChange={() => {}}
          onToggleReplace={() => {}}
          onToggleMatchCase={() => {}}
          onToggleWholeWord={() => {}}
          onNextMatch={() => {}}
          onPrevMatch={() => {}}
          onReplaceCurrent={() => {}}
          onReplaceAll={() => {}}
          onClose={() => {}}
        />
      )

      const disclosureBtn = screen.getByRole('button', {
        name: /show replace/i,
      })
      expect(disclosureBtn).toHaveAttribute('aria-expanded', 'false')

      const matchStatus = screen.getByRole('status')
      expect(matchStatus).toHaveAttribute('aria-live', 'polite')
      expect(matchStatus).toHaveTextContent('1 of 1')
    })

    it('triggers close when pressing Escape in search input', () => {
      const handleClose = vi.fn()
      render(
        <SearchPanel
          isOpen={true}
          isReplaceOpen={false}
          query="hello"
          replaceText=""
          options={{ matchCase: false, wholeWord: false }}
          matches={[]}
          currentMatchIndex={-1}
          onQueryChange={() => {}}
          onReplaceTextChange={() => {}}
          onToggleReplace={() => {}}
          onToggleMatchCase={() => {}}
          onToggleWholeWord={() => {}}
          onNextMatch={() => {}}
          onPrevMatch={() => {}}
          onReplaceCurrent={() => {}}
          onReplaceAll={() => {}}
          onClose={handleClose}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search json/i)
      fireEvent.keyDown(searchInput, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('3. Tablist and Tab Semantics across Feature Workbenches', () => {
    it('renders accessible tablist and tabs in Workbench mobile view', () => {
      const dummyFormatter = {
        input: '{"a": 1}',
        output: '',
        lastOperation: null,
        validationState: 'idle' as const,
        processingTimeMs: null,
        error: null,
        inputStats: {
          lineCount: 1,
          characterCount: 8,
          byteCount: 8,
          keyCount: 1,
        },
        outputStats: {
          lineCount: 0,
          characterCount: 0,
          byteCount: 0,
          keyCount: 0,
        },
        isProcessing: false,
        processingMessage: null,
        indent: '2' as const,
        setInput: vi.fn(),
        setIndent: vi.fn(),
        format: vi.fn(),
        minify: vi.fn(),
        validate: vi.fn(),
        clear: vi.fn(),
        loadFile: vi.fn(),
        cancelOperation: vi.fn(),
      }

      render(<Workbench formatter={dummyFormatter} />)

      const tablist = screen.getByRole('tablist', {
        name: /input or formatted view/i,
      })
      expect(tablist).toBeInTheDocument()

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(2)
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })

    it('renders accessible tablist and tabs in CompareToolbar', () => {
      render(
        <CompareToolbar
          onSwap={() => {}}
          onLoadSample={() => {}}
          onClearAll={() => {}}
          wordWrap={false}
          onToggleWordWrap={() => {}}
          activeMobileTab="jsonA"
          onMobileTabChange={() => {}}
          changeCount={3}
        />
      )

      const tablist = screen.getByRole('tablist', { name: /compare views/i })
      expect(tablist).toBeInTheDocument()

      const tabA = screen.getByRole('tab', { name: /json a/i })
      expect(tabA).toHaveAttribute('aria-selected', 'true')

      const tabB = screen.getByRole('tab', { name: /json b/i })
      expect(tabB).toHaveAttribute('aria-selected', 'false')
    })

    it('renders accessible tablist and tabs in TransformToolbar', () => {
      render(
        <TransformToolbar
          selectedTransform="sort-keys"
          onSelectTransform={() => {}}
          onApply={() => {}}
          onCopyResult={() => {}}
          onReset={() => {}}
          canApply={true}
          wordWrap={false}
          onToggleWordWrap={() => {}}
          activeMobileTab="input"
          onMobileTabChange={() => {}}
        />
      )

      const tablist = screen.getByRole('tablist', { name: /transform views/i })
      expect(tablist).toBeInTheDocument()

      const tabInput = screen.getByRole('tab', { name: /^input$/i })
      expect(tabInput).toHaveAttribute('aria-selected', 'true')
    })

    it('renders accessible tablist and tabs in ConvertToolbar', () => {
      render(
        <ConvertToolbar
          selectedConvert="table"
          onSelectConvert={() => {}}
          onCopy={() => {}}
          onDownload={() => {}}
          onReset={() => {}}
          canCopy={true}
          wordWrap={false}
          onToggleWordWrap={() => {}}
          activeMobileTab="input"
          onMobileTabChange={() => {}}
        />
      )

      const tablist = screen.getByRole('tablist', { name: /convert views/i })
      expect(tablist).toBeInTheDocument()
    })

    it('renders accessible tablist and tabs in TestingToolbar', () => {
      render(
        <TestingToolbar
          selectedTool="api-assertions"
          onSelectTool={() => {}}
          onCopy={() => {}}
          onDownload={() => {}}
          onReset={() => {}}
          canCopy={true}
          wordWrap={false}
          onToggleWordWrap={() => {}}
          activeMobileTab="input"
          onMobileTabChange={() => {}}
        />
      )

      const tablist = screen.getByRole('tablist', { name: /testing views/i })
      expect(tablist).toBeInTheDocument()
    })
  })

  describe('4. Keyboard Accessibility on Table Cells', () => {
    it('supports Enter and Space keys to copy cell values', async () => {
      const onToast = vi.fn()
      const tableData = {
        columns: [{ id: 'col1', label: 'Name' }],
        rows: [{ id: 'row-0', cells: { col1: 'Alice' } }],
        totalRows: 1,
      }

      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      })

      render(<ConvertTable tableData={tableData} onToast={onToast} />)

      const cell = screen.getByTestId('table-cell-0-col1')
      expect(cell).toHaveAttribute('tabIndex', '0')

      fireEvent.keyDown(cell, { key: 'Enter' })
      await vi.waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Alice')
        expect(onToast).toHaveBeenCalledWith('Copied cell value', 'success')
      })

      fireEvent.keyDown(cell, { key: ' ' })
      await vi.waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Alice')
      })
    })
  })
})
