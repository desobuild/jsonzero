import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Inspector } from '@/features/inspector'

const SAMPLE_JSON = JSON.stringify(
  {
    customer: {
      id: 'CUS-1042',
      name: 'Alex Morgan',
      active: true,
    },
    orders: [
      { id: 'ORD-1001', total: 1499 },
      { id: 'ORD-1002', total: 2499 },
    ],
  },
  null,
  2
)

describe('Inspector Component Suite', () => {
  beforeEach(() => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders tree, JSONPath, and statistics panels for valid JSON', () => {
    render(<Inspector input={SAMPLE_JSON} />)

    // Tree View should show customer key and child values
    expect(screen.getByText('customer')).toBeDefined()
    expect(screen.getByText('"Alex Morgan"')).toBeDefined()

    // JSONPath Query area should be visible
    expect(screen.getByText(/JSONPath Query/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/e\.g\. \$\.customer/i)).toBeDefined()

    // Statistics area should be visible
    expect(screen.getByText(/Structure Statistics/i)).toBeDefined()
    expect(screen.getByText('OBJECT')).toBeDefined()
  })

  it('handles expand and collapse on tree nodes', () => {
    render(<Inspector input={SAMPLE_JSON} />)

    // Initial state: customer is expanded, so "Alex Morgan" is visible
    expect(screen.getByText('"Alex Morgan"')).toBeDefined()

    // Find collapse button for customer
    const collapseBtn = screen.getAllByRole('button', {
      name: /collapse node/i,
    })[1]
    fireEvent.click(collapseBtn)

    // Now it should be collapsed
    // Expand it again
    const expandBtn = screen.getAllByRole('button', { name: /expand node/i })[0]
    fireEvent.click(expandBtn)
    expect(screen.getByText('"Alex Morgan"')).toBeDefined()
  })

  it('supports Expand All and Collapse All toolbar actions', () => {
    render(<Inspector input={SAMPLE_JSON} />)

    const collapseAllBtn = screen.getByRole('button', { name: /collapse all/i })
    fireEvent.click(collapseAllBtn)

    // After collapse all, inner values should not be visible
    expect(screen.queryByText('"Alex Morgan"')).toBeNull()

    const expandAllBtn = screen.getByRole('button', { name: /expand all/i })
    fireEvent.click(expandAllBtn)
    expect(screen.getByText('"Alex Morgan"')).toBeDefined()
  })

  it('searches within tree, highlights, and navigates matches', () => {
    render(<Inspector input={SAMPLE_JSON} />)

    const searchInput = screen.getByRole('searchbox', { name: /search tree/i })
    fireEvent.change(searchInput, { target: { value: 'ORD-' } })

    // Match counter should show "1 of 2" (ORD-1001, ORD-1002)
    expect(screen.getByText('1 of 2')).toBeDefined()

    // Next match navigation
    const nextBtn = screen.getByRole('button', { name: /next match/i })
    fireEvent.click(nextBtn)
    expect(screen.getByText('2 of 2')).toBeDefined()

    // Clear search
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearBtn)
    expect(searchInput).toHaveValue('')
  })

  it('executes node copy actions (key, value, path) and triggers toast', async () => {
    const onToast = vi.fn()
    render(<Inspector input={SAMPLE_JSON} onToast={onToast} />)

    // Find Copy JSON path button
    const copyPathBtns = screen.getAllByRole('button', {
      name: /copy json path/i,
    })
    fireEvent.click(copyPathBtns[0])

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    await waitFor(() => {
      expect(onToast).toHaveBeenCalledWith('Copied JSON path', 'success')
    })
  })

  it('runs JSONPath query and displays formatted results', () => {
    const onToast = vi.fn()
    render(<Inspector input={SAMPLE_JSON} onToast={onToast} />)

    const jsonPathInput = screen.getByPlaceholderText(/e\.g\. \$\.customer/i)
    fireEvent.change(jsonPathInput, { target: { value: '$.customer.name' } })

    const runBtn = screen.getByRole('button', { name: /run jsonpath query/i })
    fireEvent.click(runBtn)

    // Result should show "Alex Morgan" and path "$.customer.name"
    expect(screen.getByText('1 result')).toBeDefined()
    expect(screen.getByText('$.customer.name')).toBeDefined()
  })

  it('displays an error alert for invalid JSONPath query syntax', () => {
    render(<Inspector input={SAMPLE_JSON} />)

    const jsonPathInput = screen.getByPlaceholderText(/e\.g\. \$\.customer/i)
    fireEvent.change(jsonPathInput, { target: { value: 'invalid-no-dollar' } })

    const runBtn = screen.getByRole('button', { name: /run jsonpath query/i })
    fireEvent.click(runBtn)

    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText(/must start with "\$"/i)).toBeDefined()
  })

  it('displays structure statistics accurately', () => {
    render(<Inspector input={SAMPLE_JSON} />)

    // Primary metrics
    expect(screen.getByText('OBJECT')).toBeDefined()
    expect(screen.getByText('Root Type')).toBeDefined()
    expect(screen.getByText('Total Nodes')).toBeDefined()
  })

  it('handles invalid JSON gracefully and allows returning to editor', () => {
    const onSwitch = vi.fn()
    render(
      <Inspector input="{\n  invalid: JSON\n" onSwitchToEditor={onSwitch} />
    )

    expect(screen.getByText('Unable to inspect JSON')).toBeDefined()
    expect(
      screen.getByText('Fix the JSON in the editor to view the tree.')
    ).toBeDefined()

    const returnBtn = screen.getByRole('button', { name: /return to editor/i })
    fireEvent.click(returnBtn)
    expect(onSwitch).toHaveBeenCalled()
  })

  it('handles large arrays safely with windowed pagination controls', () => {
    const largeArray = Array.from({ length: 120 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }))
    render(<Inspector input={JSON.stringify(largeArray)} />)

    // Verify root array shows item count badge
    expect(screen.getByText('120 items')).toBeDefined()

    // Verify pagination indicator is visible when expanded
    expect(screen.getByText(/Showing 1–50 of 120 items/i)).toBeDefined()
    const showNextBtn = screen.getByRole('button', { name: /Show next 50/i })
    expect(showNextBtn).toBeDefined()

    // Click show next
    fireEvent.click(showNextBtn)
    expect(screen.getByText(/Showing 1–100 of 120 items/i)).toBeDefined()
  })
})
