import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useUIMode } from '../context/UIModeContext'
import { useTheme } from '../context/ThemeContext'
import { getRoleBadgeClasses } from '../lib/workerProfiles'
import InstallPWAButton from './InstallPWAButton'
import {
  X,
  HardHat,
  MapPin,
  Sliders,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Check,
  Settings,
} from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', short: 'عربي', flag: '🇸🇦' },
  { code: 'ar-MA', label: 'الدارجة المغربية', short: 'الدارجة', flag: '🇲🇦' },
]

export default function WarehouseSidebar({ isOpen, onClose }) {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut, isDemoUser, updateOwnProfile } = useAuth()
  const { uiMode, toggleUIMode } = useUIMode()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const workerName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    t('nav.worker', 'Worker')
  const workerRole = profile?.role || 'worker'
  const workerZone = profile?.assigned_zone || 'el hommer 2'

  const handleSelectLanguage = (code) => {
    i18n.changeLanguage(code)
    if (user && profile && !isDemoUser && profile.preferred_language !== code) {
      updateOwnProfile({ preferred_language: code }).catch((err) => {
        console.warn('Failed to persist preferred_language:', err)
      })
    }
  }

  const handleLogout = async () => {
    onClose()
    await signOut()
    navigate('/login')
  }

  const sidebarContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9990] flex justify-end animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right rtl:slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {t('sidebar.options_title', 'Warehouse Options')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('sidebar.options_subtitle', 'Settings, profile & shortcuts')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 1. Worker Profile Card */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 shrink-0">
                <HardHat className="w-6 h-6 text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {workerName}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${getRoleBadgeClasses(
                      workerRole
                    )}`}
                  >
                    {t(`profile.roles.${workerRole}`, workerRole)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{workerZone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. UI Mode Switcher */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('simple_mode.interface_mode', 'Interface Mode')}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {uiMode === 'simple' ? '⚡ Simple' : '🏛️ Classic'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {uiMode === 'simple'
                ? t(
                  'simple_mode.simple_desc',
                  'Single-screen view focused exclusively on Poutrelle stock updates.'
                )
                : t(
                  'simple_mode.classic_desc',
                  'Full multi-tab warehouse management with dashboard, logs, and scanner.'
                )}
            </p>

            <button
              type="button"
              onClick={() => {
                toggleUIMode()
                onClose()
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {uiMode === 'simple'
                  ? t('simple_mode.switch_to_classic', 'Switch to Classic Mode')
                  : t('classic_mode.switch_to_simple', 'Switch to Simple Mode')}
              </span>
            </button>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              {t('simple_mode.shortcut_hint', 'Shortcut: Ctrl + Shift + M')}
            </p>
          </div>

          {/* 3. Install PWA Prompt */}
          <div>
            <InstallPWAButton variant="card" />
          </div>

          {/* 4. Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 block">
              {t('lang.select', 'Language')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = i18n.language === lang.code
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5. Theme Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 block">
              {t('theme.title', 'Appearance')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${!isDark
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${isDark
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <Moon className="w-4 h-4 text-blue-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer with Sign Out */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-900 transition-all duration-150 cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout', 'Sign Out')}</span>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(sidebarContent, document.body)
}
