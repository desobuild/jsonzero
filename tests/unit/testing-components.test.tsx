import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestingWorkbench } from '@/features/testing'

describe('Testing Feature Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
    // Mock URL.createObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it('renders TestingWorkbench with default API assertions and input editor', () => {
    render(<TestingWorkbench />)

    expect(screen.getByTestId('testing-workbench')).toBeInTheDocument()
    expect(screen.getByTestId('testing-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('testing-selector')).toBeInTheDocument()
    expect(screen.getByTestId('testing-input-pane')).toBeInTheDocument()
    expect(screen.getByTestId('testing-preview-pane')).toBeInTheDocument()
  })

  it('loads sample JSON and generates API assertions', () => {
    render(<TestingWorkbench />)

    const sampleBtn = screen.getByTestId('testing-input-sample-btn')
    fireEvent.click(sampleBtn)

    // Check that generated assertions are displayed in code view
    const codeOutput = screen.getByTestId('assertions-code-output')
    expect(codeOutput).toBeInTheDocument()
    expect(codeOutput.textContent).toContain('// API Assertions')
    expect(codeOutput.textContent).toContain('expect(body.id).toBe(42);')
  })

  it('switches tool to Playwright Assertions and updates output', () => {
    render(<TestingWorkbench />)

    // Load sample
    fireEvent.click(screen.getByTestId('testing-input-sample-btn'))

    // Switch tool to Playwright
    const selector = screen.getByTestId('testing-selector')
    fireEvent.change(selector, { target: { value: 'playwright-assertions' } })

    const codeOutput = screen.getByTestId('assertions-code-output')
    expect(codeOutput.textContent).toContain('// Playwright API Test')
    expect(codeOutput.textContent).toContain(
      "const response = await request.get('<YOUR_ENDPOINT>');"
    )
    expect(codeOutput.textContent).toContain(
      'expect(response.ok()).toBeTruthy();'
    )
  })

  it('switches tool to Generic Assertions and toggles options', () => {
    render(<TestingWorkbench />)

    fireEvent.click(screen.getByTestId('testing-input-sample-btn'))

    const selector = screen.getByTestId('testing-selector')
    fireEvent.change(selector, { target: { value: 'generic-assertions' } })

    const codeOutput = screen.getByTestId('assertions-code-output')
    expect(codeOutput.textContent).toContain('ASSERT $.id EQUALS 42')

    // Toggle options
    const optValues = screen.getByTestId('opt-values')
    fireEvent.click(optValues) // uncheck values
    expect(
      screen.getByTestId('assertions-code-output').textContent
    ).not.toContain('ASSERT $.id EQUALS 42')
  })

  it('toggles between Code view and List view in AssertionList', () => {
    render(<TestingWorkbench />)

    fireEvent.click(screen.getByTestId('testing-input-sample-btn'))

    // Switch to List view
    const listBtn = screen.getByTestId('assertions-view-list')
    fireEvent.click(listBtn)

    const rows = screen.getAllByTestId('assertion-row')
    expect(rows.length).toBeGreaterThan(0)

    // Switch back to Code view
    const codeBtn = screen.getByTestId('assertions-view-code')
    fireEvent.click(codeBtn)
    expect(screen.getByTestId('assertions-code-output')).toBeInTheDocument()
  })

  it('supports Schema Validation: displays valid state for matching data', () => {
    render(<TestingWorkbench initialTool="schema-validation" />)

    // Click sample to populate both data and schema
    const sampleBtn = screen.getByTestId('testing-input-sample-btn')
    fireEvent.click(sampleBtn)

    // Schema editor should be rendered
    expect(screen.getByTestId('schema-editor-pane')).toBeInTheDocument()

    // Valid state displayed
    expect(screen.getByTestId('schema-valid-result')).toBeInTheDocument()
    expect(screen.getByText('Schema Validation: Valid')).toBeInTheDocument()
  })

  it('supports Schema Validation: displays structured errors for invalid data', () => {
    render(<TestingWorkbench initialTool="schema-validation" />)

    // Populate with invalid data
    const inputArea = screen.getByTestId('testing-input-textarea')
    fireEvent.change(inputArea, {
      target: { value: '{"id": "not-an-integer"}' },
    })

    const schemaArea = screen.getByTestId('schema-textarea')
    fireEvent.change(schemaArea, {
      target: {
        value: JSON.stringify({
          type: 'object',
          required: ['id', 'email'],
          properties: { id: { type: 'integer' } },
        }),
      },
    })

    expect(screen.getByTestId('schema-invalid-result')).toBeInTheDocument()
    const errorCards = screen.getAllByTestId('schema-error-item')
    expect(errorCards.length).toBeGreaterThanOrEqual(1)
  })

  it('supports Mock JSON generation and options', () => {
    render(<TestingWorkbench initialTool="mock-json" />)

    const sampleBtn = screen.getByTestId('testing-input-sample-btn')
    fireEvent.click(sampleBtn)

    const mockOutput = screen.getByTestId('mock-json-output')
    expect(mockOutput).toBeInTheDocument()
    expect(mockOutput.textContent).toContain('"id": 0')

    // Change number option to preserve
    const numbersSelect = screen.getByTestId('mock-numbers-select')
    fireEvent.change(numbersSelect, { target: { value: 'preserve' } })
    expect(screen.getByTestId('mock-json-output').textContent).toContain(
      '"id": 42'
    )
  })

  it('supports Expected vs Actual workflow and generating diff assertions', () => {
    render(<TestingWorkbench initialTool="expected-actual" />)

    // Load sample
    const sampleBtn = screen.getByTestId('testing-input-sample-btn')
    fireEvent.click(sampleBtn)

    // Check Actual pane is present
    expect(screen.getByTestId('testing-actual-pane')).toBeInTheDocument()

    // Diff mismatch badge displayed
    expect(screen.getByTestId('diff-mismatch-badge')).toBeInTheDocument()

    // Click Generate Assertions button
    const genBtn = screen.getByTestId('generate-diff-assertions-btn')
    fireEvent.click(genBtn)

    // Should switch to diff-assertions
    expect(screen.getByTestId('assertions-code-output')).toBeInTheDocument()
    expect(screen.getByTestId('assertions-code-output').textContent).toContain(
      'Diff Assertions (Expected Response)'
    )
  })

  it('handles invalid JSON safely with error alert', () => {
    render(<TestingWorkbench />)

    const inputArea = screen.getByTestId('testing-input-textarea')
    fireEvent.change(inputArea, { target: { value: '{ invalid json }' } })

    const alert = screen.getByTestId('testing-error-alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveAttribute('role', 'alert')
  })

  it('handles copy and download actions with toast notifications', async () => {
    const onToast = vi.fn()
    render(<TestingWorkbench onToast={onToast} />)

    // Load sample
    fireEvent.click(screen.getByTestId('testing-input-sample-btn'))

    // Copy
    const copyBtn = screen.getByTestId('testing-copy-btn')
    fireEvent.click(copyBtn)
    expect(navigator.clipboard.writeText).toHaveBeenCalled()

    // Download
    const downloadBtn = screen.getByTestId('testing-download-btn')
    fireEvent.click(downloadBtn)
    expect(window.URL.createObjectURL).toHaveBeenCalled()

    // Reset
    const resetBtn = screen.getByTestId('testing-reset-btn')
    fireEvent.click(resetBtn)
    expect(screen.getByTestId('testing-input-textarea')).toHaveValue('')
  })

  it('supports responsive mobile tabs', () => {
    render(<TestingWorkbench initialTool="schema-validation" />)

    // Switch to Schema tab
    const schemaTab = screen.getByTestId('mobile-tab-schema')
    fireEvent.click(schemaTab)
    expect(schemaTab).toHaveClass('text-accent')

    // Switch to Output / Result tab
    const previewTab = screen.getByTestId('mobile-tab-preview')
    fireEvent.click(previewTab)
    expect(previewTab).toHaveClass('text-accent')

    // Switch back to Input tab
    const inputTab = screen.getByTestId('mobile-tab-input')
    fireEvent.click(inputTab)
    expect(inputTab).toHaveClass('text-accent')
  })
})
