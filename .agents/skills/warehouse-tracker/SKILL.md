---
name: warehouse-tracker
description: >-
  Comprehensive guide and runbook for understanding, modifying, and extending the
  Building Materials Warehouse Inventory Tracker. Use this skill whenever inspecting
  or altering this repository, updating inventory logic, adding translation keys (EN,
  FR, AR, Moroccan Darija), adjusting Supabase schema or triggers, modifying the
  html5-qrcode scanner, or creating new warehouse workflows.
---

# Building Materials Warehouse Tracker Skill

This skill guides AI agents in understanding, modifying, and extending the **Building Materials Warehouse Inventory Tracker** (`warehouse-tracker`).

## Quick Reference Links
- [Architecture & Components](./references/architecture.md)
- [Database & Supabase Schema](./references/database.md)
- [Internationalization & RTL Guide](./references/i18n-guide.md)
- [Moroccan Building Materials Catalog Skill](../moroccan-building-materials/SKILL.md)

---

## 1. Project Mental Model & Core Architecture

The application is a mobile-first, high-contrast inventory tracker designed for rugged construction yards and warehouse operators.

### Key Tenets
1. **Never Calculate Stock on the Client**:
   Stock adjustments are made by inserting a record into the `inventory_logs` table (`item_id`, `worker_id`, `change_type`, `quantity`). The PostgreSQL trigger `update_item_stock_from_log()` handles the math atomically.
2. **Realtime Reactivity**:
   Components viewing items (like `ItemDetail.jsx`) subscribe to Supabase Realtime changes (`postgres_changes` on `public.items`). Stock balances update immediately on all connected devices without page refreshes.
3. **Resilient Offline / Demo Mode**:
   [`src/lib/warehouseDb.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/warehouseDb.js) transparently routes to `localStorage` and synthetic browser events when Supabase credentials are missing or the device is offline.
4. **Bidirectional Layout (RTL/LTR)**:
   Arabic (`ar`) and Moroccan Darija (`ar-MA`) dynamically flip the entire document direction to `dir="rtl"`. Always use logical Tailwind CSS utilities (`start-*`, `end-*`, `ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`, `text-end`).
5. **Worker-Friendly UI**:
   Touch targets must be at least 44px to 56px high, accessible with gloves, and high-contrast in both Dark and Light modes.

---

## 2. File & Directory Responsibilities

| File / Folder | Responsibility |
|---|---|
| [`src/data/categories_types.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/data/categories_types.js) | Standard Moroccan categories (`CATEGORIES_TYPES`), IDs, slugs, and localized names |
| [`src/data/items_types.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/data/items_types.js) | 35 authentic Moroccan items (`ITEMS_TYPES`), SKUs, units, default stocks, thresholds |
| [`src/data/index.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/data/index.js) | Barrel export for category and item types and lookup helpers |
| [`src/lib/supabaseClient.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/supabaseClient.js) | Initializes `@supabase/supabase-js` and exports `isSupabaseConfigured` |
| [`src/lib/warehouseDb.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/warehouseDb.js) | Central data access layer for items, logs, lookups by SKU, and Realtime subscriptions |
| [`src/lib/i18n.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/i18n.js) | `react-i18next` initialization and dynamic `dir="rtl"` / `dir="ltr"` switcher |
| [`src/locales/`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/locales/) | `en.json`, `fr.json`, `ar.json`, `ar-MA.json` translation files |
| [`src/lib/workerProfiles.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/workerProfiles.js) | Data access helpers for `public.worker_profiles`, role badges, and heartbeat |
| [`src/context/AuthContext.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/context/AuthContext.jsx) | Supabase Auth listener, worker profile sync, active-status check, heartbeat, and RBAC flags |
| [`src/context/ThemeContext.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/context/ThemeContext.jsx) | Class-based dark mode state with automatic persistence to `public.worker_profiles` |
| [`src/components/Scanner.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/components/Scanner.jsx) | Camera viewfinder using `html5-qrcode` with torch, camera flip, and haptic feedback |
| [`src/components/Layout.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/components/Layout.jsx) | Navigation bar with worker profile badge, role, assigned zone, and `/profile` link |
| [`src/pages/Dashboard.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/Dashboard.jsx) | Total catalog KPI, empty stock message, low stock alerts, recent activity feed with worker attribution and human date |
| [`src/pages/InventoryList.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/InventoryList.jsx) | Live search by name/SKU, empty stock state, dynamic category filter tabs from `CATEGORIES_TYPES`, stock status chips |
| [`src/pages/ItemDetail.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/ItemDetail.jsx) | Route `/item/:id`, Realtime subscription, RBAC-gated IN/OUT action buttons, item audit log with worker join |
| [`src/pages/Profile.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/Profile.jsx) | Route `/profile`, personal profile edit form, read-only identity cards, and manager-only Warehouse Team management |
| [`src/pages/ScanView.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/ScanView.jsx) | Dedicated camera scanner page and manual SKU fallback input |
| [`supabase/migrations/`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/supabase/migrations/) | Production Supabase database migrations (schema, tables, triggers, and seed categories) |
| [`.agents/skills/moroccan-building-materials/`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/.agents/skills/moroccan-building-materials/SKILL.md) | Standard catalog and Darija terminology for Moroccan warehouse materials |

---

## 3. Step-by-Step Runbooks for Common Modifications

### Runbook A: Adding a New Category
1. Add the category in [`src/data/categories_types.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/data/categories_types.js) with its deterministic UUID, slug, and multilingual names.
2. In [`supabase/migrations/20261103012727_seed_categories_and_items.sql`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/supabase/migrations/20261103012727_seed_categories_and_items.sql), add the `INSERT INTO categories ...` row.
3. Add the translation in all 4 locale JSON files under the `"categories"` key:
   - `src/locales/en.json`: `"insulation": "Insulation & Drywall"`
   - `src/locales/fr.json`: `"insulation": "Isolation & Plaques de Plâtre"`
   - `src/locales/ar.json`: `"insulation": "العزل وألواح الجبس"`
   - `src/locales/ar-MA.json`: `"insulation": "العزل والبلاكو بلاتر"`

