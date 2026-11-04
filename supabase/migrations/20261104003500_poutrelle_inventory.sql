-- ==============================================================================
-- MIGRATION: SEED POUTRELLE INVENTORY (البوتريل د الدالة)
-- Restructure warehouse inventory to start specifically with Poutrelles at El Hommer 2
-- ==============================================================================

-- 1. Clean previous items and categories
DELETE FROM public.inventory_logs;
DELETE FROM public.items;
DELETE FROM public.categories;

-- 2. Insert Poutrelle Category
INSERT INTO public.categories (id, name) VALUES 
  ('88888888-8888-8888-8888-888888888888', 'Poutrelles Précontraintes (البوتريل د الدالة)')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name;

-- 3. Insert Poutrelle Items (2,20m and 7,20m located in "el hommer 2")
INSERT INTO public.items (sku, name, category_id, unit, current_stock, min_stock_level, location_bin) VALUES 
  ('POUT-220', 'Poutrelle Précontrainte 2,20m (بوتريل 2.20م)', '88888888-8888-8888-8888-888888888888', 'piece', 50.00, 10.00, 'el hommer 2'),
  ('POUT-720', 'Poutrelle Précontrainte 7,20m (بوتريل 7.20م)', '88888888-8888-8888-8888-888888888888', 'piece', 30.00, 5.00, 'el hommer 2')
ON CONFLICT (sku) DO UPDATE 
SET 
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  unit = EXCLUDED.unit,
  current_stock = EXCLUDED.current_stock,
  min_stock_level = EXCLUDED.min_stock_level,
  location_bin = EXCLUDED.location_bin,
  updated_at = NOW();
