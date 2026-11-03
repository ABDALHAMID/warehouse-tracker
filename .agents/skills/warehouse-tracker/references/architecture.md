# Architecture & Component Hierarchy

This document details the architectural layout, component tree, and data flow of the Building Materials Warehouse Inventory Tracker.

## Technology Stack

- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM v6/v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` with `@custom-variant dark (&:where(.dark, .dark *));`)
- **Icons**: Lucide React (`lucide-react`)
- **Hardware Scanning**: `html5-qrcode` (HTML5 camera video stream + canvas decoding)
- **Database / Auth**: `@supabase/supabase-js` (PostgreSQL with RLS, stored triggers, Realtime websockets)
- **Internationalization**: `react-i18next` + `i18next-browser-languagedetector`

---

## Directory Map

```text
src/
├── locales/                 # Translation dictionary files (1 JSON per language)
│   ├── en.json              # English
│   ├── fr.json              # French
│   ├── ar.json              # Standard Arabic
│   └── ar-MA.json           # Moroccan Darija (الدارجة المغربية)
├── context/
│   ├── AuthContext.jsx      # Supabase Auth, persistent session, and instant demo worker login
│   └── ThemeContext.jsx     # Dark/Light mode state; toggles .dark class on <html>
├── lib/
│   ├── i18n.js              # i18next initialization with dynamic dir="rtl" / "ltr" handler
│   ├── supabaseClient.js    # Supabase client instantiation, connection check, and seed data
│   └── warehouseDb.js       # Central data layer: Supabase queries, Realtime channels & local sync
├── components/
│   ├── Layout.jsx           # Master responsive wrapper, top header, status indicator, mobile nav
│   ├── ThemeToggle.jsx      # High-contrast 44px+ touch button for Sun/Moon theme toggle
│   ├── LangSwitcher.jsx     # Dropdown menu to switch between the 4 languages
│   └── Scanner.jsx          # html5-qrcode camera viewfinder with laser animation & torch/camera flip
├── pages/
│   ├── Login.jsx            # Worker authentication with instant 1-click role logins
│   ├── Dashboard.jsx        # Total items KPI, urgent low stock alerts (current_stock <= min_stock_level)
│   ├── InventoryList.jsx    # Real-time search by name/SKU, category tabs, stock status chips
│   ├── ItemDetail.jsx       # Route /item/:id, Realtime subscription, large IN/OUT buttons & audit log
│   └── ScanView.jsx         # Full camera scanner view, quick test chips & manual SKU entry
├── App.jsx                  # Protected and Public route tree
├── main.jsx                 # Entry point with i18n, BrowserRouter, ThemeProvider, AuthProvider
└── index.css                # Base stylesheet with fonts, mobile viewport tweaks, and scrollbar styling
```

---

## Component Tree & Routing

```text
main.jsx
└── BrowserRouter
    └── ThemeProvider
        └── AuthProvider
            └── App
                ├── /login -> PublicRoute -> Login.jsx
                └── / -> ProtectedRoute -> Layout.jsx
                    ├── index (/) -> Dashboard.jsx
                    ├── /inventory -> InventoryList.jsx
                    ├── /item/:id -> ItemDetail.jsx
                    └── /scan -> ScanView.jsx
```

---

## Data Flow & Resilience Strategy

The application uses [`src/lib/warehouseDb.js`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/lib/warehouseDb.js) as a unified data gateway:

```
[UI Component: ItemDetail, Dashboard, etc.]
                  │
                  ▼
         warehouseDb helper
         /                \
        / (if configured)  \ (offline or fallback)
       ▼                    ▼
 Supabase PostgreSQL   LocalStorage Sync
 (items & logs tables) (simulates trigger & persistence)
       │                    │
       ▼                    ▼
 Supabase Realtime    window.dispatchEvent
 (WebSocket event)    ('mattrack:item-updated')
       │                    │
       └──────────┬─────────┘
                  ▼
       Instant UI State Update
```

1. **Supabase Live Mode**:
   When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in `.env`, the app queries Supabase directly.
2. **Resilience / Fallback Mode**:
   If environment variables are not yet configured or the device is offline in a basement warehouse without Wi-Fi, `warehouseDb` falls back to `localStorage` seeded with realistic building materials data. The app remains 100% functional without crashes.
3. **Database Trigger**:
   Stock calculations are handled by the database trigger `update_item_stock_from_log()` upon inserting a record into `inventory_logs`. The client does not manually calculate `current_stock` in the DB.
4. **Realtime Subscription**:
   In `ItemDetail.jsx`, `warehouseDb.subscribeToItemChanges(id, callback)` registers a Supabase Realtime subscription on `public.items` filtered by `id=eq.${id}`. When the database trigger updates `current_stock`, the new value arrives over websockets and updates the UI instantaneously.
