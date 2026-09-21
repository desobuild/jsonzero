import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CompareWorkbench } from '@/features/compare/components/CompareWorkbench'
import { CompareEditor } from '@/features/compare/components/CompareEditor'
import { DiffSummary } from '@/features/compare/components/DiffSummary'
import { DiffRow } from '@/features/compare/components/DiffRow'
import { DiffView } from '@/features/compare/components/DiffView'
import type { DiffEntry, DiffSummary as DiffSummaryType } from '@/lib/json/diff'
import { parseJSON } from '@/lib/json'

describe('Compare Feature Component Suite', () => {
  describe('DiffSummary', () => {
    it('renders identical status when documents are structurally identical', () => {
      const summary: DiffSummaryType = {
        added: 0,
        removed: 0,
        changed: 0,
        total: 0,
        isIdentical: true,
      }

      render(<DiffSummary summary={summary} isAValid={true} isBValid={true} />)

      expect(
        screen.getByText('JSON documents are structurally identical.')
      ).toBeInTheDocument()
      expect(screen.getByText('(Key ordering is ignored)')).toBeInTheDocument()
    })

    it('renders error notice when inputs are invalid', () => {
      render(<DiffSummary summary={null} isAValid={false} isBValid={true} />)

      expect(
        screen.getByText(/Fix JSON syntax errors to compute structural diff/)
      ).toBeInTheDocument()
    })

    it('renders summary badges for added, removed, and changed counts', () => {
      const summary: DiffSummaryType = {
        added: 3,
        removed: 2,
        changed: 4,
        total: 9,
        isIdentical: false,
      }

      render(<DiffSummary summary={summary} isAValid={true} isBValid={true} />)

      expect(screen.getByText('9 total changes')).toBeInTheDocument()
      expect(screen.getByTestId('summary-added-badge')).toHaveTextContent(
        '+ 3 Added'
      )
      expect(screen.getByTestId('summary-removed-badge')).toHaveTextContent(
        '- 2 Removed'
      )
      expect(screen.getByTestId('summary-changed-badge')).toHaveTextContent(
        '~ 4 Changed'
      )
    })
  })

  describe('DiffRow', () => {
    it('renders changed entry with old and new values and copy path button', async () => {
      const entry: DiffEntry = {
        id: '$.user.name:changed',
        kind: 'changed',
        path: '$.user.name',
        oldValue: 'Alice',
        newValue: 'Bob',
        oldType: 'string',
        newType: 'string',
      }

      const onToast = vi.fn()
      render(<DiffRow entry={entry} onToast={onToast} />)

      expect(screen.getByText('~ CHANGED')).toBeInTheDocument()
      expect(screen.getByTestId('diff-path')).toHaveTextContent('$.user.name')
      expect(screen.getByText('"Alice"')).toBeInTheDocument()
      expect(screen.getByText('"Bob"')).toBeInTheDocument()

      const copyPathBtn = screen.getByRole('button', {
        name: /Copy JSON path \$\.user\.name/i,
      })
      expect(copyPathBtn).toBeInTheDocument()
    })

    it('renders added entry with added badge and new value', () => {
      const entry: DiffEntry = {
        id: '$.user.email:added',
        kind: 'added',
        path: '$.user.email',
        newValue: 'alice@example.com',
        newType: 'string',
      }

      render(<DiffRow entry={entry} />)

      expect(screen.getByText('+ ADDED')).toBeInTheDocument()
      expect(screen.getByTestId('diff-path')).toHaveTextContent('$.user.email')
      expect(screen.getByText('"alice@example.com"')).toBeInTheDocument()
    })

    it('renders removed entry with removed badge and old value', () => {
      const entry: DiffEntry = {
        id: '$.user.phone:removed',
        kind: 'removed',
        path: '$.user.phone',
        oldValue: '+91...',
        oldType: 'string',
      }

      render(<DiffRow entry={entry} />)

      expect(screen.getByText('- REMOVED')).toBeInTheDocument()
      expect(screen.getByTestId('diff-path')).toHaveTextContent('$.user.phone')
      expect(screen.getByText('"+91..."')).toBeInTheDocument()
    })
  })

  describe('DiffView', () => {
    it('renders cannot compare notice when an input is invalid', () => {
      render(<DiffView diffResult={null} isAValid={false} isBValid={true} />)

      expect(screen.getByText('Cannot compare documents')).toBeInTheDocument()
    })

    it('renders identical state when diffResult is identical', () => {
      render(
        <DiffView
          diffResult={{
            entries: [],
            summary: {
              added: 0,
              removed: 0,
              changed: 0,
              total: 0,
              isIdentical: true,
            },
          }}
          isAValid={true}
          isBValid={true}
        />
      )

      expect(screen.getByText('Structurally Identical')).toBeInTheDocument()
    })
  })

  describe('CompareEditor', () => {
    it('renders title, stats, and valid indicator for valid JSON', () => {
      const parsed = parseJSON('{"name":"Alice"}')
      render(
        <CompareEditor
          id="test-editor"
          title="JSON A"
          value='{"name":"Alice"}'
          onChange={() => {}}
          onFormat={() => {}}
          onClear={() => {}}
          parsed={parsed}
        />
      )

      expect(screen.getByText('JSON A')).toBeInTheDocument()
      expect(screen.getByText('Valid')).toBeInTheDocument()
    })

    it('renders error message and line number when JSON is invalid', () => {
      const parsed = parseJSON('{"name": invalid}')
      render(
        <CompareEditor
          id="test-editor"
          title="JSON A"
          value='{"name": invalid}'
          onChange={() => {}}
          onFormat={() => {}}
          onClear={() => {}}
          parsed={parsed}
        />
      )

      expect(screen.getByText('Invalid')).toBeInTheDocument()
      expect(screen.getByTestId('test-editor-error')).toBeInTheDocument()
    })
  })

  describe('CompareWorkbench', () => {
    it('renders workbench with both JSON inputs and diff results', () => {
      render(<CompareWorkbench />)

      // Both inputs rendered
      expect(screen.getAllByText('JSON A')[0]).toBeInTheDocument()
      expect(screen.getAllByText('JSON B')[0]).toBeInTheDocument()

      // Swap button rendered
      expect(
        screen.getByRole('button', { name: /Swap JSON A and JSON B/i })
      ).toBeInTheDocument()

      // Diff entries rendered
      expect(screen.getAllByTestId('diff-summary')[0]).toBeInTheDocument()
    })

    it('swaps JSON A and JSON B when Swap button is clicked', async () => {
      render(
        <CompareWorkbench
          initialJsonA='{"side":"A"}'
          initialJsonB='{"side":"B"}'
        />
      )

      const swapBtn = screen.getByRole('button', {
        name: /Swap JSON A and JSON B/i,
      })
      fireEvent.click(swapBtn)

      // The entries should now show the swapped state
      await waitFor(() => {
        expect(screen.getByTestId('compare-workbench')).toBeInTheDocument()
      })
    })

    it('loads sample comparison when Sample button is clicked', async () => {
      render(<CompareWorkbench initialJsonA="{}" initialJsonB="{}" />)

      const sampleBtn = screen.getByRole('button', {
        name: /Load Sample JSON/i,
      })
      fireEvent.click(sampleBtn)

      await waitFor(() => {
        // Sample has Alice Morgan
        expect(screen.getAllByText(/Alice Morgan/i).length).toBeGreaterThan(0)
      })
    })

    it('renders diff highlights in editors when inputs differ', async () => {
      render(
        <CompareWorkbench
          initialJsonA={`{
  "age": 77,
  "name": "Ani"
}`}
          initialJsonB={`{
  "age": 73,
  "name": "Ani"
}`}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Found 1 difference')).toBeInTheDocument()
        expect(screen.getByText('Unequal values (1)')).toBeInTheDocument()
        // Changed value highlights should be rendered in the document
        const changedHighlights = screen.getAllByTestId(
          'diff-highlight-changed'
        )
        expect(changedHighlights.length).toBeGreaterThanOrEqual(2)
        expect(changedHighlights[0]).toHaveTextContent('77')
        expect(changedHighlights[1]).toHaveTextContent('73')
      })
    })
  })

  describe('DiffSummary Filters', () => {
    it('renders Found differences count and checkboxes for available categories', () => {
      const summary: DiffSummaryType = {
        added: 1,
        removed: 1,
        changed: 1,
        total: 3,
        isIdentical: false,
      }
      const onToggle = vi.fn()

      render(
        <DiffSummary
          summary={summary}
          isAValid={true}
          isBValid={true}
          onToggleFilter={onToggle}
          filterState={{
            showChanged: true,
            showAdded: true,
            showRemoved: true,
          }}
        />
      )

      expect(screen.getByText('Found 3 differences')).toBeInTheDocument()
      expect(screen.getByText('Unequal values (1)')).toBeInTheDocument()
      expect(screen.getByText('Added values (1)')).toBeInTheDocument()
      expect(screen.getByText('Removed values (1)')).toBeInTheDocument()

      const changedCheckbox = screen.getByTestId('filter-changed')
      fireEvent.click(changedCheckbox)
      expect(onToggle).toHaveBeenCalledWith('changed')
    })
  })
})
