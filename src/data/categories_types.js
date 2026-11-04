/**
 * CATEGORIES_TYPES
 * Standard Moroccan Building Materials Warehouse Categories (ديبو مواد البناء بالمغرب)
 * Only Poutrelle category active per user configuration.
 */

export const CATEGORIES_TYPES = [
  {
    id: '88888888-8888-8888-8888-888888888888',
    slug: 'poutrelles',
    name: 'Poutrelles Précontraintes (البوتريل د الدالة)',
    name_fr: 'Poutrelles Précontraintes',
    name_ar_ma: 'البوتريل د الدالة',
    name_ar: 'روافد خرسانية مسبقة الإجهاد (بوتريل)',
    name_en: 'Prestressed Concrete Joists (Poutrelles)',
    icon: 'Boxes',
    color: 'blue',
    description: 'Poutrelles précontraintes en béton armé pour planchers hourdis.',
  },
]

export const getCategoryById = (id) =>
  CATEGORIES_TYPES.find((cat) => cat.id === id) || null

export const getCategoryBySlug = (slug) =>
  CATEGORIES_TYPES.find((cat) => cat.slug === slug) || null

export const getCategoryLabel = (cat, lang = 'fr') => {
  if (!cat) return ''
  switch (lang) {
    case 'ar-MA':
      return cat.name_ar_ma || cat.name
    case 'ar':
      return cat.name_ar || cat.name
    case 'en':
      return cat.name_en || cat.name
    case 'fr':
    default:
      return cat.name_fr || cat.name
  }
}
