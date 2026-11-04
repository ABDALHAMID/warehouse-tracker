import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ScanBarcode,
  Boxes,
  LayoutDashboard,
  Clock,
} from 'lucide-react'

/**
 * ScanView - Barcode & QR Scanner
 * NOTE: Temporarily frozen per user request. Will be re-enabled in a future update.
 */
export default function ScanView() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 max-w-lg mx-auto py-8 px-4 text-center">
      {/* Frozen Scanner Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ScanBarcode className="w-10 h-10" />
          </div>
          <span className="absolute -top-1 -end-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Frozen</span>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('scanner.frozenTitle', 'Scanner Temporarily Frozen')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            {t(
              'scanner.frozenDesc',
              'Barcode and QR scanning is paused for now. This feature will be re-enabled in an upcoming release.'
            )}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            to="/inventory"
            className="flex-1 min-h-12 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-600/20"
          >
            <Boxes className="w-4 h-4" />
            <span>{t('nav.inventory')}</span>
          </Link>

          <Link
            to="/"
            className="flex-1 min-h-12 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('nav.dashboard')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
