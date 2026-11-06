import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const UIModeContext = createContext({
  uiMode: 'simple',
  toggleUIMode: () => {},
  setUIMode: () => {},
})

export const STORAGE_KEY = 'warehouse_ui_mode'

export function UIModeProvider({ children }) {
  const navigate = useNavigate()

  const [uiMode, setUiModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'classic' || saved === 'simple') return saved
      } catch {
        // fallback
      }
    }
    return 'simple'
  })

  const setUIMode = useCallback((mode) => {
    if (mode !== 'simple' && mode !== 'classic') return
    setUiModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore
    }
    navigate('/')
  }, [navigate])

  const toggleUIMode = useCallback(() => {
    setUiModeState((prev) => {
      const next = prev === 'simple' ? 'classic' : 'simple'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
    navigate('/')
  }, [navigate])

  // Keyboard shortcut: Ctrl+Shift+M / Cmd+Shift+M
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'M' || e.key === 'm')
      ) {
        e.preventDefault()
        toggleUIMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleUIMode])

  return (
    <UIModeContext.Provider value={{ uiMode, toggleUIMode, setUIMode }}>
      {children}
    </UIModeContext.Provider>
  )
}

export const useUIMode = () => useContext(UIModeContext)
