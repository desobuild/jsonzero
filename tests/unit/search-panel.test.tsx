import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Providers } from '@/app/providers'
import { AppRoutes } from '@/app/routes'

function renderApp() {
  return render(
    <Providers>
      <AppRoutes />
    </Providers>
  )
}

describe('Search & Replace Feature (Component Tests)', () => {
  it('opens Search panel and focuses search input when Search button on toolbar is clicked', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    expect(searchButton).toBeInTheDocument()

    // Initially search panel is not open
    expect(
      screen.queryByLabelText('Editor Search and Replace')
    ).not.toBeInTheDocument()

    // Click Search toolbar button
    fireEvent.click(searchButton)

    const searchPanel = screen.getByLabelText('Editor Search and Replace')
    expect(searchPanel).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Search JSON')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveFocus()
  })

  it('updates match count as the user types a query', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    fireEvent.click(searchButton)

    const searchInput = screen.getByPlaceholderText('Search JSON')

    // Initial sample JSON contains 3 "id" keys
    fireEvent.change(searchInput, { target: { value: 'id' } })
    expect(screen.getByText('1 of 3')).toBeInTheDocument()

    // Search for a query that has no results
    fireEvent.change(searchInput, { target: { value: 'no_such_key_xyz' } })
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('navigates next and previous matches', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    fireEvent.click(searchButton)

    const searchInput = screen.getByPlaceholderText('Search JSON')
    fireEvent.change(searchInput, { target: { value: 'id' } })

    expect(screen.getByText('1 of 3')).toBeInTheDocument()

    const nextButton = screen.getByRole('button', { name: 'Next match' })
    const prevButton = screen.getByRole('button', { name: 'Previous match' })

    // Click Next -> 2 of 3
    fireEvent.click(nextButton)
    expect(screen.getByText('2 of 3')).toBeInTheDocument()

    // Click Next -> 3 of 3
    fireEvent.click(nextButton)
    expect(screen.getByText('3 of 3')).toBeInTheDocument()

    // Click Next -> wrap around to 1 of 3
    fireEvent.click(nextButton)
    expect(screen.getByText('1 of 3')).toBeInTheDocument()

    // Click Prev -> wrap around to 3 of 3
    fireEvent.click(prevButton)
    expect(screen.getByText('3 of 3')).toBeInTheDocument()
  })

  it('toggles Match Case sensitivity', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    fireEvent.click(searchButton)

    const searchInput = screen.getByPlaceholderText('Search JSON')
    fireEvent.change(searchInput, { target: { value: 'CUSTOMER' } })

    // Case-insensitive by default -> matches "customer" (1 match)
    expect(screen.getByText('1 of 1')).toBeInTheDocument()

    const matchCaseButton = screen.getByRole('button', { name: 'Match Case' })
    expect(matchCaseButton).toHaveAttribute('aria-pressed', 'false')

    // Toggle Match Case ON -> exact case only (no uppercase CUSTOMER in document)
    fireEvent.click(matchCaseButton)
    expect(matchCaseButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('toggles Whole Word matching', () => {
    renderApp()

    // Put custom text with whole word differences into input editor
    const inputEditor = screen.getByLabelText(
      'JSON Input Editor'
    ) as HTMLTextAreaElement
    fireEvent.change(inputEditor, {
      target: { value: '{"user": "Alex", "username": "alexm"}' },
    })

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    fireEvent.click(searchButton)

    const searchInput = screen.getByPlaceholderText('Search JSON')
    fireEvent.change(searchInput, { target: { value: 'user' } })

    // Partial matches "user" and "username" -> 2 matches
    expect(screen.getByText('1 of 2')).toBeInTheDocument()

    const wholeWordButton = screen.getByRole('button', { name: 'Whole Word' })
    expect(wholeWordButton).toHaveAttribute('aria-pressed', 'false')

    // Toggle Whole Word ON -> only "user" matches -> 1 match
    fireEvent.click(wholeWordButton)
    expect(wholeWordButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
  })

  it('opens Replace row, performs replace current and replace all', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    fireEvent.click(searchButton)

    // Expand Replace row
    const toggleReplaceButton = screen.getByLabelText('Show Replace')
    fireEvent.click(toggleReplaceButton)

    const replaceInput = screen.getByPlaceholderText('Replace with...')
    expect(replaceInput).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Search JSON')
    fireEvent.change(searchInput, { target: { value: 'Morgan' } })
    expect(screen.getByText('1 of 1')).toBeInTheDocument()

    fireEvent.change(replaceInput, { target: { value: 'Smith' } })

    const replaceButton = screen.getByRole('button', { name: 'Replace' })
    fireEvent.click(replaceButton)

    // Input editor should now reflect "Smith" instead of "Morgan"
    const inputEditor = screen.getByLabelText(
      'JSON Input Editor'
    ) as HTMLTextAreaElement
    expect(inputEditor.value).toContain('Alex Smith')
    expect(inputEditor.value).not.toContain('Alex Morgan')
  })

  it('replaces all matches correctly', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    fireEvent.click(searchButton)

    const toggleReplaceButton = screen.getByLabelText('Show Replace')
    fireEvent.click(toggleReplaceButton)

    const searchInput = screen.getByPlaceholderText('Search JSON')
    const replaceInput = screen.getByPlaceholderText('Replace with...')

    fireEvent.change(searchInput, { target: { value: 'active' } })
    fireEvent.change(replaceInput, { target: { value: 'enabled' } })

    const replaceAllButton = screen.getByRole('button', {
      name: 'Replace All',
    })
    fireEvent.click(replaceAllButton)

    const inputEditor = screen.getByLabelText(
      'JSON Input Editor'
    ) as HTMLTextAreaElement
    expect(inputEditor.value).toContain('"enabled": true')
    expect(inputEditor.value).not.toContain('"active": true')
  })

  it('closes search panel when Escape key is pressed or close button clicked', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })
    fireEvent.click(searchButton)

    expect(
      screen.getByLabelText('Editor Search and Replace')
    ).toBeInTheDocument()

    // Press Escape inside search input
    const searchInput = screen.getByPlaceholderText('Search JSON')
    fireEvent.keyDown(searchInput, { key: 'Escape' })

    expect(
      screen.queryByLabelText('Editor Search and Replace')
    ).not.toBeInTheDocument()
  })

  it('toggles toolbar Search button active state when search is open', () => {
    renderApp()

    const searchButton = screen.getByRole('button', { name: /^Search$/i })

    // Open search
    fireEvent.click(searchButton)
    expect(searchButton).toHaveClass('text-accent')

    // Click again to close
    fireEvent.click(searchButton)
    expect(
      screen.queryByLabelText('Editor Search and Replace')
    ).not.toBeInTheDocument()
    expect(searchButton).not.toHaveClass('text-accent')
  })
})
