import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useUIMode } from './context/UIModeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InventoryList from './pages/InventoryList'
import ItemDetail from './pages/ItemDetail'
import ScanView from './pages/ScanView'
import Profile from './pages/Profile'
import SimpleWarehouseView from './pages/SimpleWarehouseView'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-bold tracking-wide">{t('common.loading')}</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <div className="animate-in fade-in duration-200 min-h-screen">{children}</div>
}

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { uiMode } = useUIMode()

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Dual UI Architecture: Simple Mode vs Classic Mode */}
      {uiMode === 'simple' ? (
        <>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SimpleWarehouseView />
              </ProtectedRoute>
            }
          />
          {/* Classic routes remain accessible in cold sleep without colliding on "/" */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="inventory" element={<InventoryList />} />
            <Route path="item/:id" element={<ItemDetail />} />
            <Route path="scan" element={<ScanView />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </>
      ) : (
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="item/:id" element={<ItemDetail />} />
          <Route path="scan" element={<ScanView />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      )}

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
