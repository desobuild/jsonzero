import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TransformWorkbench } from '@/features/transform/components/TransformWorkbench'
import { TransformSelector } from '@/features/transform/components/TransformSelector'
import { TransformOptions } from '@/features/transform/components/TransformOptions'
import { TransformPreview } from '@/features/transform/components/TransformPreview'

describe('Transform Feature Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  describe('TransformSelector', () => {
    it('renders all options grouped under SORT, STRUCTURE, and ESCAPE', () => {
      const onChange = vi.fn()
      render(<TransformSelector value="sort-keys" onChange={onChange} />)

      const select = screen.getByRole('combobox', {
        name: /Select Transformation/i,
      })
      expect(select).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Sort Keys' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Recursive Sort' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Flatten' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Unflatten' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Escape JSON' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('option', { name: 'Unescape JSON' })
      ).toBeInTheDocument()

      fireEvent.change(select, { target: { value: 'flatten' } })
      expect(onChange).toHaveBeenCalledWith('flatten')
    })
  })

  describe('TransformOptions', () => {
    it('renders current transform description', () => {
      render(
        <TransformOptions
          selectedTransform="sort-recursive"
          isEscapedJsonDetected={false}
          onUnescapeAndFormat={vi.fn()}
        />
      )
      expect(
        screen.getByText(/Alphabetically sort all nested object keys/i)
      ).toBeInTheDocument()
    })

    it('renders escaped JSON banner when detected', () => {
      const onUnescape = vi.fn()
      render(
        <TransformOptions
          selectedTransform="sort-keys"
          isEscapedJsonDetected={true}
          onUnescapeAndFormat={onUnescape}
        />
      )
      expect(screen.getByText('Looks like escaped JSON')).toBeInTheDocument()
      const button = screen.getByRole('button', { name: /Unescape & Format/i })
      fireEvent.click(button)
      expect(onUnescape).toHaveBeenCalled()
    })
  })

  describe('TransformPreview', () => {
    it('renders placeholder when preview is empty', () => {
      render(
        <TransformPreview
          preview=""
          error={null}
          isSuccess={true}
          wordWrap={false}
          onCopy={vi.fn()}
        />
      )
      expect(
        screen.getByText(/Enter JSON on the left and select a transformation/i)
      ).toBeInTheDocument()
    })

    it('renders error alert when error is present', () => {
      render(
        <TransformPreview
          preview=""
          error="Path collision at user.name"
          isSuccess={false}
          wordWrap={false}
          onCopy={vi.fn()}
        />
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(
        screen.getByText(/Path collision at user.name/i)
      ).toBeInTheDocument()
    })

    it('renders transformed output and supports copy', () => {
      const onCopy = vi.fn()
      render(
        <TransformPreview
          preview={'{\n  "a": 1\n}'}
          error={null}
          isSuccess={true}
          wordWrap={false}
          onCopy={onCopy}
        />
      )
      expect(screen.getByTestId('transform-preview-output')).toHaveTextContent(
        '"a": 1'
      )
      const copyBtn = screen.getByRole('button', {
        name: /Copy transformed JSON/i,
      })
      fireEvent.click(copyBtn)
      expect(onCopy).toHaveBeenCalled()
    })
  })

  describe('TransformWorkbench Integration', () => {
    it('loads initial input and generates preview for default transform (Recursive Sort)', async () => {
      const input = '{\n  "z": 1,\n  "a": 2\n}'
      render(<TransformWorkbench initialInput={input} />)

      const preview = screen.getByTestId('transform-preview-output')
      expect(preview).toBeInTheDocument()
      // In preview, "a" should appear before "z"
      const previewText = preview.textContent || ''
      expect(previewText.indexOf('"a"')).toBeLessThan(
        previewText.indexOf('"z"')
      )
    })

    it('allows changing transformation to Flatten and displays flattened output', async () => {
      const input = '{\n  "user": {\n    "name": "Alice"\n  }\n}'
      render(<TransformWorkbench initialInput={input} />)

      const selector = screen.getByTestId('transform-selector')
      fireEvent.change(selector, { target: { value: 'flatten' } })

      const preview = screen.getByTestId('transform-preview-output')
      expect(preview).toHaveTextContent('"user.name": "Alice"')
    })

    it('applies transformed result and notifies parent', async () => {
      const onApply = vi.fn()
      const onToast = vi.fn()
      const input = '{\n  "z": 1,\n  "a": 2\n}'

      render(
        <TransformWorkbench
          initialInput={input}
          onApply={onApply}
          onToast={onToast}
        />
      )

      const applyBtn = screen.getByRole('button', {
        name: /Apply transformation to editor/i,
      })
      fireEvent.click(applyBtn)

      expect(onApply).toHaveBeenCalled()
      expect(onToast).toHaveBeenCalledWith(
        'Applied transformed JSON to editor',
        'success'
      )
    })

    it('copies result to clipboard and triggers toast', async () => {
      const onToast = vi.fn()
      const input = '{\n  "a": 1\n}'

      render(<TransformWorkbench initialInput={input} onToast={onToast} />)

      const copyBtn = screen.getByTestId('transform-copy-btn')
      fireEvent.click(copyBtn)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled()
        expect(onToast).toHaveBeenCalledWith(
          'Copied transformed JSON',
          'success'
        )
      })
    })

    it('resets input when Reset button is clicked', () => {
      const onToast = vi.fn()
      const initial = '{\n  "original": true\n}'
      render(<TransformWorkbench initialInput={initial} onToast={onToast} />)

      const editor = screen.getByTestId('transform-input-editor')
      fireEvent.change(editor, { target: { value: 'modified text' } })
      expect(editor).toHaveValue('modified text')

      const resetBtn = screen.getByTestId('transform-reset-btn')
      fireEvent.click(resetBtn)

      expect(editor).toHaveValue(initial)
      expect(onToast).toHaveBeenCalledWith('Reset transform workbench', 'info')
    })

    it('displays error and disables Apply when input is invalid JSON', () => {
      const input = '{\n  "broken": invalid\n}'
      render(<TransformWorkbench initialInput={input} />)

      expect(screen.getByTestId('transform-error')).toBeInTheDocument()
      const applyBtn = screen.getByTestId('transform-apply-btn')
      expect(applyBtn).toBeDisabled()
    })

    it('toggles mobile tabs between Input and Preview', () => {
      render(<TransformWorkbench initialInput={'{\n  "name": "Alice"\n}'} />)

      const inputTab = screen.getByTestId('mobile-tab-input')
      const previewTab = screen.getByTestId('mobile-tab-preview')

      fireEvent.click(inputTab)
      expect(screen.getByTestId('transform-input-pane')).not.toHaveClass(
        'hidden md:flex'
      )

      fireEvent.click(previewTab)
      expect(screen.getByTestId('transform-preview-pane')).toBeInTheDocument()
    })

    it('clears input with Clear button and loads sample with Sample button', () => {
      render(<TransformWorkbench initialInput={'{"test":1}'} />)
      const editor = screen.getByTestId('transform-input-editor')

      const clearBtn = screen.getByTestId('transform-clear-btn')
      fireEvent.click(clearBtn)
      expect(editor).toHaveValue('')

      const sampleBtn = screen.getByTestId('transform-load-sample-btn')
      fireEvent.click(sampleBtn)
      expect((editor as HTMLTextAreaElement).value).toContain('zebra')
    })
  })
})
