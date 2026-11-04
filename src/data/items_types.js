/**
 * ITEMS_TYPES
 * Standard Moroccan Building Materials Warehouse Items (سلعة ديبو مواد البناء بالمغرب)
 * Only Poutrelle items active per user configuration.
 */

export const ITEMS_TYPES = [
  {
    sku: 'POUT-220',
    category_id: '88888888-8888-8888-8888-888888888888',
    category_slug: 'poutrelles',
    name: 'Poutrelle Précontrainte 2,20m (بوتريل 2.20م)',
    name_fr: 'Poutrelle Précontrainte 2,20m',
    name_ar_ma: 'بوتريل د الدالة 2.20 ميترو',
    name_ar: 'رافدة خرسانية مسبقة الإجهاد 2.20 م',
    name_en: 'Prestressed Concrete Joist 2.20m',
    unit: 'piece',
    default_stock: 50,
    min_stock_level: 10,
    location_bin: 'el hommer 2',
    description: 'Poutrelle en béton précontraint longueur 2,20m pour plancher hourdis.',
  },
  {
    sku: 'POUT-720',
    category_id: '88888888-8888-8888-8888-888888888888',
    category_slug: 'poutrelles',
    name: 'Poutrelle Précontrainte 7,20m (بوتريل 7.20م)',
    name_fr: 'Poutrelle Précontrainte 7,20m',
    name_ar_ma: 'بوتريل د الدالة 7.20 ميترو',
    name_ar: 'رافدة خرسانية مسبقة الإجهاد 7.20 م',
    name_en: 'Prestressed Concrete Joist 7.20m',
    unit: 'piece',
    default_stock: 30,
    min_stock_level: 5,
    location_bin: 'el hommer 2',
    description: 'Poutrelle en béton précontraint longueur 7,20m pour plancher hourdis.',
  },
]

export const getItemTypeBySku = (sku) =>
  ITEMS_TYPES.find((item) => item.sku.toUpperCase() === sku?.trim().toUpperCase()) || null

export const getItemsByCategory = (categoryIdOrSlug) =>
  ITEMS_TYPES.filter(
    (item) =>
      item.category_id === categoryIdOrSlug ||
      item.category_slug === categoryIdOrSlug
  )

export const getItemLabel = (item, lang = 'fr') => {
  if (!item) return ''
  switch (lang) {
    case 'ar-MA':
      return item.name_ar_ma || item.name
    case 'ar':
      return item.name_ar || item.name
    case 'en':
      return item.name_en || item.name
    case 'fr':
    default:
      return item.name_fr || item.name
  }
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
