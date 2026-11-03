import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { warehouseDb } from '../lib/warehouseDb'
import { CATEGORIES_TYPES } from '../data/categories_types'
import {
  Search,
  X,
  Boxes,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  PackageOpen,
} from 'lucide-react'

export default function InventoryList() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all') // 'all', 'in_stock', 'low_stock', 'out_of_stock'

  const loadItems = async () => {
    try {
      setLoading(true)
      const { data } = await warehouseDb.fetchItems()
      if (data) setItems(data)
    } catch (err) {
      console.error('Failed to load items', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()

    const handleUpdate = () => {
      loadItems()
    }
    window.addEventListener('mattrack:item-updated', handleUpdate)
    return () => {
      window.removeEventListener('mattrack:item-updated', handleUpdate)
    }
  }, [])

  // Categories list loaded from standard CATEGORIES_TYPES
  const categories = useMemo(
    () => [
      { id: 'all', slug: 'all', labelKey: 'categories.all', name: t('categories.all') },
      ...CATEGORIES_TYPES.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        labelKey: `categories.${cat.slug}`,
        name: t(`categories.${cat.slug}`, cat.name_fr),
      })),
    ],
    [t]
  )

  // Filter items based on search term, category, and status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Search term match (by name or SKU)
      const q = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q))

      // 2. Category match (supports ID, slug, or name match)
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category_id === selectedCategory ||
        item.category_slug === selectedCategory ||
        (item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase()))

      // 3. Status match
      const stock = Number(item.current_stock)
      const min = Number(item.min_stock_level)
      let matchesStatus = true

      if (selectedStatus === 'out_of_stock') {
        matchesStatus = stock <= 0
      } else if (selectedStatus === 'low_stock') {
        matchesStatus = stock > 0 && stock <= min
      } else if (selectedStatus === 'in_stock') {
        matchesStatus = stock > min
      }

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [items, searchTerm, selectedCategory, selectedStatus])

  return (
    <div className="space-y-5">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('inventory.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('inventory.subtitle')}
          </p>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 self-start sm:self-auto">
          {t('inventory.itemsFound', { count: filteredItems.length })}
        </div>
      </div>

      {/* Search Input Bar (Touch-friendly & fast) */}
      <div className="relative">
        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('inventory.searchPlaceholder')}
          className="w-full ps-12 pe-12 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base font-semibold transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 end-0 pe-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Tabs: Horizontal Scroll for Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-10 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer touch-manipulation select-none active:scale-95 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Status Chips Filter */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
          {t('inventory.filterStatus')}:
        </span>
        {[
          { id: 'all', label: t('inventory.allStatus') },
          { id: 'in_stock', label: t('inventory.inStock'), color: 'emerald' },
          { id: 'low_stock', label: t('inventory.lowStock'), color: 'amber' },
          { id: 'out_of_stock', label: t('inventory.outOfStock'), color: 'red' },
        ].map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setSelectedStatus(st.id)}
            className={`min-h-8 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedStatus === st.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Items List View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">{t('common.loading')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-800 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
            <PackageOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
            {t('inventory.noDataInStockTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            {t('inventory.noDataInStockDesc')}
          </p>
          <button
            type="button"
            onClick={loadItems}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('common.refresh', 'Refresh Inventory')}</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
          <Boxes className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            {t('inventory.noItems')}
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-xs">
            Try adjusting your search query or reset the category filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
              setSelectedStatus('all')
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold active:scale-95 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const stock = Number(item.current_stock)
            const min = Number(item.min_stock_level)
            const isOutOfStock = stock <= 0
            const isLowStock = stock > 0 && stock <= min

            return (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className="group block p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer touch-manipulation select-none"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {item.sku}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {item.category_slug ? t(`categories.${item.category_slug}`, item.category) : item.category}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors m-0">
                      {item.name}
                    </h2>
                  </div>

                  {/* Stock Quantity Badge */}
                  <div className="text-end shrink-0">
                    <div
                      className={`text-2xl sm:text-3xl font-black ${
                        isOutOfStock
                          ? 'text-red-600 dark:text-red-400'
                          : isLowStock
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.current_stock}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t(`common.units.${item.unit}`, item.unit)}
                    </span>
                  </div>
                </div>

                {/* Location & Stock Status Bar */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium truncate max-w-[60%]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.location || 'Warehouse Yard'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                        {t('inventory.outOfStock')}
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t('inventory.lowStock')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('inventory.inStock')}
                      </span>
                    )}

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
