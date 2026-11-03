import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية (Standard)', short: 'عربي', flag: '🇲🇦', dir: 'rtl' },
  { code: 'ar-MA', label: 'الدارجة المغربية', short: 'الدارجة', flag: '🇲🇦', dir: 'rtl' },
]

export default function LangSwitcher({ className = '' }) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleSelectLanguage = (code) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select Language"
        className="flex items-center gap-2 min-h-11 px-3 py-2 rounded-xl text-sm font-semibold
          bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
          text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700
          transition-colors duration-150 active:scale-95 cursor-pointer touch-manipulation select-none"
      >
        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="hidden xs:inline-block">{currentLang.flag}</span>
        <span className="font-bold">{currentLang.short}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute end-0 mt-2 w-56 p-1.5 rounded-2xl shadow-xl z-50
            bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
            animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
            Language / اللغة
          </div>
          <div className="py-1 flex flex-col gap-1">
            {LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`flex items-center justify-between w-full min-h-12 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                    touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-start">{lang.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
