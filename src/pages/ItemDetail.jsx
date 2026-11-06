import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { warehouseDb } from '../lib/warehouseDb'
import { useAuth } from '../context/AuthContext'
import {
  getItemLabel,
  getCategoryLabel,
  getItemLength,
} from '../data'
import ItemSymbol from '../components/ItemSymbol'
import {
  ArrowLeft,
  Plus,
  Minus,
  Radio,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Truck,
  HardHat,
  Lock,
  SlidersHorizontal,
} from 'lucide-react'

export default function ItemDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language || 'en'
  const { user, profile, canModifyStock } = useAuth()

  const [item, setItem] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal / Adjustment state
  const [activeAction, setActiveAction] = useState(null) // 'IN' or 'OUT' or null
  const [quantity, setQuantity] = useState(10)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [actionError, setActionError] = useState(null)

  // Fetch item and logs
  const loadItemData = useCallback(async () => {
    try {
      const [itemRes, logsRes] = await Promise.all([
        warehouseDb.fetchItemById(id),
        warehouseDb.fetchItemLogs(id),
      ])
      if (itemRes.data) setItem(itemRes.data)
      if (logsRes.data) setLogs(logsRes.data)
    } catch (e) {
      console.error('Error loading item detail:', e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadItemData()

    // CORE SPECIFICATION: Realtime subscription on this component so current_stock updates automatically
    const unsubscribe = warehouseDb.subscribeToItemChanges(id, (updatedItem) => {
      console.log('Realtime update received for item:', updatedItem)
      setItem((prev) => {
        if (!prev) return updatedItem
        return {
          ...prev,
          ...updatedItem,
          current_stock: updatedItem.current_stock,
        }
      })
      // Also reload the logs
      warehouseDb.fetchItemLogs(id).then((res) => {
        if (res.data) setLogs(res.data)
      })
    })

    return () => {
      unsubscribe()
    }
  }, [id, loadItemData])


  const handleOpenAction = (type) => {
    if (!canModifyStock) return
    setActiveAction(type)
    setQuantity(10)
    setNotes('')
    setActionSuccess(null)
    setActionError(null)
  }

  const handleConfirmAdjustment = async (e) => {
    e.preventDefault()
    if (!activeAction || quantity <= 0 || !canModifyStock) return

    setSubmitting(true)
    setActionError(null)
    setActionSuccess(null)

    // inventory_logs.worker_id references worker_profiles(id) = auth.users.id
    const workerId = profile?.id || user?.id
    const workerName = profile?.full_name || user?.email || 'Warehouse Worker'

    // CORE SPECIFICATION:
    // Insert a row into the inventory_logs table (item_id, worker_id, change_type, quantity).
    // The database trigger handles the math!
    const res = await warehouseDb.insertInventoryLog({
      itemId: item.id,
      workerId,
      workerName,
      changeType: activeAction,
      quantity,
      notes,
    })

    setSubmitting(false)

    if (res.error) {
      setActionError(t('itemDetail.errorLog'))
    } else {
      setActionSuccess(t('itemDetail.successLog'))
      // Update local view immediately if returned
      if (res.updatedItem) {
        setItem(res.updatedItem)
      }
      // Refresh logs
      warehouseDb.fetchItemLogs(item.id).then((r) => {
        if (r.data) setLogs(r.data)
      })
      setTimeout(() => {
        setActiveAction(null)
        setActionSuccess(null)
      }, 1400)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">{t('scanner.skuNotFoundTitle')}</h2>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('itemDetail.back')}
        </Link>
      </div>
    )
  }

  const stock = Number(item.current_stock)
  const min = Number(item.min_stock_level)
  const isOutOfStock = stock <= 0
  const isLowStock = stock > 0 && stock <= min

  return (
    <div className="space-y-6">
      {/* Top Header / Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('itemDetail.back')}</span>
        </Link>

        {/* Realtime Live Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          <span>{t('itemDetail.realtimeBadge')}</span>
        </div>
      </div>

      {/* Main Material Detail Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Title & Category */}
        <div className="flex items-start gap-4">
          <ItemSymbol item={item} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {getCategoryLabel(item.category_slug || item.category_id, currentLang) || item.category}
              </span>
              {getItemLength(item) && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {getItemLength(item)}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {getItemLabel(item, currentLang)}
            </h1>

            {item.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Location & Status chips */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 border-y border-slate-100 dark:border-slate-800 py-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {item.location || 'Yard Area'}
            </span>
          </div>

          <div>•</div>

          <div className="flex items-center gap-1.5 font-bold">
            {isOutOfStock ? (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {t('inventory.outOfStock')}
              </span>
            ) : isLowStock ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {t('inventory.lowStock')}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t('inventory.inStock')}
              </span>
            )}
          </div>
        </div>

        {/* Large Current Stock Display */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('itemDetail.currentStock')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-5xl sm:text-6xl font-black tracking-tight ${
                  isOutOfStock
                    ? 'text-red-600 dark:text-red-400'
                    : isLowStock
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {item.current_stock}
              </span>
              <span className="text-lg font-bold text-slate-500 dark:text-slate-400">
                {t(`common.units.${item.unit}`, item.unit)}
              </span>
            </div>
          </div>

          <div className="text-start sm:text-end text-xs font-bold text-slate-500 dark:text-slate-400 space-y-1">
            <div>
              {t('itemDetail.minStock')}:{' '}
              <span className="text-slate-900 dark:text-white font-mono text-sm">
                {item.min_stock_level} {t(`common.units.${item.unit}`, item.unit)}
              </span>
            </div>
            {isLowStock && (
              <div className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center sm:justify-end gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Restock recommended</span>
              </div>
            )}
          </div>
        </div>

        {/* CORE SPECIFICATION: Large IN (Add Stock) & OUT (Remove Stock) Buttons (RBAC-gated) */}
        {!canModifyStock ? (
          <div className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{t('profile.read_only_mode')}</span>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Large Green Button: ADD STOCK / IN */}
          <button
            type="button"
            onClick={() => handleOpenAction('IN')}
            className="w-full min-h-20 p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-lg shadow-emerald-600/30 flex items-center justify-between transition-all cursor-pointer touch-manipulation select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Plus className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="text-start">
                <div className="text-xl font-black leading-tight tracking-wide">
                  {t('itemDetail.inAction')}
                </div>
                <div className="text-xs text-emerald-100 font-medium">
                  {t('itemDetail.quickAddSubtitle')}
                </div>
              </div>
            </div>
          </button>

          {/* Large Red Button: REMOVE STOCK / OUT */}
          <button
            type="button"
            onClick={() => handleOpenAction('OUT')}
            className="w-full min-h-20 p-5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white shadow-lg shadow-red-600/30 flex items-center justify-between transition-all cursor-pointer touch-manipulation select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Minus className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="text-start">
                <div className="text-xl font-black leading-tight tracking-wide">
                  {t('itemDetail.outAction')}
                </div>
                <div className="text-xs text-red-100 font-medium">
                  {t('itemDetail.quickOutSubtitle')}
                </div>
              </div>
            </div>
          </button>
        </div>
        )}
      </div>

      {/* Stock Adjustment Modal / Drawer */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded ${
                    activeAction === 'IN'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                  }`}
                >
                  {activeAction === 'IN'
                    ? t('itemDetail.typeIn')
                    : t('itemDetail.typeOut')}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {item.name}
                </h3>
              </div>

              <div className="text-end">
                <span className="text-xs text-slate-400 font-medium">Current</span>
                <div className="text-lg font-black text-slate-800 dark:text-slate-200">
                  {item.current_stock}
                </div>
              </div>
            </div>

            {/* Alert Messages */}
            {actionSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Adjustment Form */}
            <form onSubmit={handleConfirmAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  {t('itemDetail.quantityLabel')} ({t(`common.units.${item.unit}`, item.unit)})
                </label>

                {/* Stepper with Large Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-2xl font-black active:scale-95 transition-all cursor-pointer touch-manipulation select-none"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    className="flex-1 h-14 text-center rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-3xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-2xl font-black active:scale-95 transition-all cursor-pointer touch-manipulation select-none"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400">
                    {t('itemDetail.quickPresets')}:
                  </span>
                  {[5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        quantity === preset
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Note / Reference Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  {t('itemDetail.notesLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                    <Truck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('itemDetail.notesPlaceholder')}
                    className="w-full ps-10 pe-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  disabled={submitting}
                  className="flex-1 min-h-13 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm active:scale-95 transition-all cursor-pointer touch-manipulation"
                >
                  {t('itemDetail.cancelButton')}
                </button>

                <button
                  type="submit"
                  disabled={submitting || quantity <= 0}
                  className={`flex-1 min-h-13 px-4 py-3 rounded-2xl font-extrabold text-sm text-white shadow-lg active:scale-95 transition-all cursor-pointer touch-manipulation disabled:opacity-50 ${
                    activeAction === 'IN'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                  }`}
                >
                  {submitting ? t('itemDetail.submitting') : t('itemDetail.confirmButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log / Movement History for this material */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white m-0">
            {t('itemDetail.recentLogsTitle')}
          </h2>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            {t('itemDetail.noLogs')}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
            {logs.map((log) => {
              const isAdjustment = log.change_type === 'ADJUSTMENT'
              const isAdd = log.change_type === 'IN'
              const typeLabel = isAdjustment
                ? t('itemDetail.typeAdjustment')
                : isAdd
                ? t('itemDetail.typeIn')
                : t('itemDetail.typeOut')
              const workerLabel = log.worker?.full_name
                ? `${log.worker.full_name}${log.worker.worker_code ? ` (${log.worker.worker_code})` : ''}`
                : log.worker_name || log.worker_id
              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAdjustment
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : isAdd
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isAdjustment ? (
                        <SlidersHorizontal className="w-5 h-5" />
                      ) : isAdd ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {typeLabel}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <HardHat className="w-3 h-3 text-amber-500" />
                          {workerLabel}
                        </span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        {log.notes && (
                          <>
                            <span>•</span>
                            <span className="italic">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-lg font-black shrink-0 ${
                      isAdjustment
                        ? 'text-blue-600 dark:text-blue-400'
                        : isAdd
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isAdjustment ? log.quantity : isAdd ? `+${log.quantity}` : `-${log.quantity}`}{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      {t(`common.units.${item.unit}`, item.unit)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
