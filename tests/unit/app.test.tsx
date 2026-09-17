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

describe('JSONZero Application', () => {
  it('renders the application shell', () => {
    renderApp()

    // Header branding is visible
    expect(screen.getAllByText('JSONZero')[0]).toBeInTheDocument()
  })

  it('displays the tagline', () => {
    renderApp()

    expect(screen.getByText('JSON. Zero clutter.')).toBeInTheDocument()
  })

  it('renders the privacy indicator', () => {
    renderApp()

    expect(
      screen.getByText('Your JSON stays in your browser.')
    ).toBeInTheDocument()
  })

  it('renders the toolbar with primary actions', () => {
    renderApp()

    expect(screen.getByText('Format')).toBeInTheDocument()
    expect(screen.getByText('Minify')).toBeInTheDocument()
    expect(screen.getByText('Validate')).toBeInTheDocument()
  })

  it('renders the status bar', () => {
    renderApp()

    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('renders Transform button in toolbar and toggles Transform workbench', () => {
    renderApp()

    const transformBtn = screen.getByRole('button', { name: 'Transform' })
    expect(transformBtn).toBeInTheDocument()

    // Click to open Transform
    fireEvent.click(transformBtn)
    expect(screen.getByTestId('transform-workbench')).toBeInTheDocument()

    // Click again to toggle back to Editor
    fireEvent.click(transformBtn)
    expect(screen.queryByTestId('transform-workbench')).not.toBeInTheDocument()
  })
})
