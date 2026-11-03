/**
 * CATEGORIES_TYPES
 * Standard Moroccan Building Materials Warehouse Categories (ديبو مواد البناء بالمغرب)
 * Provides standardized IDs, slugs, names in 4 languages, and metadata.
 */

export const CATEGORIES_TYPES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'cement_aggregates',
    name: 'Ciment, Sable & Granulats (السيما والكياس والرملة)',
    name_fr: 'Ciment, Sable & Granulats',
    name_ar_ma: 'السيما والكياس والرملة',
    name_ar: 'الإسمنت والرمل والركام',
    name_en: 'Cement, Sand & Aggregates',
    icon: 'Layers',
    color: 'slate',
    description: "Liants hydrauliques (CPJ 45/35), sables d'oued, gravette et plâtres de construction.",
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'steel_rebar',
    name: 'Fer à Béton & Armatures (الحديد والكرومة)',
    name_fr: 'Fer à Béton & Armatures',
    name_ar_ma: 'الحديد والكرومة د البني',
    name_ar: 'حديد التسليح وشبكات الحديد',
    name_en: 'Steel Rebar & Mesh',
    icon: 'Shield',
    color: 'blue',
    description: 'Ronds à béton haute adhérence FeE500 (Ø8 à Ø16mm), treillis soudé pour dalles et fil de ligature.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'bricks_blocks',
    name: 'Briques, Hourdis & Parpaings (الباجور والياجور والبارفان)',
    name_fr: 'Briques, Hourdis & Parpaings',
    name_ar_ma: 'الباجور والياجور والبارفان',
    name_ar: 'الطوب والآجر والبلوك الخرساني',
    name_en: 'Bricks, Floor Blocks & Parpaings',
    icon: 'Boxes',
    color: 'amber',
    description: 'Briques rouges en terre cuite (6/8/12 trous), parpaings vibrés creux et hourdis de plancher.',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'timber_formwork',
    name: 'Bois de Coffrage & Charpente (العود والكوفراج)',
    name_fr: 'Bois de Coffrage & Charpente',
    name_ar_ma: 'العود والكوفراج والمادري',
    name_ar: 'أخشاب القوالب والنجارة الإنشائية',
    name_en: 'Timber & Formwork Boards',
    icon: 'TreePine',
    color: 'amber',
    description: 'Planches de coffrage pin 4m, madriers, chevrons et panneaux contreplaqué filmé bakélisé 18mm.',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    slug: 'plumbing_drainage',
    name: 'Plomberie & Assainissement (الرصاصة والبلومبري وجعاب)',
    name_fr: 'Plomberie & Assainissement',
    name_ar_ma: 'الرصاصة والبلومبري وجعاب',
    name_ar: 'الأنابيب والسباكة والصرف الصحي',
    name_en: 'Plumbing & Drainage',
    icon: 'Wrench',
    color: 'cyan',
    description: 'Tubes PVC assainissement et évacuation (Ø110/50), PEHD eau potable PN16 et multicouche.',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    slug: 'paints_waterproofing',
    name: 'Peinture, Droguerie & Étanchéité (الصباغة والكتامة وليدوفيج)',
    name_fr: 'Peinture, Droguerie & Étanchéité',
    name_ar_ma: 'الصباغة والكتامة وليدوفيج',
    name_ar: 'الدهانات ومواد العزل المائي',
    name_en: 'Paints, Sealants & Waterproofing',
    icon: 'Paintbrush',
    color: 'indigo',
    description: 'Peintures vinyles blanches, peintures façade hydrofuges, rouleaux bitumineux et fixateurs.',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    slug: 'tiles_finishes',
    name: 'Carrelage & Revêtements (الزليج والكولا وفينيسيون)',
    name_fr: 'Carrelage & Revêtements',
    name_ar_ma: 'الزليج والكولا وفينيسيون',
    name_ar: 'البلاط ومواد اللصق والتشطيب',
    name_en: 'Tiles & Adhesives',
    icon: 'LayoutGrid',
    color: 'emerald',
    description: 'Colle à carrelage haute adhérence C2, joints hydrofuges et carreaux grès cérame 60x60.',
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
