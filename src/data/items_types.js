/**
 * ITEMS_TYPES
 * Single Base Template & Dynamic Length-Based Factory for Concrete Beams / Poutrelles (سلعة ديبو مواد البناء بالمغرب)
 *
 * Instead of hardcoding 20+ identical items, we define ONE base beam archetype.
 * Length is the distinguishing attribute. Functions dynamically extract all lengths
 * from the database, generate the necessary localized objects, and provide length-based
 * filtering and sorting.
 */

import { warehouseDb } from '../lib/warehouseDb'

// 1. Single Base Archetype Template for Poutrelle / Concrete Beam
export const BASE_BEAM_TEMPLATE = {
  category_id: '33333333-3333-3333-3333-333333333333',
  category_slug: 'concrete-beams',
  unit: 'piece',
  default_stock: 50,
  min_stock_level: 10,
  location_bin: 'el hommer 2',
  icon: 'BeamIcon',
}

// Standard Moroccan construction beam lengths (in meters)
export const DEFAULT_BEAM_LENGTHS = [
  2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8,
  4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.2, 5.4, 5.6, 5.8,
  6.0, 7.2,
]

/**
 * Parses length as a float from an item object, string, or number.
 * Supports:
 * - Direct numbers (e.g., 3.4)
 * - Strings (e.g., '3.40m', '3,40 m')
 * - SKUs (e.g., 'PTR-340' -> 3.4, 'PTR-200' -> 2.0)
 * - Object with `length_num`, `length`, `name`, or `sku`
 * @param {Object|string|number} input
 * @returns {number|null} Length in meters (e.g. 3.4) or null
 */
export const parseLength = (input) => {
  if (input == null) return null

  // If input is an object
  if (typeof input === 'object') {
    if (input.length_num != null && !isNaN(Number(input.length_num))) {
      return Number(Number(input.length_num).toFixed(2))
    }
    if (input.length) {
      const match = String(input.length).match(/(\d+(?:[.,]\d+)?)/)
      if (match) return Number(parseFloat(match[1].replace(',', '.')).toFixed(2))
    }
    if (input.name) {
      const match = String(input.name).match(/(\d+(?:[.,]\d+)?)\s*m?/i)
      if (match) return Number(parseFloat(match[1].replace(',', '.')).toFixed(2))
    }
    if (input.sku) {
      const match = String(input.sku).match(/PTR-(\d+)/i)
      if (match) return Number((parseInt(match[1], 10) / 100).toFixed(2))
    }
    return null
  }

  // If input is a number
  if (typeof input === 'number') {
    return isNaN(input) ? null : Number(input.toFixed(2))
  }

  // If input is a string
  const str = String(input).trim()

  // Match PTR-xxx SKU format
  const ptrMatch = str.match(/PTR-(\d+)/i)
  if (ptrMatch) {
    return Number((parseInt(ptrMatch[1], 10) / 100).toFixed(2))
  }

  // Match standard metric float format
  const numMatch = str.match(/(\d+(?:[.,]\d+)?)/)
  if (numMatch) {
    return Number(parseFloat(numMatch[1].replace(',', '.')).toFixed(2))
  }

  return null
}

/**
 * Creates a fully localized Beam item object from a given length.
 * Automatically generates SKU, length badges, and multi-language names.
 * @param {number|string|Object} lengthInput - Length value or item to extract from
 * @param {Object} overrides - Any custom overrides (e.g. from DB)
 */
export const createBeamItem = (lengthInput, overrides = {}) => {
  const num = parseLength(lengthInput) || 2.0
  const formatted = num.toFixed(2)
  const skuCode = Math.round(num * 100)
  const sku = overrides.sku || `PTR-${skuCode}`

  return {
    ...BASE_BEAM_TEMPLATE,
    ...overrides,
    sku,
    name: `Concrete Beam ${formatted}m`, // DB canonical English name
    name_en: `Concrete Beam ${formatted}m`,
    name_fr: `Poutrelle ${formatted}m`,
    name_ar: `رافدة خرسانية ${formatted} م`,
    name_ar_ma: `بوتريل ${formatted} ميترو`,
    length: `${formatted}m`,
    length_num: num,
    description: `Prestressed concrete floor joist ${formatted}m for construction slabs.`,
  }
}

/**
 * Generates an array of beam items from an array of lengths.
 * @param {Array<number|string>} lengths
 */
export const createBeamItemsFromLengths = (lengths = DEFAULT_BEAM_LENGTHS) => {
  return lengths.map((len) => createBeamItem(len))
}

/**
 * Extracts all unique lengths from a list of database items, sorted ascending.
 * @param {Array<Object>} items - Database items array
 * @returns {Array<number>} e.g. [2.0, 2.2, 2.4, 3.0, ...]
 */
