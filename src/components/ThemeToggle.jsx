import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      className={`relative inline-flex items-center justify-center min-w-9 min-h-9 sm:min-w-11 sm:min-h-11 p-2 sm:p-2.5 rounded-xl font-medium transition-all duration-200 
        border active:scale-95 cursor-pointer touch-manipulation select-none
        ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 shadow-sm'
            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
        } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 transition-transform rotate-0 scale-100 duration-200" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform rotate-0 scale-100 duration-200" />
      )}
    </button>
  )
}
