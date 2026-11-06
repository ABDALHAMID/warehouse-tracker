/**
 * UI Mode Configuration
 * Supports 'simple' (Ultra-clean Poutrelle single-page workflow) and 'classic' (full multi-page warehouse manager).
 */

export const UI_MODES = {
  SIMPLE: 'simple',
  CLASSIC: 'classic',
}

export const DEFAULT_UI_MODE = 'simple'
export const UI_MODE_STORAGE_KEY = 'warehouse_ui_mode'

export const getStoredUIMode = () => {
  if (typeof window === 'undefined') return DEFAULT_UI_MODE
  try {
    const val = localStorage.getItem(UI_MODE_STORAGE_KEY)
    return val === 'classic' || val === 'simple' ? val : DEFAULT_UI_MODE
  } catch {
    return DEFAULT_UI_MODE
  }
}
