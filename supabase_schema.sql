-- ==============================================================
-- BUILDING MATERIALS WAREHOUSE TRACKER - SUPABASE DATABASE SCHEMA
-- ==============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Items Table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    current_stock NUMERIC NOT NULL DEFAULT 0,
    min_stock_level NUMERIC NOT NULL DEFAULT 10,
    unit VARCHAR(50) NOT NULL DEFAULT 'pieces',
    location VARCHAR(150),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant barcode scan lookups
CREATE INDEX IF NOT EXISTS idx_items_sku ON public.items (sku);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items (category);
CREATE INDEX IF NOT EXISTS idx_items_low_stock ON public.items (current_stock, min_stock_level);

-- 3. Create Inventory Logs Table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    worker_id TEXT NOT NULL,
    worker_name TEXT,
    change_type VARCHAR(10) NOT NULL CHECK (change_type IN ('IN', 'OUT')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_item ON public.inventory_logs (item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created ON public.inventory_logs (created_at DESC);

-- 4. Database Trigger: Update Current Stock on New Inventory Log
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

DROP TRIGGER IF EXISTS trg_inventory_log_after_insert ON public.inventory_logs;
CREATE TRIGGER trg_inventory_log_after_insert
AFTER INSERT ON public.inventory_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_item_stock_from_log();

-- 5. Enable Supabase Realtime for Items and Inventory Logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_logs;

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read access for items
CREATE POLICY "Allow read access to items" 
ON public.items FOR SELECT 
USING (true);

-- Allow authenticated users to update items
CREATE POLICY "Allow update access to items" 
ON public.items FOR UPDATE 
USING (true);

-- Allow inserting and reading inventory logs
CREATE POLICY "Allow read access to inventory_logs" 
ON public.inventory_logs FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to inventory_logs" 
ON public.inventory_logs FOR INSERT 
WITH CHECK (true);

-- 7. Seed Sample Building Materials Data
INSERT INTO public.items (sku, name, category, current_stock, min_stock_level, unit, location, description)
VALUES 
    ('CEM-45-001', 'Portland Cement CPJ 45 (50kg)', 'cement', 350, 100, 'bags', 'Aisle A-01, Pallet 3', 'High strength hydraulic binder for reinforced concrete foundations and slabs.'),
    ('CEM-35-002', 'White Portland Cement CPJ 35 (25kg)', 'cement', 18, 40, 'bags', 'Aisle A-02, Shelf 1', 'Premium white cement for architectural finishes, terrazzo, and masonry mortar.'),
    ('STL-12-101', 'Deformed Rebar FeE500 Ø12mm (12m)', 'steel', 820, 250, 'pieces', 'Yard Bay B-01', 'High tensile ribbed steel bar for structural beams and reinforced columns.'),
    ('STL-16-102', 'Deformed Rebar FeE500 Ø16mm (12m)', 'steel', 45, 150, 'pieces', 'Yard Bay B-02', 'Heavy duty reinforcement steel bar for heavy civil foundations.'),
    ('STL-MSH-103', 'Welded Wire Mesh PAF-C 2.4x6m', 'steel', 110, 40, 'pieces', 'Yard Bay B-04', 'Electrowelded mesh 150x150x6mm for ground slabs and screeds.'),
    ('BRK-06-201', 'Red Hollow Clay Bricks 6-Hole (20x20x10)', 'bricks', 2400, 600, 'pieces', 'Yard Stack C-01', 'Standard terracotta hollow partition bricks for interior masonry walls.'),
    ('BRK-BLK-202', 'Concrete Hollow Blocks (15x20x40cm)', 'bricks', 75, 300, 'pieces', 'Yard Stack C-03', 'Vibrated load-bearing concrete parpaings for perimeter and retaining walls.'),
    ('TMB-PLK-301', 'Treated Pinewood Formwork Planks (4m x 15cm x 25mm)', 'timber', 280, 100, 'pieces', 'Shed D-01', 'Kiln-dried Scandinavian red pine planks for concrete shuttering.'),
    ('TMB-PLY-302', 'Phenolic Film Faced Plywood 18mm (1.22x2.44m)', 'timber', 14, 40, 'pieces', 'Shed D-02', 'Waterproof birch core shuttering plywood for smooth concrete finish.'),
    ('PLM-PVC-401', 'Rigid PVC Evacuation Pipe Ø110mm (4m)', 'plumbing', 92, 40, 'meters', 'Rack E-01', 'Sanitary wastewater drainage pipe with integrated gasket socket.'),
    ('PLM-HDP-402', 'HDPE Water Pressure Pipe PN16 Ø32mm (100m Roll)', 'plumbing', 4, 12, 'pieces', 'Rack E-03', 'High-density polyethylene roll for potable water main supply line.'),
    ('PNT-ACR-501', 'Exterior Acrylic Weatherproof Paint (20kg Bucket)', 'paints', 64, 25, 'buckets', 'Store Room F-02', 'UV-resistant matte facade coating with high water repellency.'),
    ('ELE-CBL-601', 'Rigid Copper Cable U1000 R2V 3G2.5mm² (100m)', 'electrical', 28, 15, 'pieces', 'Secure Room G-01', 'Heavy duty insulated power cable for building electrical circuits.')
ON CONFLICT (sku) DO NOTHING;
