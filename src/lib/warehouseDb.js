import { supabase, isSupabaseConfigured, INITIAL_ITEMS, INITIAL_LOGS } from './supabaseClient'

const LOCAL_STORAGE_ITEMS_KEY = 'mattrack_warehouse_items_v1'
const LOCAL_STORAGE_LOGS_KEY = 'mattrack_warehouse_logs_v1'

// Initialize local fallback storage if empty
const getLocalItems = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read local items', e)
  }
  localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(INITIAL_ITEMS))
  return INITIAL_ITEMS
}

const getLocalLogs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read local logs', e)
  }
  localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(INITIAL_LOGS))
  return INITIAL_LOGS
}

export const warehouseDb = {
  // Fetch all items from items table
  async fetchItems() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          return { data, error: null }
        }
        if (error) {
          console.warn('Supabase items fetch failed, using local fallback:', error.message)
        }
      } catch (err) {
        console.warn('Supabase fetch exception, using local fallback:', err)
      }
    }
    return { data: getLocalItems(), error: null, isFallback: true }
  },

  // Fetch single item by ID
  async fetchItemById(id) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          return { data, error: null }
        }
      } catch (err) {
        console.warn('Supabase fetchItemById exception:', err)
      }
    }

    const items = getLocalItems()
    const found = items.find((item) => String(item.id) === String(id))
    return { data: found || null, error: found ? null : new Error('Item not found'), isFallback: true }
  },

  // Lookup item by SKU barcode
  async fetchItemBySku(sku) {
    if (!sku) return { data: null, error: new Error('SKU required') }
    const cleanSku = sku.trim()

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .ilike('sku', cleanSku)
          .single()

        if (!error && data) {
          return { data, error: null }
        }
      } catch (err) {
        console.warn('Supabase fetchItemBySku error, checking local:', err)
      }
    }

    const items = getLocalItems()
    const found = items.find(
      (item) => item.sku.toLowerCase() === cleanSku.toLowerCase()
    )
    return { data: found || null, error: found ? null : new Error('Item not found'), isFallback: true }
  },

  // Insert a new log row into inventory_logs (trigger updates items.current_stock)
  async insertInventoryLog({ itemId, workerId, workerName, changeType, quantity, notes }) {
    const qtyNum = Number(quantity)
    if (!qtyNum || qtyNum <= 0) {
      return { data: null, error: new Error('Invalid quantity') }
    }

    const payload = {
      item_id: itemId,
      worker_id: workerId || 'w-worker',
      worker_name: workerName || 'Warehouse Worker',
      change_type: changeType, // 'IN' or 'OUT'
      quantity: qtyNum,
      notes: notes || '',
    }

    let supabaseSuccess = false
    let insertedRow = null

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('inventory_logs')
          .insert([payload])
          .select()
          .single()

        if (!error) {
          supabaseSuccess = true
          insertedRow = data
        } else {
          console.warn('Supabase insert log failed, applying locally:', error.message)
        }
      } catch (err) {
        console.warn('Supabase insert log exception:', err)
      }
    }

    // Always keep local state in sync or apply fallback (simulating database trigger)
    const items = getLocalItems()
    const itemIndex = items.findIndex((i) => String(i.id) === String(itemId))
    let updatedItem = null

    if (itemIndex !== -1) {
      const delta = changeType === 'IN' ? qtyNum : -qtyNum
      items[itemIndex].current_stock = Math.max(0, Number(items[itemIndex].current_stock) + delta)
      items[itemIndex].updated_at = new Date().toISOString()
      updatedItem = items[itemIndex]
      localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items))
    }

    const localLog = insertedRow || {
      id: 'log-' + Date.now(),
      ...payload,
      created_at: new Date().toISOString(),
    }

    const logs = getLocalLogs()
    logs.unshift(localLog)
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs))

    // Broadcast local realtime event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('mattrack:item-updated', {
          detail: { itemId, updatedItem, log: localLog },
        })
      )
    }

    return {
      data: localLog,
      updatedItem,
      error: null,
      isFallback: !supabaseSuccess,
    }
  },

  // Fetch recent logs for a specific item
  async fetchItemLogs(itemId) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('inventory_logs')
          .select('*')
          .eq('item_id', itemId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!error && data) {
          return { data, error: null }
        }
      } catch (err) {
        console.warn('Supabase item logs fetch error:', err)
      }
    }

    const logs = getLocalLogs()
    const filtered = logs.filter((l) => String(l.item_id) === String(itemId))
    return { data: filtered, error: null, isFallback: true }
  },

  // Fetch recent logs for warehouse dashboard
  async fetchRecentLogs(limit = 10) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('inventory_logs')
          .select('*, items(name, sku, unit)')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!error && data) {
          return { data, error: null }
        }
      } catch (err) {
        console.warn('Supabase recent logs fetch error:', err)
      }
    }

    const logs = getLocalLogs().slice(0, limit)
    const items = getLocalItems()
    const enriched = logs.map((log) => {
      const item = items.find((i) => String(i.id) === String(log.item_id))
      return {
        ...log,
        items: item ? { name: item.name, sku: item.sku, unit: item.unit } : null,
      }
    })
    return { data: enriched, error: null, isFallback: true }
  },

  // Realtime subscription setup
  subscribeToItemChanges(itemId, onUpdate) {
    let channel = null

    if (isSupabaseConfigured) {
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
                onUpdate(payload.new)
              }
            }
          )
          .subscribe()
      } catch (e) {
        console.warn('Failed to subscribe to Supabase channel', e)
      }
    }

    // Also listen to local window events for immediate reactivity
    const handleLocalUpdate = (e) => {
      if (String(e.detail?.itemId) === String(itemId) && e.detail?.updatedItem) {
        onUpdate(e.detail.updatedItem)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('mattrack:item-updated', handleLocalUpdate)
    }

    return () => {
      if (channel && isSupabaseConfigured) {
        supabase.removeChannel(channel)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('mattrack:item-updated', handleLocalUpdate)
      }
    }
  },
}
