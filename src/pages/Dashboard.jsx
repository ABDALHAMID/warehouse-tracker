import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { warehouseDb } from '../lib/warehouseDb'
import { getItemLabel, getCategoryLabel } from '../data'
import ItemSymbol from '../components/ItemSymbol'
import {
  Boxes,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  PackageCheck,
  PackageOpen,
  HardHat,
  SlidersHorizontal,
  Globe,
  User,
  Plus,
  Minus,
  X,
  Lock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function formatMovementDate(dateString, t) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const logDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((todayStart - logDayStart) / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) {
    return `${t('common.today', 'Today')}, ${timeStr}`
  }
  if (diffDays === 1) {
    return `${t('common.yesterday', 'Yesterday')}, ${timeStr}`
  }

  const dateStr = date.toLocaleDateString([], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${dateStr}, ${timeStr}`
}

function formatWorkerName(log, fallbackText) {
  if (log?.worker?.full_name) {
    return log.worker.worker_code
      ? `${log.worker.full_name} (${log.worker.worker_code})`
      : log.worker.full_name
  }
  if (
    log?.worker_name &&
    !UUID_PATTERN.test(log.worker_name.trim()) &&
    !log.worker_name.startsWith('worker-')
  ) {
    return log.worker_name
  }
  if (log?.worker?.worker_code) {
    return log.worker.worker_code
  }
  return fallbackText || 'Worker'
}

// Modal for modifying the stock of a selected item directly from the Dashboard
function StockAdjustmentModal({ item, initialAction = 'IN', onClose, onSuccess }) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language || 'en'
  const { user, profile, canModifyStock } = useAuth()
  const [action, setAction] = useState(initialAction === 'OUT' ? 'OUT' : 'IN')
  const [quantity, setQuantity] = useState(10)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const currentStock = Number(item.current_stock ?? 0)
  const unitLabel = item.unit ? t(`common.units.${item.unit}`, item.unit) : ''

  const projectedStock =
    action === 'IN'
      ? currentStock + Number(quantity || 0)
      : Math.max(0, currentStock - Number(quantity || 0))

  const handleConfirm = async (e) => {
    e.preventDefault()
    if (!canModifyStock || quantity <= 0) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const workerId = profile?.id || user?.id
    const workerName = profile?.full_name || user?.email || 'Warehouse Worker'

    const res = await warehouseDb.insertInventoryLog({
      itemId: item.id,
      workerId,
      workerName,
      changeType: action,
      quantity,
      notes: notes.trim(),
    })

    setSubmitting(false)

    if (res.error) {
      setError(t('itemDetail.errorLog', 'Failed to record movement'))
    } else {
      setSuccess(t('itemDetail.successLog', 'Stock adjustment saved successfully!'))
      window.dispatchEvent(
        new CustomEvent('mattrack:item-updated', { detail: { itemId: item.id } })
      )
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 600)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3 min-w-0">
            <ItemSymbol item={item} size="md" />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <SlidersHorizontal className="w-3 h-3" />
                {t('dashboard.adjustStockModalTitle', 'Quick Stock Adjustment')}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 truncate">
                {getItemLabel(item, currentLang)}
              </h3>
              {item.location && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>{item.location}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 touch-manipulation shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Guard */}
        {!canModifyStock ? (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-bold">
            <Lock className="w-5 h-5 shrink-0" />
            <span>{t('profile.read_only_mode', 'Your account is view-only.')}</span>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            {/* Status alerts */}
            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Type Toggle: IN vs OUT */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction('IN')}
                className={`min-h-12 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 touch-manipulation border ${
                  action === 'IN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>{t('itemDetail.inAction', '+ IN (Add Stock)')}</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('OUT')}
                className={`min-h-12 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 touch-manipulation border ${
                  action === 'OUT'
                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Minus className="w-5 h-5 stroke-[3]" />
                <span>{t('itemDetail.outAction', '- OUT (Remove Stock)')}</span>
              </button>
            </div>

            {/* Stepper with Large Buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                {t('itemDetail.quantityLabel', 'Quantity')} {unitLabel ? `(${unitLabel})` : ''}
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-2xl font-black active:scale-95 transition-all cursor-pointer touch-manipulation select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 h-12 sm:h-14 text-center rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-2xl sm:text-3xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center text-2xl font-black active:scale-95 transition-all cursor-pointer touch-manipulation select-none"
                >
                  +
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">
                  {t('itemDetail.quickPresets', 'Presets')}:
                </span>
                {[5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      quantity === preset
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Stock Projection Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  {t('dashboard.currentStock', 'Current Stock')}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {currentStock} {unitLabel}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
              <div className="text-end">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  {t('dashboard.newStockPreview', 'New Stock')}
                </span>
                <span
                  className={`text-base font-black ${
                    action === 'IN'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : projectedStock === 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {projectedStock} {unitLabel}{' '}
                  <span className="text-xs font-semibold opacity-75">
                    ({action === 'IN' ? `+${quantity}` : `-${quantity}`})
                  </span>
                </span>
              </div>
            </div>

            {/* Optional notes */}
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(
                  'dashboard.notesPlaceholder',
                  'Optional reference (e.g. BL, supplier, client...)'
                )}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-12 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm cursor-pointer active:scale-95 transition-all touch-manipulation"
              >
                {t('itemDetail.cancelButton', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 min-h-12 py-3 rounded-xl font-extrabold text-sm text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all touch-manipulation disabled:opacity-60 ${
                  action === 'IN'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                }`}
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{t('dashboard.confirmAdjustment', 'Confirm Adjustment')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language || 'en'
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [userLogs, setUserLogs] = useState([])
  const [selectedItemForModal, setSelectedItemForModal] = useState(null)
  const [modalInitialAction, setModalInitialAction] = useState('IN')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const workerId = profile?.id || user?.id
      const [itemsRes, logsRes, userLogsRes] = await Promise.all([
        warehouseDb.fetchItems(),
        warehouseDb.fetchRecentLogs(15),
        workerId
          ? warehouseDb.fetchRecentLogsForWorker(workerId, 10)
          : Promise.resolve({ data: [] }),
      ])

      const loadedItems = itemsRes.data || []
      const loadedLogs = logsRes.data || []
      const loadedUserLogs = userLogsRes?.data || []

      setItems(loadedItems)
      setRecentLogs(loadedLogs)
      setUserLogs(loadedUserLogs)
    } catch (e) {
      console.error('Failed to load dashboard data', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile?.id, user?.id])

  useEffect(() => {
    loadData()

    // Listen to local item updates for live UI sync
    const handleUpdate = () => {
      loadData()
    }
    window.addEventListener('mattrack:item-updated', handleUpdate)
    return () => {
      window.removeEventListener('mattrack:item-updated', handleUpdate)
    }
  }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Resolve the full item object for a given log
  const getItemForLog = (log) => {
    if (!log) return null
    const matched = items.find((i) => i.id === log.item_id)
    if (matched) return matched
    if (log.items) {
      return {
        id: log.item_id,
        name: log.items.name,
        sku: log.items.sku,
        unit: log.items.unit,
        current_stock: log.items.current_stock ?? log.quantity,
        min_stock_level: log.items.min_stock_level ?? 10,
        location: log.items.location || log.items.location_bin || '',
        category: log.items.categories?.name || log.items.category || '',
      }
    }
    return null
  }

  const lastGlobalLog = recentLogs[0] || null
  const lastGlobalItem = getItemForLog(lastGlobalLog)

  // Deduplicate user candidate logs
  const currentWorkerId = profile?.id || user?.id
  const userCandidateLogs = [
    ...userLogs,
    ...recentLogs.filter((l) => currentWorkerId && l.worker_id === currentWorkerId),
  ]
  const uniqueUserLogs = []
  const seenLogIds = new Set()
  for (const l of userCandidateLogs) {
    if (l && !seenLogIds.has(l.id)) {
      seenLogIds.add(l.id)
      uniqueUserLogs.push(l)
    }
  }

  // CORE REQUIREMENT:
  // If the user's latest movement item is the SAME as the global latest movement item,
  // pick the user's second/different movement item so the user always has TWO DIFFERENT items!
  let lastUserLog = null
  let isPreviousUserMovement = false

  if (uniqueUserLogs.length > 0) {
    const firstUserLog = uniqueUserLogs[0]

    if (lastGlobalLog && firstUserLog.item_id === lastGlobalLog.item_id) {
      // Find the first user log for a DIFFERENT item
      const differentItemLog = uniqueUserLogs.find((l) => l.item_id !== lastGlobalLog.item_id)
      if (differentItemLog) {
        lastUserLog = differentItemLog
        isPreviousUserMovement = true
      } else if (uniqueUserLogs.length > 1) {
        // If all movements are on the same item, pick the second last movement
        lastUserLog = uniqueUserLogs[1]
        isPreviousUserMovement = true
      } else {
        lastUserLog = firstUserLog
      }
    } else {
      lastUserLog = firstUserLog
    }
  }

  const lastUserItem = getItemForLog(lastUserLog)

  const handleOpenAdjustment = (item, defaultAction = 'IN') => {
    if (!item) return
    setSelectedItemForModal(item)
    setModalInitialAction(defaultAction)
  }

  // Filter low stock items: current_stock <= min_stock_level
  const lowStockItems = items.filter(
    (item) => Number(item.current_stock) <= Number(item.min_stock_level)
  )

  const totalUnits = items.reduce(
    (acc, curr) => acc + Number(curr.current_stock || 0),
    0
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Access: Last Modified Items (Global & Personal) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Last Modified in Warehouse (Global DB Log) */}
        <div
          onClick={() =>
            lastGlobalItem &&
            handleOpenAdjustment(
              lastGlobalItem,
              lastGlobalLog?.change_type === 'OUT' ? 'OUT' : 'IN'
            )
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (lastGlobalItem) {
                handleOpenAdjustment(
                  lastGlobalItem,
                  lastGlobalLog?.change_type === 'OUT' ? 'OUT' : 'IN'
                )
              }
            }
          }}
          className={`group relative p-5 rounded-3xl border transition-all duration-200 select-none ${
            lastGlobalItem
              ? 'bg-white dark:bg-slate-900 border-blue-200/90 dark:border-blue-900/60 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer active:scale-[0.99] touch-manipulation'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Header Tag + Action Prompt */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Globe className="w-3.5 h-3.5" />
              {t('dashboard.lastWarehouseActivity')}
            </span>

            {lastGlobalItem && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                <span>{t('dashboard.clickToAdjust')}</span>
                <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-[-90deg]" />
              </span>
            )}
          </div>

          {lastGlobalItem ? (
            <div className="space-y-3">
              {/* Item Info + Current Stock */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <ItemSymbol item={lastGlobalItem} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {getItemLabel(lastGlobalItem, currentLang)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(lastGlobalItem.category || lastGlobalItem.categories?.name) && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[150px]">
                          {getCategoryLabel(lastGlobalItem.category_slug || lastGlobalItem.category_id, currentLang) ||
                            lastGlobalItem.category ||
                            lastGlobalItem.categories?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Stock Pill */}
                <div className="text-end shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('dashboard.currentStock')}
                  </span>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        Number(lastGlobalItem.current_stock) === 0
                          ? 'text-red-600 dark:text-red-400'
                          : Number(lastGlobalItem.current_stock) <=
                              Number(lastGlobalItem.min_stock_level)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {lastGlobalItem.current_stock}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {lastGlobalItem.unit
                        ? t(`common.units.${lastGlobalItem.unit}`, lastGlobalItem.unit)
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Movement Details Footer */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-black text-xs ${
                      lastGlobalLog?.change_type === 'IN'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                        : lastGlobalLog?.change_type === 'OUT'
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {lastGlobalLog?.change_type === 'IN'
                      ? `+${lastGlobalLog.quantity}`
                      : lastGlobalLog?.change_type === 'OUT'
                        ? `-${lastGlobalLog.quantity}`
                        : `${lastGlobalLog?.quantity}`}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                    <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate max-w-[130px]">
                      {formatWorkerName(lastGlobalLog, t('nav.worker'))}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium ms-auto">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatMovementDate(lastGlobalLog?.created_at, t)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('dashboard.noGlobalActivity')}
            </div>
          )}
        </div>

        {/* Card 2: Last Modified by You (Current User) */}
        <div
          onClick={() =>
            lastUserItem &&
            handleOpenAdjustment(
              lastUserItem,
              lastUserLog?.change_type === 'OUT' ? 'OUT' : 'IN'
            )
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (lastUserItem) {
                handleOpenAdjustment(
                  lastUserItem,
                  lastUserLog?.change_type === 'OUT' ? 'OUT' : 'IN'
                )
              }
            }
          }}
          className={`group relative p-5 rounded-3xl border transition-all duration-200 select-none ${
            lastUserItem
              ? 'bg-white dark:bg-slate-900 border-emerald-200/90 dark:border-emerald-900/60 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 cursor-pointer active:scale-[0.99] touch-manipulation'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Header Tag + Action Prompt */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <User className="w-3.5 h-3.5" />
              {isPreviousUserMovement
                ? t('dashboard.yourPreviousActivity')
                : t('dashboard.yourLastActivity')}
            </span>

            {lastUserItem && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                <span>{t('dashboard.clickToAdjust')}</span>
                <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-[-90deg]" />
              </span>
            )}
          </div>

          {lastUserItem ? (
            <div className="space-y-3">
              {/* Item Info + Current Stock */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <ItemSymbol item={lastUserItem} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {getItemLabel(lastUserItem, currentLang)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(lastUserItem.category || lastUserItem.categories?.name) && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[150px]">
                          {getCategoryLabel(lastUserItem.category_slug || lastUserItem.category_id, currentLang) ||
                            lastUserItem.category ||
                            lastUserItem.categories?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Stock Pill */}
                <div className="text-end shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('dashboard.currentStock')}
                  </span>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        Number(lastUserItem.current_stock) === 0
                          ? 'text-red-600 dark:text-red-400'
                          : Number(lastUserItem.current_stock) <=
                              Number(lastUserItem.min_stock_level)
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {lastUserItem.current_stock}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {lastUserItem.unit
                        ? t(`common.units.${lastUserItem.unit}`, lastUserItem.unit)
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Movement Details Footer */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-black text-xs ${
                      lastUserLog?.change_type === 'IN'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                        : lastUserLog?.change_type === 'OUT'
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {lastUserLog?.change_type === 'IN'
                      ? `+${lastUserLog.quantity}`
                      : lastUserLog?.change_type === 'OUT'
                        ? `-${lastUserLog.quantity}`
                        : `${lastUserLog?.quantity}`}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                    <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{t('dashboard.byYou')}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium ms-auto">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatMovementDate(lastUserLog?.created_at, t)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 m-0">
                {t('dashboard.noUserActivityTitle')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {t('dashboard.noUserActivityDesc')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Empty Database Stock Warning */}
      {items.length === 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <PackageOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 m-0 leading-tight">
                {t('dashboard.noDataInStockTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                {t('dashboard.noDataInStockDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shrink-0 cursor-pointer active:scale-95 transition-all shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? t('common.loading') : t('common.refresh', 'Refresh')}</span>
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Catalog Items */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('dashboard.totalItems')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {items.length}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('categories.all')}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts Count */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-colors ${lowStockItems.length > 0
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${lowStockItems.length > 0
                ? 'text-amber-800 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              {t('dashboard.lowStockAlerts')}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockItems.length > 0
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}
            >
              {lowStockItems.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <div
              className={`text-3xl sm:text-4xl font-black ${lowStockItems.length > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
                }`}
            >
              {lowStockItems.length}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {lowStockItems.length > 0
                ? t('dashboard.criticalAlertsSubtitle')
                : t('dashboard.healthyStock', 'Healthy levels')}
            </span>
          </div>
        </div>

        {/* Total Units in Yard */}
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('dashboard.totalUnits')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {totalUnits.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('dashboard.stockHealth')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div>
        {/* Browse Inventory Card */}
        <Link
          to="/inventory"
          className="group p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.99] text-white shadow-lg transition-all flex items-center justify-between cursor-pointer touch-manipulation select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Boxes className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight text-white m-0">
                {t('dashboard.browseInventory')}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {t('inventory.subtitle')}
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 shrink-0 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* CORE SPECIFICATION: LOW STOCK ALERTS LIST */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white m-0">
              {t('dashboard.criticalAlertsTitle')}
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            {lowStockItems.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 text-center flex flex-col items-center justify-center">
            <PackageOpen className="w-10 h-10 text-slate-400 mb-2" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              {t('dashboard.noDataInStockTitle')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {t('dashboard.noDataInStockDesc')}
            </p>
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center flex flex-col items-center justify-center">
            <PackageCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              {t('dashboard.noAlerts')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockItems.map((item) => {
              const stock = Number(item.current_stock)
              const min = Number(item.min_stock_level)
              const pct = Math.min(100, Math.round((stock / (min || 1)) * 100))

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400/70 dark:border-amber-600/60 shadow-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <ItemSymbol item={item} size="sm" />
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug truncate">
                          {getItemLabel(item, currentLang)}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.location || 'Warehouse Yard'}
                        </p>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        {item.current_stock}{' '}
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t(`common.units.${item.unit}`, item.unit)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold">
                        {t('dashboard.minStock')}: {item.min_stock_level}
                      </div>
                    </div>
                  </div>

                  {/* Stock bar progress against minimum safety threshold */}
                  <div className="w-full">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-amber-700 dark:text-amber-400">
                        {stock === 0 ? t('inventory.outOfStock') : `${pct}% of safety limit`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${stock === 0
                          ? 'bg-red-600'
                          : stock < min * 0.5
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                          }`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Large Touch Target Action to Restock */}
                  <Link
                    to={`/item/${item.id}`}
                    className="w-full min-h-12 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer touch-manipulation select-none"
                  >
                    <span>{t('dashboard.restockNow')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent Yard Movements Feed */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white m-0">
              {t('dashboard.recentActivityTitle')}
            </h2>
          </div>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            {t('dashboard.noRecentActivity')}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
            {recentLogs.map((log) => {
              const isAdjustment = log.change_type === 'ADJUSTMENT'
              const isAdd = log.change_type === 'IN'
              const workerDisplayName = formatWorkerName(log, t('nav.worker'))
              const dateDisplay = formatMovementDate(log.created_at, t)
              const matchedItem = items.find((i) => i.id === log.item_id)
              const itemName = log.items?.name || matchedItem?.name || `Material ID: ${log.item_id}`
              const itemUnit = log.items?.unit || matchedItem?.unit

              return (
                <div
                  key={log.id}
                  onClick={() => {
                    const itm = matchedItem || (log.items ? { ...log.items, id: log.item_id } : null)
                    if (itm) {
                      handleOpenAdjustment(itm, log.change_type === 'OUT' ? 'OUT' : 'IN')
                    }
                  }}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAdjustment
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
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {itemName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{workerDisplayName}</span>
                        </span>
                        <span>•</span>
                        <span>{dateDisplay}</span>
                        {log.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[140px] sm:max-w-xs">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-base font-black shrink-0 ${isAdjustment
                      ? 'text-blue-600 dark:text-blue-400'
                      : isAdd
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                      }`}
                  >
                    {isAdjustment ? log.quantity : isAdd ? `+${log.quantity}` : `-${log.quantity}`}{' '}
                    {itemUnit && (
                      <span className="text-xs font-semibold text-slate-400">
                        {t(`common.units.${itemUnit}`, itemUnit)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Stock Adjustment Modal */}
      {selectedItemForModal && (
        <StockAdjustmentModal
          item={selectedItemForModal}
          initialAction={modalInitialAction}
          onClose={() => setSelectedItemForModal(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
