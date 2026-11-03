---
name: moroccan-building-materials
description: >-
  Standardized reference catalog, terminology, packaging units, and warehouse layout conventions
  for Moroccan local building materials warehouses (Dépôt de matériaux de construction / ديبو مواد البناء بالمغرب).
  Use this skill whenever querying, updating, seeding, or extending categories and items in this repository.
---

# Moroccan Building Materials Catalog & Warehouse Standards
# (دليل سلعة ديبو مواد البناء بالمغرب)

This skill provides an authoritative guide and reference for local Moroccan building materials warehouses ("Dépôt de matériaux de construction" or in Moroccan Darija "ديبو مواد البناء").

Use this skill whenever:
- Adding or modifying items in the warehouse inventory.
- Updating database seeds ([`supabase/migrations/20261103012727_seed_categories_and_items.sql`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/supabase/migrations/20261103012727_seed_categories_and_items.sql)).
- Accessing or expanding frontend constants in [`src/data/categories_types.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/data/categories_types.js) and [`src/data/items_types.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/data/items_types.js).
- Providing translations in French, Moroccan Darija (`ar-MA`), Modern Standard Arabic (`ar`), or English (`en`).
- Handling Moroccan physical packaging units (`sac`, `barre`, `m3`, `m2`, `rouleau`, `seau`, `bidon`, `panneau`).

---

## 1. Fast Reference Architecture

```
src/data/
├── categories_types.js   # 7 standardized Moroccan categories with deterministic UUIDs & metadata
├── items_types.js        # 35 authentic items with SKUs, units, stock baselines & location bins
└── index.js              # Barrel export and lookup helpers (getCategoryById, getItemTypeBySku, etc.)
```

### Deterministic Category UUID Mapping

| Slug | French Name | Moroccan Darija | Fixed UUID |
|---|---|---|---|
| `cement_aggregates` | Ciment, Sable & Granulats | السيما والكياس والرملة | `11111111-1111-1111-1111-111111111111` |
| `steel_rebar` | Fer à Béton & Armatures | الحديد والكرومة د البني | `22222222-2222-2222-2222-222222222222` |
| `bricks_blocks` | Briques, Hourdis & Parpaings | الباجور والياجور والبارفان | `33333333-3333-3333-3333-333333333333` |
| `timber_formwork` | Bois de Coffrage & Charpente | العود والكوفراج والمادري | `44444444-4444-4444-4444-444444444444` |
| `plumbing_drainage` | Plomberie & Assainissement | الرصاصة والبلومبري وجعاب | `55555555-5555-5555-5555-555555555555` |
| `paints_waterproofing` | Peinture, Droguerie & Étanchéité | الصباغة والكتامة وليدوفيج | `66666666-6666-6666-6666-666666666666` |
| `tiles_finishes` | Carrelage & Revêtements | الزليج والكولا وفينيسيون | `77777777-7777-7777-7777-777777777777` |

---

## 2. Standard Packaging Units (وحدات القياس والتعبئة)

In Moroccan building yards, items are accounted for in specific standard commercial packaging:

| Unit Code | French Label | Darija Term | Arabic Term | English | Applied Materials |
|---|---|---|---|---|---|
| `sac` | Sac | خنشة (Khencha) | كيس | Bag | Cement CPJ 45/35 (50kg), Tile adhesive (25kg), Plâtre (40kg) |
| `barre` | Barre 12m / 4m | بارة (Barra) | قضيب | Bar | Fer à béton FeE500 (12m), Tubes PVC (4m), Tubes PPR (4m) |
| `piece` | Pièce | بياسة (Piyassa) | قطعة | Piece | Briques (6/8/12 trous), Parpaings (15/20cm), Hourdis, Étais |
| `m3` | Mètre Cube | ميترو كيب | متر مكعب | m³ | Sable d'oued (الرملة), Gravette concassée (الكياس) |
| `m2` | Mètre Carré | ميترو كارّي | متر مربع | m² | Carrelage grès cérame (الزليج), Dalles |
| `rouleau` | Rouleau | رولو (Rouleau) | لفة | Roll | Étanchéité bitumineuse 10m², Fil de ligature 25kg, PEHD 100m |
| `seau` | Seau | سطل (Stel) | دلو | Bucket | Peinture vinyle 30kg (الصباغة), Peinture façade 25kg |
| `bidon` | Bidon | بيدوزة (Bidouza) | صفيحة | Canister / Jug | Primaire bitumineux Flintkote 18L, Hydrofuge Sika 5L |
| `panneau` | Panneau | بانّو (Panneau) | لوح | Sheet / Panel | Contreplaqué filmé bakélisé 18mm (1.22 x 2.44 m) |

