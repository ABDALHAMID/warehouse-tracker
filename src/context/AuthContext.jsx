import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import i18n from '../lib/i18n'
import { useTheme } from './ThemeContext'
import {
  fetchWorkerProfile,
  updateWorkerProfile,
  touchLastSeen,
  SUPPORTED_LANGUAGES,
} from '../lib/workerProfiles'

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isDemoUser: false,
  authError: null,
  isAdmin: false,
  isManager: false,
  canModifyStock: false,
  signIn: async () => {},
  signOut: async () => {},
  signInAsDemo: () => {},
  refreshProfile: async () => {},
  updateOwnProfile: async () => {},
  clearAuthError: () => {},
})

const DEMO_STORAGE_KEY = 'mattrack_demo_user'

// Demo workers have no auth.users row, so inventory_logs.worker_id FK inserts would fail.
// They get a synthetic read-only profile.
const buildDemoProfile = (demoUser) => ({
  id: demoUser.id,
  worker_code: 'DEMO',
  full_name: demoUser.user_metadata?.full_name || 'Demo Worker',
  role: 'viewer',
  phone: null,
  assigned_zone: null,
  preferred_language: null,
  preferred_theme: null,
  is_active: true,
  last_seen_at: null,
})

export const AuthProvider = ({ children }) => {
  const { applyTheme, theme } = useTheme()

  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemoUser, setIsDemoUser] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Dedupes concurrent profile loads for the same user (getSession + SIGNED_IN + signIn)
  const inflightRef = useRef({ userId: null, promise: null })

  const clearSessionState = useCallback(() => {
    setUser(null)
    setSession(null)
    setProfile(null)
    setIsDemoUser(false)
  }, [])

  // Apply profile preferences to the UI without writing them back
  const applyPreferences = useCallback(
    (p) => {
      if (p?.preferred_language && SUPPORTED_LANGUAGES.includes(p.preferred_language)) {
        if (i18n.language !== p.preferred_language) {
          // languageChanged listener in i18n.js updates document dir (rtl for ar / ar-MA)
          i18n.changeLanguage(p.preferred_language)
        }
      }
      if (p?.preferred_theme) applyTheme(p.preferred_theme)
    },
    [applyTheme]
  )

  // Fetch worker_profiles row, enforce is_active, heartbeat, and sync preferences.
  // Returns { profile, error } where error is 'account_deactivated' when blocked.
  const loadProfile = useCallback(
    (authUser, { force = false } = {}) => {
      if (!authUser || !isSupabaseConfigured) {
        setProfile(null)
        return Promise.resolve({ profile: null, error: null })
      }

      const inflight = inflightRef.current
      if (!force && inflight.userId === authUser.id && inflight.promise) {
        return inflight.promise
      }

      const promise = (async () => {
        const { data, error } = await fetchWorkerProfile(authUser.id)

        if (error || !data) {
          console.warn('worker_profiles lookup failed:', error?.message || 'no profile row')
          setProfile(null)
          return { profile: null, error: null }
        }

        if (data.is_active === false) {
          try {
            await supabase.auth.signOut()
          } catch (e) {
            console.warn('Sign out after deactivation failed:', e)
          }
          clearSessionState()
          setAuthError('account_deactivated')
          return { profile: null, error: 'account_deactivated' }
        }

        setProfile(data)
        touchLastSeen(authUser.id)
        applyPreferences(data)
        return { profile: data, error: null }
      })()

      inflightRef.current = { userId: authUser.id, promise }
      promise.finally(() => {
        if (inflightRef.current.promise === promise) {
          inflightRef.current = { userId: null, promise: null }
        }
      })
      return promise
    },
    [applyPreferences, clearSessionState]
  )

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      // 1. Check for stored demo worker
      const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY)
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo)
          if (mounted) {
            setUser(parsed)
            setProfile(buildDemoProfile(parsed))
            setIsDemoUser(true)
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Failed to parse saved demo worker', e)
        }
      }

      // 2. Check Supabase session if configured
      if (isSupabaseConfigured) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (mounted) {
            setSession(currentSession)
            setUser(currentSession?.user || null)
            setIsDemoUser(false)
          }
          if (currentSession?.user) {
            await loadProfile(currentSession.user)
          }
        } catch (error) {
          console.warn('Supabase auth getSession error:', error)
        }
      }

      if (mounted) {
        setLoading(false)
      }
    }

    initAuth()

    // 3. Listen to Supabase auth state changes
    let authListener = null
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (localStorage.getItem(DEMO_STORAGE_KEY)) return

        setSession(newSession)
        setUser(newSession?.user || null)
        setIsDemoUser(false)

        if (event === 'SIGNED_OUT' || !newSession?.user) {
          setProfile(null)
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Defer Supabase calls out of the auth callback to avoid client deadlocks
          const authUser = newSession.user
          setTimeout(() => {
            if (mounted) loadProfile(authUser)
          }, 0)
        }
        setLoading(false)
      })
      authListener = data.subscription
    }

    return () => {
      mounted = false
      if (authListener) {
        authListener.unsubscribe()
      }
    }
  }, [loadProfile])

  // Keep local profile in sync when the theme toggle persists a new preferred_theme
  useEffect(() => {
    setProfile((p) => (p && !isDemoUser && p.preferred_theme !== theme ? { ...p, preferred_theme: theme } : p))
  }, [theme, isDemoUser])

  // Sign in with email and password
  const signIn = async (email, password) => {
    setLoading(true)
    setAuthError(null)
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          setLoading(false)
          return { data: null, error }
        }
        localStorage.removeItem(DEMO_STORAGE_KEY)
        setUser(data.user)
        setSession(data.session)
        setIsDemoUser(false)

        // Enforce is_active before letting the worker into the app
        const { error: profileError } = await loadProfile(data.user)
        setLoading(false)
        if (profileError === 'account_deactivated') {
          return { data: null, error: new Error('account_deactivated') }
        }
        return { data, error: null }
      } catch (err) {
        setLoading(false)
        return { data: null, error: err }
      }
    }

    // Fallback: If Supabase auth is not configured, grant worker access
    const demoUser = {
      id: 'worker-' + email.split('@')[0],
      email,
      user_metadata: {
        full_name: email.split('@')[0].toUpperCase(),
        role: 'Warehouse Operator',
      },
    }
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser))
    setUser(demoUser)
    setProfile(buildDemoProfile(demoUser))
    setIsDemoUser(true)
    setLoading(false)
    return { data: { user: demoUser }, error: null }
  }

  // Quick Demo sign in for warehouse workers
  const signInAsDemo = (name = 'Karim Bennani', role = 'Warehouse Yard Lead') => {
    const demoUser = {
      id: 'w-101',
      email: 'karim.bennani@depot-materiaux.ma',
      user_metadata: {
        full_name: name,
        role,
        badge_number: 'WH-7809',
      },
    }
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser))
    setUser(demoUser)
    setProfile(buildDemoProfile(demoUser))
    setIsDemoUser(true)
    setAuthError(null)
    setLoading(false)
    return demoUser
  }

  // Sign out
  const signOut = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY)
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.warn('Sign out error:', e)
      }
    }
    clearSessionState()
  }

  // Re-fetch the signed-in worker's profile
  const refreshProfile = useCallback(async () => {
    if (!user || isDemoUser) return { profile, error: null }
    return loadProfile(user, { force: true })
  }, [user, isDemoUser, profile, loadProfile])

  // Update the signed-in worker's own profile row and local state
  const updateOwnProfile = useCallback(
    async (updates) => {
      if (!user || isDemoUser) return { data: null, error: new Error('Not available in demo mode') }
      const { data, error } = await updateWorkerProfile(user.id, updates)
      if (!error && data) setProfile(data)
      return { data, error }
    },
    [user, isDemoUser]
  )

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'admin' || profile?.role === 'manager'
  const canModifyStock =
    !isDemoUser && !!profile?.is_active && ['admin', 'manager', 'worker'].includes(profile?.role)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isDemoUser,
        authError,
        isAdmin,
        isManager,
        canModifyStock,
        signIn,
        signOut,
        signInAsDemo,
        refreshProfile,
        updateOwnProfile,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
