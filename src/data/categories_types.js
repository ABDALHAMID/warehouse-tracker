/**
 * CATEGORIES_TYPES
 * Standard Moroccan Building Materials Warehouse Categories (ديبو مواد البناء بالمغرب)
 * Database canonical names are strictly in English.
 * Frontend maps canonical English names to French (fr), Standard Arabic (ar), and Moroccan Darija (ar-MA).
 */

export const CATEGORIES_TYPES = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'concrete-beams',
    aliases: ['poutrelle', 'beams', 'concrete_beams'],
    name: 'Concrete Beams', // Canonical English name stored in DB
    name_en: 'Concrete Beams',
    name_fr: 'Poutrelles',
    name_ar: 'الروافد الخرسانية (بوتريل)',
    name_ar_ma: 'البوتريل',
    icon: 'BeamIcon',
    color: 'blue',
    description: 'Prestressed concrete floor beams & joists for construction slabs.',
  },
]

export const getCategoryById = (id) =>
  CATEGORIES_TYPES.find((cat) => cat.id === id) || null

export const getCategoryBySlug = (slug) => {
  if (!slug) return null
  const normalized = String(slug).toLowerCase().trim()
  return (
    CATEGORIES_TYPES.find(
      (cat) =>
        cat.slug === normalized ||
        (Array.isArray(cat.aliases) && cat.aliases.includes(normalized))
    ) || null
  )
}

/**
 * Returns localized category label based on active language code.
 * @param {Object|string} cat - Category object, ID, or slug
 * @param {string} lang - Language code ('en', 'fr', 'ar', 'ar-MA')
 */
export const getCategoryLabel = (cat, lang = 'en') => {
  if (!cat) return ''

  // Support passing slug or id directly
  const target =
    typeof cat === 'string'
      ? getCategoryBySlug(cat) || getCategoryById(cat)
      : cat

  if (!target) return typeof cat === 'string' ? cat : ''

  switch (lang) {
    case 'ar-MA':
      return target.name_ar_ma || target.name_ar || target.name
    case 'ar':
      return target.name_ar || target.name
    case 'fr':
      return target.name_fr || target.name
    case 'en':
    default:
      return target.name_en || target.name
  }
}
