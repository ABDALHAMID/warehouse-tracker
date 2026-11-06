import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useUIMode } from '../context/UIModeContext'
import {
  getRoleBadgeClasses,
  SUPPORTED_LANGUAGES,
} from '../lib/workerProfiles'
import {
  UserCircle,
  BadgeCheck,
  ShieldCheck,
  MapPin,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  Radio,
  WifiOff,
} from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabaseClient'

const LANGUAGE_LABELS = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  'ar-MA': 'الدارجة المغربية',
}

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition-all'

const labelClass =
  'block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5'

function RoleBadge({ role }) {
  const { t } = useTranslation()
  if (!role) return null
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-black uppercase tracking-wider ${getRoleBadgeClasses(role)}`}
    >
      {t(`roles.${role}`, role)}
    </span>
  )
}

function InfoCard({ icon: Icon, label, children }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-base font-black text-slate-900 dark:text-white break-words">{children}</div>
    </div>
  )
}

function StatusAlert({ type, message }) {
  if (!message) return null
  const ok = type === 'success'
  return (
    <div
      className={`p-3 rounded-xl border text-sm font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
        ok
          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
      }`}
    >
      {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span>{message}</span>
    </div>
  )
}

// Personal profile edit form (own row)
function MyProfileForm({ profile }) {
  const { t, i18n } = useTranslation()
  const { updateOwnProfile, refreshProfile, isDemoUser } = useAuth()
  const { applyTheme } = useTheme()
  const { uiMode, setUIMode } = useUIMode()

  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    preferred_language: profile.preferred_language || i18n.language || 'en',
    preferred_theme: profile.preferred_theme || 'dark',
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return
    setSaving(true)
    setStatus(null)

    const { error } = await updateOwnProfile({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      preferred_language: form.preferred_language,
      preferred_theme: form.preferred_theme,
    })

    if (error) {
      setSaving(false)
      setStatus({ type: 'error', message: t('profile.save_error') })
      return
    }

    // Apply saved preferences immediately, then re-sync from the database
    if (i18n.language !== form.preferred_language) i18n.changeLanguage(form.preferred_language)
    applyTheme(form.preferred_theme)
    await refreshProfile()

    setSaving(false)
    setStatus({ type: 'success', message: t('profile.saved') })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StatusAlert type={status?.type} message={status?.message} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-full-name" className={labelClass}>
            {t('profile.full_name')}
          </label>
          <input
            id="profile-full-name"
            type="text"
            required
            value={form.full_name}
            onChange={setField('full_name')}
            disabled={isDemoUser}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className={labelClass}>
            {t('profile.phone')}
          </label>
          <div className="relative">
            <Phone className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="profile-phone"
              type="tel"
              value={form.phone}
              onChange={setField('phone')}
              disabled={isDemoUser}
              placeholder="06 XX XX XX XX"
              className={`${inputClass} ps-10`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-language" className={labelClass}>
            {t('profile.preferred_language')}
          </label>
          <select
            id="profile-language"
            value={form.preferred_language}
            onChange={setField('preferred_language')}
            disabled={isDemoUser}
            className={inputClass}
          >
            {SUPPORTED_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="profile-theme" className={labelClass}>
            {t('profile.preferred_theme')}
          </label>
          <select
            id="profile-theme"
            value={form.preferred_theme}
            onChange={setField('preferred_theme')}
            disabled={isDemoUser}
            className={inputClass}
          >
            <option value="light">{t('profile.theme_light')}</option>
            <option value="dark">{t('profile.theme_dark')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="profile-uimode" className={labelClass}>
            {t('simple_mode.active_pill', 'Interface Mode')}
          </label>
          <select
            id="profile-uimode"
            value={uiMode}
            onChange={(e) => setUIMode(e.target.value)}
            className={inputClass}
          >
            <option value="simple">
              {t('simple_mode.active_pill', '⚡ Simple Mode (Poutrelle Focus)')}
            </option>
            <option value="classic">
              {t('classic_mode.active_pill', '🏛️ Classic Mode (Full Warehouse)')}
            </option>
          </select>
        </div>
      </div>

      {!isDemoUser && (
        <button
          id="profile-save-button"
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto min-h-12 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-60 touch-manipulation"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('profile.saving') : t('profile.save')}
        </button>
      )}
    </form>
  )
}

export default function Profile() {
  const { t } = useTranslation()
  const { profile, isDemoUser } = useAuth()

  if (!profile) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-xl font-black">{t('profile.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('profile.no_profile')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
              {profile.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={profile.role} />
            </div>
          </div>
        </div>

        {/* System & Connection Status */}
        <div className="flex items-center">
          {isSupabaseConfigured && !isDemoUser ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Supabase Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
              <WifiOff className="w-3.5 h-3.5" />
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Read-only identity cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard icon={BadgeCheck} label={t('profile.worker_code')}>
          <span className="font-mono">{profile.worker_code}</span>
        </InfoCard>
        <InfoCard icon={ShieldCheck} label={t('profile.role')}>
          {t(`roles.${profile.role}`, profile.role)}
        </InfoCard>
        <InfoCard icon={MapPin} label={t('profile.assigned_zone')}>
          {profile.assigned_zone || '—'}
        </InfoCard>
        <InfoCard icon={Clock} label={t('profile.last_seen')}>
          <span className="text-sm">
            {profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleString() : t('profile.never')}
          </span>
        </InfoCard>
      </div>

      {/* Editable personal details */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white m-0">{t('profile.my_details')}</h2>
        <MyProfileForm key={profile.id} profile={profile} />
      </section>
    </div>
  )
}
