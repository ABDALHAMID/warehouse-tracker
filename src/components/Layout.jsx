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
  UserCircle,
  MapPin,
} from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { getRoleBadgeClasses } from '../lib/workerProfiles'

export default function Layout() {
  const { t } = useTranslation()
  const { user, profile, signOut, isDemoUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const workerName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    t('nav.worker')
  const workerCode = profile?.worker_code
  const workerRole = profile?.role
  const workerZone = profile?.assigned_zone

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Title */}
          <NavLink
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer select-none active:scale-95 transition-transform min-w-0 shrink"
          >
            <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
              {/* Ultra-small status dot - zero horizontal space, out of the way */}
              <span
                title={isSupabaseConfigured && !isDemoUser ? 'Supabase Live' : 'Demo Mode'}
                className={`absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  isSupabaseConfigured && !isDemoUser
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-none truncate block">
                {t('app.title')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
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

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <UserCircle className="w-4 h-4" />
              {t('nav.profile')}
            </NavLink>
          </nav>

          {/* Controls: Lang + Theme + Worker & Logout */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LangSwitcher />
            <ThemeToggle />

            {/* Worker Badge & Logout Button */}
            <div className="flex items-center ps-1 sm:ps-2 border-s border-slate-200 dark:border-slate-800 gap-1 sm:gap-1.5">
              <NavLink
                to="/profile"
                title={workerCode ? `${workerName} (${workerCode})` : workerName}
                aria-label={t('nav.profile')}
                className="hidden sm:flex items-center gap-2 min-h-11 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer active:scale-95 touch-manipulation"
              >
                <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="max-w-[130px] truncate font-bold">
                    {workerName}
                    {workerCode && (
                      <span className="ms-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {workerCode}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 mt-0.5">
                    {workerRole && (
                      <span
                        className={`px-1.5 py-px rounded border text-[9px] font-black uppercase tracking-wider ${getRoleBadgeClasses(workerRole)}`}
                      >
                        {t(`roles.${workerRole}`, workerRole)}
                      </span>
                    )}
                    {workerZone && (
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 max-w-[90px] truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {workerZone}
                      </span>
                    )}
                  </span>
                </div>
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                aria-label={t('nav.logout')}
                title={t('nav.logout')}
                className="min-w-9 min-h-9 sm:min-w-11 sm:min-h-11 rounded-xl p-2 sm:p-2.5 flex items-center justify-center text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer active:scale-95 touch-manipulation"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
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
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2 items-center">
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

          {/* Profile Tab */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/50'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <UserCircle className="w-6 h-6 mb-1" />
            <span className="text-xs truncate">{t('nav.profile')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
