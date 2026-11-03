import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  applyTheme: () => {},
})

// Persist the theme preference for the signed-in Supabase user (no-op for demo / signed-out)
const persistThemePreference = async (newTheme) => {
  if (!isSupabaseConfigured) return
  try {
    const { data } = await supabase.auth.getSession()
    const userId = data?.session?.user?.id
    if (!userId) return
    const { error } = await supabase
      .from('worker_profiles')
      .update({ preferred_theme: newTheme })
      .eq('id', userId)
    if (error) console.warn('Failed to persist preferred_theme:', error.message)
  } catch (e) {
    console.warn('Failed to persist preferred_theme:', e)
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('wh_theme')
    if (saved === 'light' || saved === 'dark') return saved
    // Default to dark mode for high-contrast warehouse floor usage
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('wh_theme', theme)
  }, [theme])

  // Apply a theme WITHOUT persisting it (used when syncing from the worker profile)
  const applyTheme = useCallback((newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') setTheme(newTheme)
  }, [])

  // User-initiated toggle: update local state AND persist to worker_profiles
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    persistThemePreference(next)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
