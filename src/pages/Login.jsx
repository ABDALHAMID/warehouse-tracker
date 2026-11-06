import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import LangSwitcher from '../components/LangSwitcher'
import InstallPWAButton from '../components/InstallPWAButton'
import { Boxes, Lock, User, ArrowRight, HardHat, AlertCircle } from 'lucide-react'

export default function Login() {
  const { t } = useTranslation()
  const { signIn, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()

  const [workerCode, setWorkerCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    clearAuthError()
    setLoading(true)

    // Convert input to lowercase trimmed name and append domain if needed
    const cleanInput = workerCode.trim().toLowerCase()
    const formattedEmail = cleanInput.includes('@')
      ? cleanInput
      : `${cleanInput}@warehouse.local`

    const { error } = await signIn(formattedEmail, password)
    setLoading(false)

    if (error) {
      setErrorMsg(
        error.message === 'account_deactivated'
          ? t('profile.account_deactivated')
          : t('login.invalidCredentials')
      )
    } else {
      navigate('/')
    }
  }

  // Shown when an existing session was signed out because the account is inactive
  const displayError =
    errorMsg || (authError === 'account_deactivated' ? t('profile.account_deactivated') : null)

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors">
      {/* Top Bar with Language and Theme Controls */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Boxes className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base tracking-tight">{t('app.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-250">
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3 border border-blue-200 dark:border-blue-900 shadow-inner">
              <HardHat className="w-9 h-9 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {t('login.title')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('login.subtitle')}
            </p>
          </div>

          {/* Error Alert */}
          {displayError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center gap-3 text-sm font-semibold animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="worker-code"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
              >
                {t('login.usernameLabel', 'Name')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="worker-code"
                  type="text"
                  required
                  value={workerCode}
                  onChange={(e) => setWorkerCode(e.target.value)}
                  placeholder="chofi"
                  className="w-full ps-11 pe-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="worker-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
              >
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="worker-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full ps-11 pe-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-14 mt-2 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-70 touch-manipulation"
            >
              {loading ? (
                <span>{t('login.signingIn')}</span>
              ) : (
                <>
                  <span>{t('login.signInButton')}</span>
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* In-App PWA Install Prompt */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <InstallPWAButton variant="pill" className="w-full justify-center py-2.5" />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-3">
        {t('app.tagline')}
      </footer>
    </div>
  )
}