### Runbook B: Adding a New Field to Materials (e.g., `supplier` or `shelf_bin`)
1. In [`supabase_schema.sql`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/supabase_schema.sql), add the column to `public.items`:
   ```sql
   ALTER TABLE public.items ADD COLUMN IF NOT EXISTS supplier VARCHAR(150);
   ```
2. In [`src/lib/supabaseClient.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/supabaseClient.js), update `INITIAL_ITEMS` seed array with the new field.
3. In [`src/pages/ItemDetail.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/ItemDetail.jsx), display the field inside the info chips section.
4. Add localization keys in `src/locales/*.json` for any user-facing label.

### Runbook C: Adding a New Stock Movement Type (e.g., `RETURN`, `SCRAP`, `TRANSFER`)
1. In [`supabase_schema.sql`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/supabase_schema.sql), update the `inventory_logs` check constraint and trigger logic:
   ```sql
   ALTER TABLE public.inventory_logs DROP CONSTRAINT inventory_logs_change_type_check;
   ALTER TABLE public.inventory_logs ADD CONSTRAINT inventory_logs_change_type_check
     CHECK (change_type IN ('IN', 'OUT', 'RETURN', 'SCRAP'));
   ```
   Update the trigger function `update_item_stock_from_log()` to handle the new action:
   ```sql
   ELSIF NEW.change_type = 'RETURN' THEN
     UPDATE public.items SET current_stock = current_stock + NEW.quantity WHERE id = NEW.item_id;
   ```
2. In [`src/lib/warehouseDb.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/warehouseDb.js), update the local fallback math in `insertInventoryLog`.
3. In [`src/pages/ItemDetail.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/ItemDetail.jsx), add a corresponding action button or modal selector.
4. Add translation labels in `src/locales/*.json`.

### Runbook D: Modifying Barcode Scanner Formats or Sensitivity
1. Open [`src/components/Scanner.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/components/Scanner.jsx).
2. To support additional symbologies (e.g. Aztec, MaxiCode), import the format enum from `html5-qrcode` and append it to `formatsToSupport`.
3. To adjust scan frame size or aspect ratio, adjust the `qrbox` function in `config`.

### Runbook E: Adding a New Page or Navigation Route
1. Create the page component in `src/pages/NewPage.jsx`.
2. Register the route in [`src/App.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/App.jsx) within the `<ProtectedRoute><Layout /></ProtectedRoute>` route branch.
3. If the page needs to appear in the navigation bars, add `NavLink` entries in [`src/components/Layout.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/components/Layout.jsx) (both in desktop `<nav>` and mobile bottom `<nav>`).
4. Add the navigation title key to `src/locales/*.json` under `"nav"`.

---

## 4. Verification & Quality Checklist

Before completing any task or modification on this codebase, always run:

```bash
# 1. Check for linting issues and React compiler rules
npm run lint

# 2. Verify TypeScript / JSX syntax and production bundling
npm run build
```

Verify that:
- [ ] No un-translated hardcoded strings exist in JSX (always use `t(...)`).
- [ ] All 4 translation files have matching keys (`en.json`, `fr.json`, `ar.json`, `ar-MA.json`).
- [ ] No physical left/right CSS classes are used (use `start-*`, `end-*`, `ps-*`, `pe-*`, `ms-*`, `me-*`).
- [ ] Large touch targets (min 44px) are preserved for warehouse workers.
