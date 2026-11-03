# Internationalization (i18n) & RTL Guide

This project supports 4 languages with dynamic bidirectional layout switching:
1. **English (`en`)**
2. **Français (`fr`)**
3. **العربية (Standard Arabic) (`ar`)**
4. **الدارجة المغربية (Moroccan Darija) (`ar-MA`)**

---

## How Dynamic RTL Works

In [`src/lib/i18n.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/i18n.js), RTL languages are defined:
```javascript
export const RTL_LANGUAGES = ['ar', 'ar-MA']

export const applyDirection = (lng) => {
  const isRtl = RTL_LANGUAGES.includes(lng)
  const dir = isRtl ? 'rtl' : 'ltr'
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir
    document.documentElement.lang = lng
    if (document.body) {
      document.body.dir = dir
    }
  }
}
```

Whenever the user changes language via [`LangSwitcher.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/components/LangSwitcher.jsx), the `languageChanged` event fires and automatically flips the document direction to `rtl` or `ltr`.

### Tailwind CSS Bidirectional Layout Rules
- **NEVER** use physical left/right classes like `pl-4`, `pr-4`, `ml-auto`, `text-left`.
- **ALWAYS** use logical directional utilities:
  - `ps-*` (padding-inline-start) instead of `pl-*`
  - `pe-*` (padding-inline-end) instead of `pr-*`
  - `ms-*` (margin-inline-start) instead of `ml-*`
  - `me-*` (margin-inline-end) instead of `mr-*`
  - `start-*` and `end-*` instead of `left-*` and `right-*`
  - `text-start` and `text-end` instead of `text-left` and `text-right`
- For direction-sensitive icons (e.g. arrows), use `rtl:rotate-180`:
  ```jsx
  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
  ```

---

## Authentic Moroccan Darija Construction Terminology

When adding or editing keys in [`src/locales/ar-MA.json`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/locales/ar-MA.json), adhere to Moroccan construction site & warehouse vocabulary:

| English | French | Moroccan Darija | Notes |
|---|---|---|---|
| Warehouse / Depot | Dépôt | الديبو (Dépôt) | Standard term in Moroccan logistics |
| Inventory / Stock | Stock | السلعة / السطوك | Common term across yards |
| Add Stock (IN) | Entrée Stock | دخول السلعة (+ زيد) | Clear, direct action |
| Remove Stock (OUT)| Sortie Stock | خروج السلعة (- نقص) | Clear, direct action |
| Low Stock | Stock Faible | السلعة لي قربات تسالي | High urgency |
| Out of Stock | Rupture | تسالا كاع | 0 stock remaining |
| Current Stock | Stock Actuel | لي كاين دابا فالديبو | Real count |
| Cement & Aggregates| Ciment & Granulats | السيما والكياس والرملة | Sand, gravel, cement |
| Steel & Rebar | Acier & Armatures | الحديد والكرومة | Ribbed steel bars |
| Bricks & Blocks | Briques & Parpaings| الباجور والياجور والبارفان | Red hollow bricks & hollow concrete blocks |
| Wood & Formwork | Bois & Coffrage | العود والكوفراج | Construction timber |
| Plumbing & Pipes | Plomberie & Tuyaux | الرصاصة والبلومبري وجعاب | Drainage and PVC pipes |
| Paints & Sealants | Peinture & Étanchéité| الصباغة وليدوفيج ولاكول | Exterior acrylics & waterproofing |
| Worker / Lead | Opérateur / Chef | الخدام / المعلم | Respectful, understood by yard workers |
| Bags (Unit) | Sacs | خنشة | 50kg / 25kg cement bags |
| Pallet (Unit) | Palette | باليطة | Pallet load |

---

## How to Add a New Translation Key

When introducing a new string in the UI:
1. Wrap the JSX text with the `t()` function:
   ```jsx
   const { t } = useTranslation()
   <button>{t('inventory.transferStock', 'Transfer Stock')}</button>
   ```
2. Add the corresponding key to **ALL 4 JSON files**:
   - `src/locales/en.json`
   - `src/locales/fr.json`
   - `src/locales/ar.json`
   - `src/locales/ar-MA.json`
3. Always verify that no raw un-translated text remains in UI components.
