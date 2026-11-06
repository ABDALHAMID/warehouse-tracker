import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Share,
  PlusSquare,
  X,
  Smartphone,
  Download,
  CheckCircle2,
} from 'lucide-react'

export default function InstallPWAButton({
  variant = 'pill',
  className = '',
}) {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 1. Detect if running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
    }

    checkStandalone()

    // 2. Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // If already installed in standalone mode, do not render
  if (isStandalone || installed) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">{t('pwa.installed_title', 'App is Installed')}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 opacity-90">
              {t('pwa.running_standalone', 'Running in standalone PWA mode')}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setInstalled(true)
      }
    } else {
      // iOS Safari or browser without beforeinstallprompt
      setShowIOSModal(true)
    }
  }

  return (
    <>
      {variant === 'card' ? (
        <div className={`p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 space-y-2.5 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                {t('pwa.install_card_title', 'Install Warehouse App')}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {t('pwa.install_card_desc', 'Add to your home screen for quick offline access & full-screen view')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('pwa.install_app', 'Install App')}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          title={t('pwa.install_app', 'Install App')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs select-none ${
            variant === 'full'
              ? 'w-full justify-center py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          } ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">{t('pwa.install_app', 'Install App')}</span>
        </button>
      )}

      {/* iOS / Fallback Instructions Modal - Portaled to document.body */}
      {showIOSModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowIOSModal(false)
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
          >
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('pwa.ios_install_title', 'Install on your device')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Instruction Steps */}
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Share className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white block mb-0.5">
                      Step 1
                    </span>
                    <span>
                      {t(
                        'pwa.ios_install_step1',
                        'Tap the Share button at the bottom of Safari'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white block mb-0.5">
                      Step 2
                    </span>
                    <span>
                      {t(
                        'pwa.ios_install_step2',
                        'Scroll down and select "Add to Home Screen"'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {t('common.done', 'Got it')}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
