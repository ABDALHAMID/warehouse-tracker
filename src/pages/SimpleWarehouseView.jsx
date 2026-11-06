import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { warehouseDb } from '../lib/warehouseDb'
import {
  CATEGORIES_TYPES,
  getCategoryLabel,
  getItemLabel,
  getItemLength,
  getLengthsFromItems,
  sortItemsByLength,
  parseLength,
} from '../data'
import QuickStockModal from '../components/QuickStockModal'
import ItemSymbol from '../components/ItemSymbol'
import WarehouseSidebar from '../components/WarehouseSidebar'
import {
  Boxes,
  Search,
  X,
  HardHat,
  Clock,
  Sparkles,
  RefreshCw,
  Menu,
  CheckCircle2,
} from 'lucide-react'

// Relative time formatting helper
function formatRelativeTime(dateString, t) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 45) {
    return t('last_managed.just_now', 'Just now')
  }
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return t('last_managed.minutes_ago', '{{count}}m ago', { count: diffMin })
  }
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    return t('last_managed.hours_ago', '{{count}}h ago', { count: diffHours })
  }
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return t('dashboard.yesterday', 'Yesterday')
  }
  if (diffDays < 7) {
    return t('last_managed.days_ago', '{{count}}d ago', { count: diffDays })
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function SimpleWarehouseView() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuth()
  const currentLang = i18n.language || 'en'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLength, setSelectedLength] = useState('all') // 'all' or float (e.g. 2.2)
  const [sortBy, setSortBy] = useState('last_managed') // 'last_managed', 'length_asc', 'length_desc', 'stock_asc'

  // Quick Stock Modal target item
  const [activeItem, setActiveItem] = useState(null)

  // Floating Toast
  const [toast, setToast] = useState(null)

  // Sidebar Drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Highlighted item ID for smooth update animation
  const [highlightedItemId, setHighlightedItemId] = useState(null)

  const workerName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    t('nav.worker', 'Worker')

  // Load items ordered by updated_at DESC (Last Managed first)
  const loadItems = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const { data, error } = await warehouseDb.fetchItems({
        orderBy: 'updated_at',
        ascending: false,
      })

      if (!error && Array.isArray(data)) {
        setItems(data)
      }
    } catch (err) {
      console.error('Error fetching items for SimpleWarehouseView:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Realtime subscription on all items so modified items jump to #1
  useEffect(() => {
    const unsubscribe = warehouseDb.subscribeToAllItems((updatedItem) => {
      if (!updatedItem?.id) return

      setHighlightedItemId(updatedItem.id)
      setTimeout(() => setHighlightedItemId(null), 2200)

      setItems((prevItems) => {
        const filtered = prevItems.filter((i) => i.id !== updatedItem.id)
        // Insert at the very top (Last Managed)
        return [updatedItem, ...filtered]
      })
    })

    const handleWindowUpdate = (e) => {
      const updated = e.detail?.item
      if (updated?.id) {
        setHighlightedItemId(updated.id)
        setTimeout(() => setHighlightedItemId(null), 2200)
        setItems((prevItems) => {
          const filtered = prevItems.filter((i) => i.id !== updated.id)
          return [updated, ...filtered]
        })
      } else {
        loadItems(true)
      }
    }

    window.addEventListener('mattrack:item-updated', handleWindowUpdate)

    return () => {
      unsubscribe()
      window.removeEventListener('mattrack:item-updated', handleWindowUpdate)
    }
  }, [loadItems])

  // Dynamic category pills
  const categoryPills = useMemo(() => {
    const cats = [
      { id: 'all', slug: 'all', name: t('categories.all', 'All') },
      ...CATEGORIES_TYPES.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: getCategoryLabel(c, currentLang),
      })),
    ]
    return cats
  }, [t, currentLang])

  // Extract unique available lengths dynamically from current DB items
  const availableLengths = useMemo(() => {
    return getLengthsFromItems(items)
  }, [items])

  // Filter items by search query, category, length, and sort
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    let result = items.filter((item) => {
      const localizedName = getItemLabel(item, currentLang).toLowerCase()
      const rawName = (item.name || '').toLowerCase()
      const sku = (item.sku || '').toLowerCase()
      const location = (item.location_bin || '').toLowerCase()

      const matchesSearch =
        !q ||
        localizedName.includes(q) ||
        rawName.includes(q) ||
        sku.includes(q) ||
        location.includes(q)

      const matchesCat =
        selectedCategory === 'all' ||
        item.category_id === selectedCategory ||
        item.category_slug === selectedCategory ||
        (selectedCategory === 'concrete-beams' &&
          (item.category_slug === 'poutrelle' || item.sku?.startsWith('PTR-'))) ||
        (selectedCategory === 'poutrelle' &&
          (item.category_slug === 'concrete-beams' || item.sku?.startsWith('PTR-')))

      // Length filter
      const itemLen = parseLength(item)
      const matchesLength =
        selectedLength === 'all' ||
        (itemLen != null && Math.abs(itemLen - Number(selectedLength)) < 0.01)

      return matchesSearch && matchesCat && matchesLength
    })

    // Apply sorting
    if (sortBy === 'length_asc') {
      result = sortItemsByLength(result, true)
    } else if (sortBy === 'length_desc') {
      result = sortItemsByLength(result, false)
    } else if (sortBy === 'stock_asc') {
      result = [...result].sort(
        (a, b) => Number(a.current_stock || 0) - Number(b.current_stock || 0)
      )
    }
    // 'last_managed' preserves the original DB updated_at DESC order

    return result
  }, [items, searchTerm, selectedCategory, selectedLength, sortBy, currentLang])

  const handleStockSuccess = (updatedItem, changeType, quantity) => {
    // Highlight the updated item with pulse glow
    setHighlightedItemId(updatedItem.id)
    setTimeout(() => {
      setHighlightedItemId(null)
    }, 2200)

    // Show toast
    const symbol = changeType === 'IN' ? '+' : '-'
    const actionLabel =
      changeType === 'IN'
        ? t('quick_update.stock_added', 'Stock Added')
        : t('quick_update.stock_deducted', 'Stock Deducted')
    setToast({
      title: `${getItemLabel(updatedItem, currentLang)}`,
      message: `${actionLabel} (${symbol}${quantity} ${t(`common.units.${updatedItem.unit}`, updatedItem.unit || 'pcs')})`,
      type: changeType === 'IN' ? 'success' : 'alert',
    })

    setTimeout(() => {
      setToast(null)
    }, 2800)

    // Ensure item jumps to the top
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== updatedItem.id)
      return [updatedItem, ...filtered]
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-blue-500 selection:text-white">
      {/* Ultra-Clean Minimal Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Brand & Worker Pill */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20 shrink-0">
              <Boxes className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white truncate">
                  {t('app.title', 'Chofi Warehouse')}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Simple</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <HardHat className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="font-bold truncate max-w-[110px] sm:max-w-[160px]">
                  {workerName}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {profile?.assigned_zone || 'el hommer 2'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Refresh & More Options Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Refresh Icon */}
            <button
              type="button"
              onClick={() => loadItems(true)}
              disabled={refreshing}
              title={t('common.refresh', 'Refresh')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`}
              />
            </button>

            {/* More Options Button (Opens Sidebar Drawer) */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('sidebar.options_title', 'Warehouse Options')}
              title={t('sidebar.options_title', 'Warehouse Options')}
              className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Menu className="w-4 h-4" />
              <span className="font-extrabold">{t('nav.options', 'Options')}</span>
            </button>
          </div>
        </div>

        {/* Quick Search Bar inside Header */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-2.5">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                'simple_mode.search_placeholder',
                'Search Poutrelle length, name, or SKU...'
              )}
              className="w-full ps-10 pe-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 space-y-3.5 pb-16">
        {/* Category Filter Pills & Order Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Scrollable Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryPills.map((cat) => {
              const active = selectedCategory === cat.slug || selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`min-h-8 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* Sort Selector & Refresh */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort items"
              className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value="last_managed">🕒 {t('simple_mode.sorted_by_last_managed', 'Last Managed')}</option>
              <option value="length_asc">📏 {t('simple_mode.sort_length_asc', 'Length: 2m → 7.2m')}</option>
              <option value="length_desc">📐 {t('simple_mode.sort_length_desc', 'Length: 7.2m → 2m')}</option>
              <option value="stock_asc">📦 {t('simple_mode.sort_stock_low', 'Low Stock First')}</option>
            </select>
            <button
              type="button"
              onClick={() => loadItems(true)}
              aria-label="Refresh"
              title="Refresh Items"
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Length Filter Pills extracted from DB */}
        {availableLengths.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
            <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 ps-1 shrink-0 flex items-center gap-1">
              <span>📏</span>
              <span className="hidden sm:inline">{t('simple_mode.length', 'Length')}:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedLength('all')}
              className={`min-h-7 px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                selectedLength === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t('categories.all', 'All')}
            </button>
            {availableLengths.map((len) => {
              const active = selectedLength === len
              return (
                <button
                  key={len}
                  type="button"
                  onClick={() => setSelectedLength(len)}
                  className={`min-h-7 px-2.5 py-1 rounded-lg text-xs font-mono font-black whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {len.toFixed(2)}m
                </button>
              )
            })}
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 animate-pulse"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/5" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-2/5" />
                  </div>
                </div>
                <div className="w-14 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {t('inventory.noItems', 'No items found')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {searchTerm
                ? `No items match "${searchTerm}".`
                : 'No Poutrelle items registered in the database.'}
            </p>
            {(searchTerm || selectedLength !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedLength('all')
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold active:scale-95 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item, index) => {
              const stock = Number(item.current_stock || 0)
              const min = Number(item.min_stock_level || 0)
              const isOutOfStock = stock <= 0
              const isLowStock = stock > 0 && stock <= min
              const relativeTime = formatRelativeTime(item.updated_at, t)
              const localizedName = getItemLabel(item, currentLang)
              const lengthBadge = getItemLength(item)

              const isJustUpdated = highlightedItemId === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveItem(item)
                    }
                  }}
                  style={{
                    animationDelay: `${Math.min(index * 25, 250)}ms`,
                  }}
                  className={`group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md cursor-pointer touch-manipulation select-none card-hover-smooth animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 sm:gap-4 ${
                    isJustUpdated
                      ? 'ring-2 ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/20 highlight-flash'
                      : index === 0
                      ? 'ring-1 ring-blue-500/30'
                      : ''
                  }`}
                >
                  {/* Symbolic SVG Icon */}
                  <ItemSymbol
                    item={item}
                    size="md"
                    className="group-hover:scale-105 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all"
                  />

                  {/* Center / Main Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {/* SKU Badge */}
                      {item.sku && (
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.sku}
                        </span>
                      )}

                      {/* Length Badge */}
                      {lengthBadge && (
                        <span className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900">
                          {lengthBadge}
                        </span>
                      )}

                      {/* Relative "Last Managed" */}
                      {relativeTime && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{relativeTime}</span>
                        </span>
                      )}

                      {/* Location Bin */}
                      {item.location_bin && (
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                          • {item.location_bin}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {localizedName}
                    </h2>
                  </div>

                  {/* Right: Large Bold Stock Pill */}
                  <div className="text-end shrink-0 ps-1 sm:ps-2">
                    <div
                      className={`text-2xl sm:text-3xl font-black font-mono leading-none ${
                        isOutOfStock
                          ? 'text-red-600 dark:text-red-400'
                          : isLowStock
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {stock}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-1">
                      {t(`common.units.${item.unit}`, item.unit || 'piece')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 start-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200 max-w-sm w-full px-4">
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl flex items-center gap-3 border border-slate-700 dark:border-slate-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black truncate">{toast.title}</div>
              <div className="text-[11px] opacity-80 font-medium truncate">
                {toast.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Modal */}
      {activeItem && (
        <QuickStockModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onSuccess={handleStockSuccess}
        />
      )}

      {/* Warehouse Options Sidebar Drawer */}
      <WarehouseSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  )
}
