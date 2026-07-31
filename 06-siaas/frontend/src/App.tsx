// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import AcademicsPage from './pages/AcademicsPage'
import AttendancePage from './pages/AttendancePage'
import AnalyticsPage from './pages/AnalyticsPage'
import CGPAPlannerPage from './pages/CGPAPlannerPage'
import RecommendationsPage from './pages/RecommendationsPage'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-slate-400 mt-2 text-sm">Coming soon</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/academics"       element={<AcademicsPage />} />
            <Route path="/attendance"      element={<AttendancePage />} />
            <Route path="/analytics"       element={<AnalyticsPage />} />
            <Route path="/planner"         element={<CGPAPlannerPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/reports"         element={<PlaceholderPage title="Reports" />} />
            <Route path="/notifications"   element={<PlaceholderPage title="Notifications" />} />
            <Route path="/profile"         element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Faculty */}
        <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
          <Route path="/faculty/*" element={<PlaceholderPage title="Faculty Panel" />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/*" element={<PlaceholderPage title="Admin Panel" />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
