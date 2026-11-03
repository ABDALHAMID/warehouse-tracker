import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { warehouseDb } from '../lib/warehouseDb'
import {
  Boxes,
  AlertTriangle,
  ScanBarcode,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  PackageCheck,
  PackageOpen,
} from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [itemsRes, logsRes] = await Promise.all([
        warehouseDb.fetchItems(),
        warehouseDb.fetchRecentLogs(6),
      ])
      if (itemsRes.data) setItems(itemsRes.data)
      if (logsRes.data) setRecentLogs(logsRes.data)
    } catch (e) {
      console.error('Failed to load dashboard data', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

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
      {/* Top Banner / Welcome & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            {t('dashboard.title')}
          </h1>
          <p className="text-blue-100 dark:text-slate-300 text-sm max-w-xl">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold border border-white/20 cursor-pointer touch-manipulation select-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? t('common.loading') : t('common.refresh', 'Refresh')}</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -end-10 -bottom-10 w-44 h-44 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
      </div>

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
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shrink-0 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.refresh', 'Refresh')}</span>
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
          className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-colors ${
            lowStockItems.length > 0
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                lowStockItems.length > 0
                  ? 'text-amber-800 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t('dashboard.lowStockAlerts')}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                lowStockItems.length > 0
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
              className={`text-3xl sm:text-4xl font-black ${
                lowStockItems.length > 0
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Scan Shortcut Card */}
        <Link
          to="/scan"
          className="group p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-between cursor-pointer touch-manipulation select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ScanBarcode className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight text-white m-0">
                {t('dashboard.scanShortcutTitle')}
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                {t('dashboard.scanShortcutDesc')}
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 shrink-0 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </Link>

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
                    <div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.sku}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.location || 'Warehouse Yard'}
                      </p>
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
                        className={`h-full rounded-full transition-all duration-300 ${
                          stock === 0
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
              const isAdd = log.change_type === 'IN'
              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAdd
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isAdd ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {log.items?.name || `Material ID: ${log.item_id}`}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{log.worker_name || log.worker_id}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                    className={`text-base font-black shrink-0 ${
                      isAdd
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isAdd ? `+${log.quantity}` : `-${log.quantity}`}
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
