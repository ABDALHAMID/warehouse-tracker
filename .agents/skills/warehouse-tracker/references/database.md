# Database & Supabase Integration Guide

This document describes the PostgreSQL database schema, trigger mechanisms, Row Level Security (RLS) rules, and query conventions for the Warehouse Tracker.

The full executable SQL script is located at [`supabase_schema.sql`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/supabase_schema.sql) in the repository root.

---

## 1. Tables

### `public.items`
Stores all construction materials in the warehouse catalog.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique item identifier |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | Scannable barcode SKU (e.g. `CEM-45-001`) |
| `name` | VARCHAR(255) | NOT NULL | Material name (e.g. `Portland Cement CPJ 45`) |
| `category` | VARCHAR(100) | NOT NULL | Category slug: `cement`, `steel`, `bricks`, etc. |
| `current_stock` | NUMERIC | NOT NULL, DEFAULT 0 | Current quantity available in yard |
| `min_stock_level`| NUMERIC | NOT NULL, DEFAULT 10 | Safety threshold triggering low stock alerts |
| `unit` | VARCHAR(50) | NOT NULL, DEFAULT 'pieces' | Unit: `bags`, `tons`, `pieces`, `meters`, `buckets` |
| `location` | VARCHAR(150) | NULL | Physical aisle/bay: `Aisle A-01, Pallet 3` |
| `description` | TEXT | NULL | Detailed specifications or notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Timestamp of last stock update |

### `public.inventory_logs`
Stores every inbound or outbound stock movement performed by workers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Log transaction identifier |
| `item_id` | UUID | NOT NULL, REFERENCES items(id) | Associated material |
| `worker_id` | TEXT | NOT NULL | ID of authenticated worker |
| `worker_name` | TEXT | NULL | Display name of worker |
| `change_type` | VARCHAR(10) | CHECK (change_type IN ('IN', 'OUT')) | Movement type: `IN` (Add) or `OUT` (Deduct) |
| `quantity` | NUMERIC | NOT NULL, CHECK (quantity > 0) | Quantity moved |
| `notes` | TEXT | NULL | Optional delivery note, order number, or truck reference |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Transaction timestamp |

---

## 2. PostgreSQL Stock Math Trigger

> [!IMPORTANT]
> The frontend **never** executes direct math like `UPDATE items SET current_stock = current_stock + X`.
> Instead, the frontend inserts a row into `inventory_logs`. The database trigger executes immediately in PostgreSQL, guaranteeing transaction safety and consistency.

```sql
CREATE OR REPLACE FUNCTION public.update_item_stock_from_log()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.change_type = 'IN' THEN
        UPDATE public.items
        SET 
            current_stock = current_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    ELSIF NEW.change_type = 'OUT' THEN
        UPDATE public.items
        SET 
            current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_inventory_log_after_insert
AFTER INSERT ON public.inventory_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_item_stock_from_log();
```

---

## 3. Realtime Configuration

For live updates to work in the UI without refreshing, the tables must be added to Supabase's `supabase_realtime` publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_logs;
```

In the React frontend ([`src/pages/ItemDetail.jsx`](file:///home/abdalhamid/Documents/Project/warehouse-tracker/src/pages/ItemDetail.jsx)):
```javascript
const unsubscribe = warehouseDb.subscribeToItemChanges(id, (updatedItem) => {
  setItem((prev) => ({ ...prev, ...updatedItem, current_stock: updatedItem.current_stock }))
})
```

---

## 4. Row Level Security (RLS)

In Supabase, enable RLS and grant read and insert access:

```sql
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Allow update access to items" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Allow read access to inventory_logs" ON public.inventory_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert access to inventory_logs" ON public.inventory_logs FOR INSERT WITH CHECK (true);
```
