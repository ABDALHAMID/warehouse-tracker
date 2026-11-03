import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Scanner from '../components/Scanner'
import { warehouseDb } from '../lib/warehouseDb'
import {
  ScanBarcode,
  Search,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Boxes,
  Zap,
} from 'lucide-react'

export default function ScanView() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [manualSku, setManualSku] = useState('')
  const [searching, setSearching] = useState(false)
  const [notFoundSku, setNotFoundSku] = useState(null)
  const [paused, setPaused] = useState(false)

  // Handle barcode scanned from camera
  const handleBarcodeScan = async (decodedSku) => {
    if (searching || paused || !decodedSku) return
    setPaused(true)
    await processSkuLookup(decodedSku)
  }

  // Lookup SKU in database
  const processSkuLookup = async (skuToSearch) => {
    setSearching(true)
    setNotFoundSku(null)

    try {
      const { data: item } = await warehouseDb.fetchItemBySku(skuToSearch)
      if (item && item.id) {
        // Found! Redirect to item detail page
        navigate(`/item/${item.id}`)
      } else {
        // Not found, display helpful modal
        setNotFoundSku(skuToSearch)
      }
    } catch (err) {
      console.error('Error querying item by SKU:', err)
      setNotFoundSku(skuToSearch)
    } finally {
      setSearching(false)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualSku.trim()) return
    processSkuLookup(manualSku.trim())
  }

  const handleRetry = () => {
    setNotFoundSku(null)
    setManualSku('')
    setPaused(false)
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <ScanBarcode className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <span>{t('scanner.title')}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('scanner.subtitle')}
        </p>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative">
        <Scanner onScan={handleBarcodeScan} paused={paused || searching || !!notFoundSku} />

        {/* Searching overlay indicator */}
        {searching && (
          <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-white p-6">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-base font-bold">Querying material catalog...</p>
          </div>
        )}
      </div>

      {/* Manual SKU input bar (Supports handheld barcode guns and manual typing) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <Search className="w-4 h-4 text-blue-500" />
          <span>{t('scanner.manualEntryTitle')}</span>
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualSku}
            onChange={(e) => setManualSku(e.target.value)}
            placeholder={t('scanner.manualPlaceholder')}
            className="flex-1 px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={!manualSku.trim() || searching}
            className="px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer touch-manipulation select-none"
          >
            <span>{t('scanner.lookupButton')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>

        {/* Quick Testing Barcode Chips for convenience */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick test barcode SKUs:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['CEM-45-001', 'STL-12-101', 'BRK-06-201', 'PLM-PVC-401'].map((sku) => (
              <button
                key={sku}
                type="button"
                onClick={() => processSkuLookup(sku)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                {sku}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Material Not Found Modal */}
      {notFoundSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {t('scanner.skuNotFoundTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('scanner.skuNotFoundDesc', { sku: notFoundSku })}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full min-h-12 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm active:scale-95 transition-all cursor-pointer touch-manipulation"
              >
                {t('scanner.retryScan')}
              </button>

              <Link
                to="/inventory"
                className="w-full min-h-12 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer touch-manipulation"
              >
                <Boxes className="w-4 h-4" />
                <span>{t('scanner.viewAllInventory')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
