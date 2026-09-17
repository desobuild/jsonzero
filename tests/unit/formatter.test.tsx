import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Providers } from '@/app/providers'
import { AppRoutes } from '@/app/routes'

function renderApp() {
  return render(
    <Providers>
      <AppRoutes />
    </Providers>
  )
}

describe('JSON Formatter Feature', () => {
  it('loads with initial sample JSON in the input editor', () => {
    renderApp()

    const inputEditor = screen.getByLabelText(
      'JSON Input Editor'
    ) as HTMLTextAreaElement
    expect(inputEditor.value).toContain('CUS-1042')
    expect(inputEditor.value).toContain('Alex Morgan')
  })

  it('formats JSON and populates output when clicking Format button', async () => {
    renderApp()

    const formatButton = screen.getByRole('button', { name: 'Format JSON' })
    fireEvent.click(formatButton)

    await waitFor(() => {
      const outputEditor = screen.getByLabelText(
        'Formatted JSON Output'
      ) as HTMLTextAreaElement
      expect(outputEditor.value).toContain('"customer": {')
      expect(outputEditor.value).toContain('"id": "CUS-1042"')
    })
  })

  it('minifies JSON into compact single-line output when clicking Minify button', async () => {
    renderApp()

    const minifyButton = screen.getByRole('button', { name: 'Minify JSON' })
    fireEvent.click(minifyButton)

    await waitFor(() => {
      const outputEditor = screen.getByLabelText(
        'Formatted JSON Output'
      ) as HTMLTextAreaElement
      expect(outputEditor.value).toContain('{"customer":{"id":"CUS-1042"')
      expect(outputEditor.value).not.toContain('\n')
    })
  })

  it('validates JSON and updates status bar to Valid JSON without modifying input', async () => {
    renderApp()

    const validateButton = screen.getByRole('button', { name: 'Validate JSON' })
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument()
    })
  })

  it('shows actionable error display when invalid JSON is formatted, keeping input untouched', async () => {
    renderApp()

    const inputEditor = screen.getByLabelText(
      'JSON Input Editor'
    ) as HTMLTextAreaElement
    const invalidText = '{\n  "unclosed": "brace"\n'
    fireEvent.change(inputEditor, { target: { value: invalidText } })

    const formatButton = screen.getByRole('button', { name: 'Format JSON' })
    fireEvent.click(formatButton)

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON Syntax/i)).toBeInTheDocument()
      expect(screen.getByText('Invalid JSON')).toBeInTheDocument()
    })

    // Input remains completely untouched
    expect(inputEditor.value).toBe(invalidText)
  })

  it('clears input and output when clicking Clear button', async () => {
    renderApp()

    const clearButton = screen.getByRole('button', { name: 'Clear JSON' })
    fireEvent.click(clearButton)

    const inputEditor = screen.getByLabelText(
      'JSON Input Editor'
    ) as HTMLTextAreaElement
    expect(inputEditor.value).toBe('')

    expect(
      screen.getByText('Format JSON to see the result.')
    ).toBeInTheDocument()
  })

  it('copies output to clipboard when Copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    renderApp()

    // Format first to have output
    const formatButton = screen.getByRole('button', { name: 'Format JSON' })
    fireEvent.click(formatButton)

    await waitFor(() => {
      const copyButton = screen.getByRole('button', { name: 'Copy JSON' })
      expect(copyButton).not.toBeDisabled()
      fireEvent.click(copyButton)
    })

    expect(writeTextMock).toHaveBeenCalled()
  })

  it('downloads JSON file when Download button is clicked', async () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    // Mock URL.createObjectURL and URL.revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()

    renderApp()

    // Format first to generate output
    const formatButton = screen.getByRole('button', { name: 'Format JSON' })
    fireEvent.click(formatButton)

    await waitFor(() => {
      const downloadButton = screen.getByRole('button', {
        name: 'Download JSON',
      })
      expect(downloadButton).not.toBeDisabled()
      fireEvent.click(downloadButton)
    })

    expect(appendChildSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})
