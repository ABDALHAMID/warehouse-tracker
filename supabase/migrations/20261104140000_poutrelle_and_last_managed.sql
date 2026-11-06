-- ==============================================================================
-- MIGRATION: POUTRELLE CATEGORY, SEED ITEMS & LAST MANAGED AUTO-SORTING
-- Ensures updated_at updates on every inventory change, creates Poutrelle category,
-- and seeds standard Moroccan construction Poutrelles.
-- ==============================================================================

-- 1. Ensure updated_at column exists on public.items
ALTER TABLE public.items 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_items_updated_at ON public.items (updated_at DESC);

-- 2. Trigger Function: Update stock & updated_at on inventory_logs insert
CREATE OR REPLACE FUNCTION public.update_item_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  ELSIF NEW.change_type = 'ADJUSTMENT' THEN
    UPDATE public.items 
    SET 
      current_stock = NEW.quantity, 
      updated_at = NOW() 
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_stock ON public.inventory_logs;
CREATE TRIGGER trigger_update_stock
  AFTER INSERT ON public.inventory_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_item_stock();

-- Also ensure update_item_stock_from_log alias trigger exists if referenced
CREATE OR REPLACE FUNCTION public.update_item_stock_from_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.update_item_stock();
END;
$function$;

-- 3. Upsert Category (Deterministic UUID, English canonical name)
INSERT INTO public.categories (id, name)
VALUES ('33333333-3333-3333-3333-333333333333', 'Concrete Beams')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name;

-- 4. Seed Standard Moroccan Construction Beams (PTR-200 to PTR-720, English canonical names)
INSERT INTO public.items (sku, name, category_id, unit, current_stock, min_stock_level, location_bin, updated_at)
VALUES 
  ('PTR-200', 'Concrete Beam 2.00m', '33333333-3333-3333-3333-333333333333', 'piece', 50, 10, 'el hommer 2', NOW() - INTERVAL '15 minutes'),
  ('PTR-220', 'Concrete Beam 2.20m', '33333333-3333-3333-3333-333333333333', 'piece', 60, 10, 'el hommer 2', NOW() - INTERVAL '14 minutes'),
  ('PTR-240', 'Concrete Beam 2.40m', '33333333-3333-3333-3333-333333333333', 'piece', 45, 10, 'el hommer 2', NOW() - INTERVAL '13 minutes'),
  ('PTR-260', 'Concrete Beam 2.60m', '33333333-3333-3333-3333-333333333333', 'piece', 40, 10, 'el hommer 2', NOW() - INTERVAL '12 minutes'),
  ('PTR-280', 'Concrete Beam 2.80m', '33333333-3333-3333-3333-333333333333', 'piece', 55, 10, 'el hommer 2', NOW() - INTERVAL '11 minutes'),
  ('PTR-300', 'Concrete Beam 3.00m', '33333333-3333-3333-3333-333333333333', 'piece', 80, 15, 'el hommer 2', NOW() - INTERVAL '10 minutes'),
  ('PTR-320', 'Concrete Beam 3.20m', '33333333-3333-3333-3333-333333333333', 'piece', 65, 15, 'el hommer 2', NOW() - INTERVAL '9 minutes'),
  ('PTR-340', 'Concrete Beam 3.40m', '33333333-3333-3333-3333-333333333333', 'piece', 70, 15, 'el hommer 2', NOW() - INTERVAL '8 minutes'),
  ('PTR-360', 'Concrete Beam 3.60m', '33333333-3333-3333-3333-333333333333', 'piece', 50, 10, 'el hommer 2', NOW() - INTERVAL '7 minutes'),
  ('PTR-380', 'Concrete Beam 3.80m', '33333333-3333-3333-3333-333333333333', 'piece', 45, 10, 'el hommer 2', NOW() - INTERVAL '6 minutes'),
  ('PTR-400', 'Concrete Beam 4.00m', '33333333-3333-3333-3333-333333333333', 'piece', 90, 20, 'el hommer 2', NOW() - INTERVAL '5 minutes'),
  ('PTR-420', 'Concrete Beam 4.20m', '33333333-3333-3333-3333-333333333333', 'piece', 60, 15, 'el hommer 2', NOW() - INTERVAL '4 minutes'),
  ('PTR-440', 'Concrete Beam 4.40m', '33333333-3333-3333-3333-333333333333', 'piece', 40, 10, 'el hommer 2', NOW() - INTERVAL '3 minutes'),
  ('PTR-460', 'Concrete Beam 4.60m', '33333333-3333-3333-3333-333333333333', 'piece', 35, 10, 'el hommer 2', NOW() - INTERVAL '2 minutes'),
  ('PTR-480', 'Concrete Beam 4.80m', '33333333-3333-3333-3333-333333333333', 'piece', 30, 10, 'el hommer 2', NOW() - INTERVAL '1 minute'),
  ('PTR-500', 'Concrete Beam 5.00m', '33333333-3333-3333-3333-333333333333', 'piece', 50, 15, 'el hommer 2', NOW() - INTERVAL '50 seconds'),
  ('PTR-520', 'Concrete Beam 5.20m', '33333333-3333-3333-3333-333333333333', 'piece', 25, 5, 'el hommer 2', NOW() - INTERVAL '40 seconds'),
  ('PTR-540', 'Concrete Beam 5.40m', '33333333-3333-3333-3333-333333333333', 'piece', 25, 5, 'el hommer 2', NOW() - INTERVAL '30 seconds'),
  ('PTR-560', 'Concrete Beam 5.60m', '33333333-3333-3333-3333-333333333333', 'piece', 20, 5, 'el hommer 2', NOW() - INTERVAL '20 seconds'),
  ('PTR-580', 'Concrete Beam 5.80m', '33333333-3333-3333-3333-333333333333', 'piece', 20, 5, 'el hommer 2', NOW() - INTERVAL '15 seconds'),
  ('PTR-600', 'Concrete Beam 6.00m', '33333333-3333-3333-3333-333333333333', 'piece', 30, 5, 'el hommer 2', NOW() - INTERVAL '10 seconds'),
  ('PTR-720', 'Concrete Beam 7.20m', '33333333-3333-3333-3333-333333333333', 'piece', 30, 5, 'el hommer 2', NOW())
ON CONFLICT (sku) DO UPDATE
SET name = EXCLUDED.name,
    category_id = EXCLUDED.category_id;

-- 5. Ensure RLS policies allow reading items and categories for active workers and anon
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Allow public read categories'
  ) THEN
    CREATE POLICY "Allow public read categories" ON public.categories
      FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'items' AND policyname = 'Allow public read items'
  ) THEN
    CREATE POLICY "Allow public read items" ON public.items
      FOR SELECT TO public USING (true);
  END IF;
END $$;