---

## 3. Yard & Warehouse Layout Conventions (تنظيم الديبو)

Moroccan construction yards typically divide storage into specific indoor, covered, and open-air zones:

1. **Cour Extérieure / Yard (الساحة الخارجيّة / الزنقة)**:
   - High-volume, weather-resistant bulk materials:
     - Bins of sand (`SAB-OUED`) and gravel (`GRA-G1G2`).
     - Stacks of red clay bricks (`BRQ-06T`, `BRQ-08T`, `BRQ-12T`) on pallets.
     - Concrete cinder blocks / parpaings (`AGG-15C`, `AGG-20C`) and hourdis floor blocks (`HOU-16B`).
2. **Parc à Fer (بارك د الحديد)**:
   - Heavy rebar bundles sorted in steel racks/cribs by diameter (Ø8, Ø10, Ø12, Ø14, Ø16) in standard 12-meter straight bars or folded U-bars (`FER-HA*`).
   - Welded mesh sheets (`TRE-SOUD`) laid flat on raised wooden timber runners.
3. **Hangar A - Liants & Sacs (الهنغار أ - السيما والتخزين الجاف)**:
   - Completely dry, elevated covered warehouse storing perishable bags on wooden pallets:
     - Cement sacks (`CEM-CPJ45`, `CEM-CPJ35`, `CEM-BLANC`), plâtre (`PLA-CONS`), tile adhesives (`COL-ZEL25`, `COL-BLA25`).
4. **Hangar Bois (هنغار العود والكوفراج)**:
   - Dry timber storage holding pine formwork boards (`PLA-PIN4M`), madriers (`MAD-04M`), chevrons (`CHEV-04M`), phenolic plywood sheets (`CONT-BAK`), and scaffolding props (`ETAI-MET`).
5. **Hangar B - Tubes & Sanitaire (هنغار الرصاصة والبلومبري)**:
   - Cantilever racks storing 4-meter PVC drainage pipes (`PVC-110`, `PVC-050`), PPR hot water pipes (`PPR-25`), and coiled PEHD water conduits (`PEHD-25`).
6. **Magasin Finition & Droguerie (المحل التجاري والفيغاسيون)**:
   - Sheltered retail shop holding paint buckets (`PNT-VIN30`, `PNT-FAC25`), waterproofing resins and Sika canisters (`HYDRO-SICA`, `ETAN-FLUI`), tile spacers (`CROIS-02`), and hardware accessories.

---

## 4. How to Use the Catalog in Code

### In Frontend Components
Import standardized constants and helpers from [`src/data`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/data/index.js):

```javascript
import {
  CATEGORIES_TYPES,
  ITEMS_TYPES,
  getCategoryById,
  getCategoryBySlug,
  getItemTypeBySku,
  getItemsByCategory,
  getCategoryLabel,
  getItemLabel,
} from '../data'

// Example: Retrieve Moroccan Darija or French display name
const itemLabel = getItemLabel(itemType, currentLanguage)

// Example: Filter items by category slug
const steelItems = getItemsByCategory('steel_rebar')
```

### In Database Migrations
Always reference deterministic UUIDs so foreign key relations remain idempotent and repeatable across all staging and production Supabase databases:

```sql
INSERT INTO categories (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Ciment, Sable & Granulats (السيما والكياس والرملة)')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
```

---

## 5. Supplementary References
- Detailed 35-item catalog specifications: [catalog.md](./references/catalog.md)
- Moroccan construction yard terminology (Darija glossary): [terminology.md](./references/terminology.md)
