import { supabase, isSupabaseConfigured } from './supabaseClient'

// Data-access helpers for public.worker_profiles
// Columns: id, worker_code, full_name, role, phone, assigned_zone,
// preferred_language, preferred_theme, is_active, last_seen_at, created_at, updated_at

export const WORKER_ROLES = ['admin', 'manager', 'worker', 'viewer']
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar', 'ar-MA']
export const SUPPORTED_THEMES = ['light', 'dark']

// Tailwind classes for color-coded role badges
export const ROLE_BADGE_CLASSES = {
  admin:
    'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  manager:
    'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  worker:
    'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  viewer:
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
}

export const getRoleBadgeClasses = (role) => ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.viewer

const notConfigured = () => ({ data: null, error: new Error('Database not configured') })

export async function fetchWorkerProfile(userId) {
  if (!isSupabaseConfigured || !userId) return notConfigured()
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateWorkerProfile(userId, updates) {
  if (!isSupabaseConfigured || !userId) return notConfigured()
  const { data, error } = await supabase
    .from('worker_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

export async function listWorkerProfiles() {
  if (!isSupabaseConfigured) return { data: [], error: null }
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .order('full_name', { ascending: true })
  return { data: data || [], error }
}

// Non-blocking heartbeat: fire-and-forget update of last_seen_at
export function touchLastSeen(userId) {
  if (!isSupabaseConfigured || !userId) return
  supabase
    .from('worker_profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.warn('last_seen_at heartbeat failed:', error.message)
    })
}
