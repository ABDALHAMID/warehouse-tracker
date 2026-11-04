import { supabase, isSupabaseConfigured } from './supabaseClient'
import { getCategoryById } from '../data/categories_types'

// Purge any legacy fake test data stored in previous versions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('mattrack_warehouse_items_v1')
    localStorage.removeItem('mattrack_warehouse_logs_v1')
  } catch {
    // ignore
  }
}

// Normalize item schema (handles category_id / categories relation and location_bin)
const normalizeItem = (item) => {
  if (!item) return null
  const matchedCat = item.category_id ? getCategoryById(item.category_id) : null
  return {
    ...item,
    category_id: item.category_id || matchedCat?.id || null,
    category_slug: matchedCat?.slug || item.category_slug || 'other',
    category:
      matchedCat?.name ||
      item.categories?.name ||
      item.category ||
      'Autre',
    location: item.location_bin || item.location || '',
  }
}

export const warehouseDb = {
  // Fetch all items from items table
  async fetchItems() {
    if (!isSupabaseConfigured) {
      return { data: [], error: null }
    }

    try {
      // Join with categories table if available
      const { data, error } = await supabase
        .from('items')
        .select('*, categories(name)')
        .order('name', { ascending: true })

      if (error) {
        // Fallback to simple select if join with categories fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('items')
          .select('*')
          .order('name', { ascending: true })

        if (simpleError) {
          console.error('Supabase items fetch failed:', simpleError.message)
          return { data: [], error: simpleError }
        }
        return { data: (simpleData || []).map(normalizeItem), error: null }
      }

      return { data: (data || []).map(normalizeItem), error: null }
    } catch (err) {
      console.error('Supabase fetch exception:', err)
      return { data: [], error: err }
    }
  },

  // Fetch single item by ID
  async fetchItemById(id) {
    if (!id || !isSupabaseConfigured) {
      return { data: null, error: new Error('Item not found') }
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, categories(name)')
        .eq('id', id)
        .single()

      if (error) {
        // Try simple select if join fails
        const { data: simpleData, error: simpleError } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single()

        if (simpleError) {
          return { data: null, error: simpleError }
        }
        return { data: normalizeItem(simpleData), error: null }
      }

      return { data: normalizeItem(data), error: null }
    } catch (err) {
      console.error('Supabase fetchItemById exception:', err)
      return { data: null, error: err }
    }
  },

  // Lookup item by SKU barcode
  async fetchItemBySku(sku) {
    if (!sku || !isSupabaseConfigured) {
      return { data: null, error: new Error('SKU required') }
    }
    const cleanSku = sku.trim()

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, categories(name)')
        .ilike('sku', cleanSku)
        .single()

      if (error) {
        const { data: simpleData, error: simpleError } = await supabase
          .from('items')
          .select('*')
          .ilike('sku', cleanSku)
          .single()

        if (simpleError) {
          return { data: null, error: simpleError }
        }
        return { data: normalizeItem(simpleData), error: null }
      }

      return { data: normalizeItem(data), error: null }
    } catch (err) {
      console.error('Supabase fetchItemBySku error:', err)
      return { data: null, error: err }
    }
  },

  // Insert a new log row into inventory_logs (database trigger updates items.current_stock)
  async insertInventoryLog({ itemId, workerId, changeType, quantity, notes }) {
    const qtyNum = Number(quantity)
    if (!qtyNum || qtyNum <= 0) {
      return { data: null, error: new Error('Invalid quantity') }
    }

    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Database not configured') }
    }

    const payload = {
      item_id: itemId,
      worker_id: workerId,
      change_type: changeType, // 'IN' or 'OUT'
      quantity: qtyNum,
      notes: notes || '',
    }

    try {
      const { data, error } = await supabase
        .from('inventory_logs')
        .insert([payload])
        .select()
        .single()

      if (error) {
        console.error('Supabase insert log failed:', error.message)
        return { data: null, error }
      }

      // Re-fetch updated item to ensure sync
      const { data: updatedItem } = await this.fetchItemById(itemId)

      return {
        data,
        updatedItem,
        error: null,
      }
    } catch (err) {
      console.error('Supabase insert log exception:', err)
      return { data: null, error: err }
    }
  },

  // Fetch recent logs for a specific item (joined with worker_profiles for attribution)
  async fetchItemLogs(itemId) {
    if (!itemId || !isSupabaseConfigured) {
      return { data: [], error: null }
    }

    try {
      const { data, error } = await supabase
        .from('inventory_logs')
        .select('*, worker:worker_profiles(full_name, worker_code, role)')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.warn('Worker join on item logs failed, falling back:', error.message)
        const { data: simpleData, error: simpleError } = await supabase
          .from('inventory_logs')
          .select('*')
          .eq('item_id', itemId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (simpleError) {
          console.error('Supabase item logs fetch error:', simpleError.message)
          return { data: [], error: simpleError }
        }
        return { data: simpleData || [], error: null }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Supabase item logs fetch error:', err)
      return { data: [], error: err }
    }
  },

  // Fetch recent logs for warehouse dashboard (with items and worker attribution)
  async fetchRecentLogs(limit = 10) {
    if (!isSupabaseConfigured) {
      return { data: [], error: null }
    }

    try {
      // 1. Primary: Join with items and worker_profiles
      const { data, error } = await supabase
        .from('inventory_logs')
        .select(
          '*, items(id, name, sku, unit, current_stock, min_stock_level, location_bin, category_id), worker:worker_profiles(full_name, worker_code, role)'
        )
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        return {
          data: data.map((log) => ({
            ...log,
            items: log.items ? normalizeItem(log.items) : null,
          })),
          error: null,
        }
      }

      console.warn('Worker join on recent logs failed, attempting items-only join:', error?.message)

      // 2. Secondary fallback: join with items only
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_logs')
        .select(
          '*, items(id, name, sku, unit, current_stock, min_stock_level, location_bin, category_id)'
        )
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!itemError && itemData) {
        return {
          data: itemData.map((log) => ({
            ...log,
            items: log.items ? normalizeItem(log.items) : null,
          })),
          error: null,
        }
      }

      console.warn('Items join on recent logs failed, falling back to simple select:', itemError?.message)

      // 3. Robust tertiary fallback: select * without any joins
      const { data: simpleData, error: simpleError } = await supabase
        .from('inventory_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (simpleError) {
        console.error('Supabase recent logs fetch error:', simpleError.message)
        return { data: [], error: simpleError }
      }

      return { data: simpleData || [], error: null }
    } catch (err) {
      console.error('Supabase recent logs fetch error:', err)
      return { data: [], error: err }
    }
  },

  // Fetch recent logs by a specific worker (up to limit)
  async fetchRecentLogsForWorker(workerId, limit = 10) {
    if (!isSupabaseConfigured || !workerId) {
      return { data: [], error: null }
    }

    try {
      // 1. Primary: full join
      const { data, error } = await supabase
        .from('inventory_logs')
        .select(
          '*, items(id, name, sku, unit, current_stock, min_stock_level, location_bin, category_id), worker:worker_profiles(full_name, worker_code, role)'
        )
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        return {
          data: data.map((log) => ({
            ...log,
            items: log.items ? normalizeItem(log.items) : null,
          })),
          error: null,
        }
      }

      // 2. Secondary: items only
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_logs')
        .select(
          '*, items(id, name, sku, unit, current_stock, min_stock_level, location_bin, category_id)'
        )
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!itemError && itemData) {
        return {
          data: itemData.map((log) => ({
            ...log,
            items: log.items ? normalizeItem(log.items) : null,
          })),
          error: null,
        }
      }

      // 3. Robust tertiary fallback: simple select
      const { data: simpleData, error: simpleError } = await supabase
        .from('inventory_logs')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (simpleError) {
        console.error('Supabase fetchRecentLogsForWorker error:', simpleError.message)
        return { data: [], error: simpleError }
      }

      return { data: simpleData || [], error: null }
    } catch (err) {
      console.error('Supabase fetchRecentLogsForWorker error:', err)
      return { data: [], error: err }
    }
  },

  // Backward-compatible single log fetch
  async fetchLastLogForWorker(workerId) {
    const res = await this.fetchRecentLogsForWorker(workerId, 1)
    return { data: res.data?.[0] || null, error: res.error }
  },

  // Realtime subscription setup
  subscribeToItemChanges(itemId, onUpdate) {
    if (!isSupabaseConfigured || !itemId) {
      return () => {}
    }

    let channel = null
    try {
      channel = supabase
        .channel(`item-changes-${itemId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'items',
            filter: `id=eq.${itemId}`,
          },
          (payload) => {
            if (payload.new) {
              onUpdate(normalizeItem(payload.new))
            }
          }
        )
        .subscribe()
    } catch (e) {
      console.warn('Failed to subscribe to Supabase channel', e)
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  },
}
