import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@/hooks/useTheme'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </ThemeProvider>
  )
}
