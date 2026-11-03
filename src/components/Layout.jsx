import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import LangSwitcher from './LangSwitcher'
import {
  LayoutDashboard,
  Boxes,
  ScanBarcode,
  LogOut,
  HardHat,
  Radio,
  WifiOff,
} from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function Layout() {
  const { t } = useTranslation()
  const { user, signOut, isDemoUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const workerName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    t('nav.worker')

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                  {t('app.title')}
                </span>
                {isSupabaseConfigured && !isDemoUser ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    <WifiOff className="w-2.5 h-2.5" />
                    DEMO
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                {t('app.subtitle')}
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              {t('nav.dashboard')}
            </NavLink>

            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <Boxes className="w-4 h-4" />
              {t('nav.inventory')}
            </NavLink>

            <NavLink
              to="/scan"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`
              }
            >
              <ScanBarcode className="w-4 h-4" />
              {t('nav.scan')}
            </NavLink>
          </nav>

          {/* Controls: Lang + Theme + Worker & Logout */}
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <ThemeToggle />

            {/* Worker Badge & Logout Button */}
            <div className="flex items-center ps-1 sm:ps-2 border-s border-slate-200 dark:border-slate-800 gap-1.5">
              <div
                title={workerName}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <HardHat className="w-3.5 h-3.5 text-amber-500" />
                <span className="max-w-[120px] truncate">{workerName}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
                className="min-w-11 min-h-11 rounded-xl p-2.5 flex items-center justify-center text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer active:scale-95 touch-manipulation"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 pb-28 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Optimized for one-handed warehouse operation) */}
      <nav className="md:hidden fixed bottom-0 start-0 end-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2 items-center">
          {/* Dashboard Tab */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/50'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <LayoutDashboard className="w-6 h-6 mb-1" />
            <span className="text-xs truncate">{t('nav.dashboard')}</span>
          </NavLink>

          {/* Central Prominent SCAN Tab */}
          <NavLink
            to="/scan"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 shadow-md ${
                isActive
                  ? 'bg-emerald-600 text-white font-extrabold shadow-emerald-600/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-emerald-500/20'
              }`
            }
          >
            <ScanBarcode className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold truncate">{t('nav.scan')}</span>
          </NavLink>

          {/* Inventory Tab */}
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/50'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <Boxes className="w-6 h-6 mb-1" />
            <span className="text-xs truncate">{t('nav.inventory')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
