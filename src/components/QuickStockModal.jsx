import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { warehouseDb } from '../lib/warehouseDb'
import { getItemLabel, getItemLength } from '../data'
import ItemSymbol from './ItemSymbol'
import {
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
  Plus,
  Minus,
} from 'lucide-react'

export default function QuickStockModal({ item, onClose, onSuccess }) {
  const { t, i18n } = useTranslation()
  const { user, profile, canModifyStock } = useAuth()
  const currentLang = i18n.language || 'en'

  const [changeType, setChangeType] = useState('IN')
  const [quantity, setQuantity] = useState(10)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const inputRef = useRef(null)

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 80)
    return () => clearTimeout(timer)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!item) return null

  const currentStock = Number(item.current_stock || 0)
  const parsedQty = Math.max(0, Number(quantity) || 0)
  const newStock =
    changeType === 'IN'
      ? currentStock + parsedQty
      : Math.max(0, currentStock - parsedQty)

  const presets = [1, 5, 10, 20, 50]

  const handleAddPreset = (val) => {
    setQuantity((prev) => (Number(prev) || 0) + val)
  }

  const handleIncrement = (step) => {
    setQuantity((prev) => Math.max(1, (Number(prev) || 0) + step))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canModifyStock || submitting) return

    const qtyNum = Number(quantity)
    if (!qtyNum || qtyNum <= 0) {
      setErrorMsg(t('quick_update.invalid_qty', 'Please enter a valid quantity greater than 0.'))
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    const workerId =
      user?.id || profile?.id || '00000000-0000-0000-0000-000000000000'

    try {
      const res = await warehouseDb.insertInventoryLog({
        itemId: item.id,
        workerId,
        changeType,
        quantity: qtyNum,
        notes: notes.trim(),
      })

      if (res.error) {
        setErrorMsg(res.error.message || 'Failed to update stock')
        setSubmitting(false)
      } else {
        const updatedItem = res.updatedItem || {
          ...item,
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        }
        onSuccess?.(updatedItem, changeType, qtyNum)
        onClose()
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error executing stock update')
      setSubmitting(false)
    }
  }

  const modalJSX = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9995] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-250">
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <ItemSymbol item={item} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {item.sku || 'PTR'}
                </span>
                {getItemLength(item) && (
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {getItemLength(item)}
                  </span>
                )}
                {item.location_bin && (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {item.location_bin}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight truncate">
                {getItemLabel(item, currentLang)}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Action Tabs: IN vs OUT */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setChangeType('IN')}
              className={`py-3 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                changeType === 'IN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>+ IN ({t('quick_update.in_label', 'Entrée')})</span>
            </button>

            <button
              type="button"
              onClick={() => setChangeType('OUT')}
              className={`py-3 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                changeType === 'OUT'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>- OUT ({t('quick_update.out_label', 'Sortie')})</span>
            </button>
          </div>

          {/* Large Quantity Stepper Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{t('quick_update.quantity', 'Quantity to Move')}</span>
              <span className="text-slate-400 font-medium lowercase">
                {t(`common.units.${item.unit}`, item.unit || 'piece')}
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleIncrement(-1)}
                className="w-13 h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xl transition-all active:scale-90 cursor-pointer shrink-0 border border-slate-200/80 dark:border-slate-700"
                aria-label="Decrease quantity by 1"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="10"
                  required
                  className="w-full px-4 py-3 text-center text-4xl font-black font-mono rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => handleIncrement(1)}
                className="w-13 h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xl transition-all active:scale-90 cursor-pointer shrink-0 border border-slate-200/80 dark:border-slate-700"
                aria-label="Increase quantity by 1"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Tap Presets with Tactile Feedback */}
            <div className="flex items-center gap-1.5 justify-center pt-1 flex-wrap">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddPreset(val)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-90 active:bg-blue-600 active:text-white transition-all cursor-pointer shadow-2xs"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuantity(0)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Live Preview Box with Pop Animation on Change */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
              changeType === 'IN'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('quick_update.stock_preview', 'Stock Preview')}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                  {currentStock}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                <span
                  key={`${changeType}-${newStock}`}
                  className={`text-2xl font-black number-pop ${
                    changeType === 'IN'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {newStock}
                </span>
              </div>
            </div>

            <div className="text-end">
              <span
                key={`${changeType}-${parsedQty}`}
                className={`text-xs font-black uppercase px-2 py-1 rounded-lg number-pop inline-block ${
                  changeType === 'IN'
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300'
                }`}
              >
                {changeType === 'IN' ? `+${parsedQty}` : `-${parsedQty}`}
              </span>
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(
                'quick_update.note_placeholder',
                'Optional note (e.g., Bon de livraison, client, chantier)'
              )}
              className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirm Button */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-sm active:scale-95 transition-all cursor-pointer"
            >
              {t('common.cancel', 'Cancel')}
            </button>

            <button
              type="submit"
              disabled={submitting || !canModifyStock || parsedQty <= 0}
              className={`flex-2 py-3.5 px-5 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                changeType === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/25'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('common.saving', 'Saving...')}</span>
                </>
              ) : !canModifyStock ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t('quick_update.read_only', 'Read Only')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {changeType === 'IN'
                      ? t('quick_update.confirm_in', 'Confirm IN (+)')
                      : t('quick_update.confirm_out', 'Confirm OUT (-)')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalJSX, document.body)
}
