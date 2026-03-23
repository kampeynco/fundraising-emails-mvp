import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/providers/AuthProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import LoginPage from '@/pages/LoginPage'
import GetStartedPage from '@/pages/GetStartedPage'
import DashboardPage from '@/pages/DashboardPage'
import DraftsPage from '@/pages/DraftsPage'
import ResearchPage from '@/pages/ResearchPage'
import BrandKitPage from '@/pages/BrandKitPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/onboard" element={<Navigate to="/get-started" replace />} />

            {/* Protected dashboard routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/drafts" element={<DraftsPage />} />
              <Route path="/dashboard/research" element={<ResearchPage />} />
              <Route path="/dashboard/brand-kit" element={<BrandKitPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