export const getLengthsFromItems = (items = []) => {
  const lengths = new Set()
  for (const item of items) {
    const l = parseLength(item)
    if (l != null && l > 0) {
      lengths.add(Number(l.toFixed(2)))
    }
  }
  return Array.from(lengths).sort((a, b) => a - b)
}

/**
 * Fetches all items from DB, extracts all available lengths, and returns them sorted.
 */
export const fetchLengthsFromDb = async () => {
  try {
    const { data } = await warehouseDb.fetchItems()
    return getLengthsFromItems(data || [])
  } catch (err) {
    console.error('Failed to fetch beam lengths from DB:', err)
    return DEFAULT_BEAM_LENGTHS
  }
}

/**
 * Enriches an array of items from the database with calculated length metadata,
 * icons, and translations based on their length.
 * @param {Array<Object>} dbItems
 */
export const createBeamItemsFromDb = (dbItems = []) => {
  return dbItems.map((dbItem) => {
    const len = parseLength(dbItem)
    if (!len) return dbItem
    const generated = createBeamItem(len)
    return {
      ...generated,
      ...dbItem, // retains id, current_stock, updated_at, location_bin, etc.
      length: generated.length,
      length_num: generated.length_num,
      name_en: generated.name_en,
      name_fr: generated.name_fr,
      name_ar: generated.name_ar,
      name_ar_ma: generated.name_ar_ma,
      icon: generated.icon,
    }
  })
}

// -----------------------------------------------------------------------------
// FILTERING & SORTING FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Sorts items by beam length.
 * @param {Array} items - Items array
 * @param {boolean} ascending - true: shortest to longest (2.00m -> 7.20m), false: longest first
 */
export const sortItemsByLength = (items = [], ascending = true) => {
  return [...items].sort((a, b) => {
    const lenA = parseLength(a) || 0
    const lenB = parseLength(b) || 0
    return ascending ? lenA - lenB : lenB - lenA
  })
}

/**
 * Filters items matching an exact length (e.g. 3.4, '3.40m', '3.4').
 * @param {Array} items
 * @param {number|string} targetLength - Length to match or 'all'
 */
export const filterItemsByLength = (items = [], targetLength) => {
  if (targetLength == null || targetLength === 'all') return items
  const target = parseLength(targetLength)
  if (target == null) return items
  return items.filter((item) => {
    const len = parseLength(item)
    return len != null && Math.abs(len - target) < 0.01
  })
}

/**
 * Filters items within a length range [minLength, maxLength].
 */
export const filterItemsByLengthRange = (
  items = [],
  minLength = 0,
  maxLength = Infinity
) => {
  return items.filter((item) => {
    const len = parseLength(item)
    if (len == null) return false
    return len >= minLength && len <= maxLength
  })
}

// -----------------------------------------------------------------------------
// LOOKUPS & TRANSLATIONS
// -----------------------------------------------------------------------------

// Pre-generated standard catalog for backward-compatibility
export const ITEMS_TYPES = createBeamItemsFromLengths(DEFAULT_BEAM_LENGTHS)

export const getItemTypeBySku = (sku) => {
  if (!sku) return null
  const len = parseLength(sku)
  if (len) return createBeamItem(len, { sku: String(sku).toUpperCase().trim() })
  return null
}

export const getItemTypeByName = (name) => {
  if (!name) return null
  const len = parseLength(name)
  if (len) return createBeamItem(len)
  return null
}

export const getItemsByCategory = (categoryIdOrSlug) => {
  if (
    categoryIdOrSlug === 'concrete-beams' ||
    categoryIdOrSlug === 'poutrelle' ||
    categoryIdOrSlug === '33333333-3333-3333-3333-333333333333'
  ) {
    return ITEMS_TYPES
  }
  return []
}

/**
 * Returns the localized item name based on the active language.
 * Dynamically resolves through the length template.
 * @param {Object} item - Database item object or typed item definition
 * @param {string} lang - Active language code ('en', 'fr', 'ar', 'ar-MA')
 */
export const getItemLabel = (item, lang = 'en') => {
  if (!item) return ''

  // If item already has localized keys
  const len = parseLength(item)
  const mapped = len ? createBeamItem(len, item) : item

  switch (lang) {
    case 'ar-MA':
      return mapped.name_ar_ma || mapped.name_ar || mapped.name
    case 'ar':
      return mapped.name_ar || mapped.name
    case 'fr':
      return mapped.name_fr || mapped.name
    case 'en':
    default:
      return mapped.name_en || mapped.name
  }
}

/**
 * Returns item length specification (e.g. '3.40m')
 */
export const getItemLength = (item) => {
  if (!item) return ''
  const len = parseLength(item)
  return len ? `${len.toFixed(2)}m` : item.length || ''
}

export const AVAILABLE_UNITS = [
  'piece',
  'sac',
  'barre',
  'm3',
  'm2',
  'rouleau',
  'seau',
  'bidon',
  'panneau',
]
