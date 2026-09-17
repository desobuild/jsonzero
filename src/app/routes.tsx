import { Routes, Route } from 'react-router'
import { App } from '@/app/App'

export function AppRoutes() {
  return (
    <Routes>
      {/* Main workbench — default route */}
      <Route path="/" element={<App />} />
      {/* Future feature routes will be added here */}
    </Routes>
  )
}
