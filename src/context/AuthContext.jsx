import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isDemoUser: false,
  signIn: async () => {},
  signOut: async () => {},
  signInAsDemo: () => {},
})

const DEMO_STORAGE_KEY = 'mattrack_demo_user'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemoUser, setIsDemoUser] = useState(false)

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
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!localStorage.getItem(DEMO_STORAGE_KEY)) {
          setSession(newSession)
          setUser(newSession?.user || null)
          setIsDemoUser(false)
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
  }, [])

  // Sign in with email and password
  const signIn = async (email, password) => {
    setLoading(true)
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
        setLoading(false)
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
    setIsDemoUser(true)
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
    setUser(null)
    setSession(null)
    setIsDemoUser(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemoUser,
        signIn,
        signOut,
        signInAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
