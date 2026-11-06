-- ==============================================================================
-- MIGRATION: ENGLISH DATABASE NAMES FOR CATEGORIES & ITEMS
-- Ensures category and item names in the database are stored strictly in English,
-- while frontend locales and mapping files handle French, Standard Arabic, and Moroccan Darija.
-- ==============================================================================

-- 1. Update Category name in database to pure English
UPDATE public.categories
SET name = 'Concrete Beams'
WHERE id = '33333333-3333-3333-3333-333333333333' OR name ILIKE 'Poutrelle%';

-- 2. Update existing Poutrelle items in database to pure English names
UPDATE public.items SET name = 'Concrete Beam 2.00m' WHERE sku = 'PTR-200';
UPDATE public.items SET name = 'Concrete Beam 2.20m' WHERE sku = 'PTR-220';
UPDATE public.items SET name = 'Concrete Beam 2.40m' WHERE sku = 'PTR-240';
UPDATE public.items SET name = 'Concrete Beam 2.60m' WHERE sku = 'PTR-260';
UPDATE public.items SET name = 'Concrete Beam 2.80m' WHERE sku = 'PTR-280';
UPDATE public.items SET name = 'Concrete Beam 3.00m' WHERE sku = 'PTR-300';
UPDATE public.items SET name = 'Concrete Beam 3.20m' WHERE sku = 'PTR-320';
UPDATE public.items SET name = 'Concrete Beam 3.40m' WHERE sku = 'PTR-340';
UPDATE public.items SET name = 'Concrete Beam 3.60m' WHERE sku = 'PTR-360';
UPDATE public.items SET name = 'Concrete Beam 3.80m' WHERE sku = 'PTR-380';
UPDATE public.items SET name = 'Concrete Beam 4.00m' WHERE sku = 'PTR-400';
UPDATE public.items SET name = 'Concrete Beam 4.20m' WHERE sku = 'PTR-420';
UPDATE public.items SET name = 'Concrete Beam 4.40m' WHERE sku = 'PTR-440';
UPDATE public.items SET name = 'Concrete Beam 4.60m' WHERE sku = 'PTR-460';
UPDATE public.items SET name = 'Concrete Beam 4.80m' WHERE sku = 'PTR-480';
UPDATE public.items SET name = 'Concrete Beam 5.00m' WHERE sku = 'PTR-500';
UPDATE public.items SET name = 'Concrete Beam 5.20m' WHERE sku = 'PTR-520';
UPDATE public.items SET name = 'Concrete Beam 5.40m' WHERE sku = 'PTR-540';
UPDATE public.items SET name = 'Concrete Beam 5.60m' WHERE sku = 'PTR-560';
UPDATE public.items SET name = 'Concrete Beam 5.80m' WHERE sku = 'PTR-580';
UPDATE public.items SET name = 'Concrete Beam 6.00m' WHERE sku = 'PTR-600';
UPDATE public.items SET name = 'Concrete Beam 7.20m' WHERE sku = 'PTR-720';

-- Catch any remaining PTR items that still have French "Poutrelle" in their DB name
UPDATE public.items
SET name = REPLACE(name, 'Poutrelle', 'Concrete Beam')
WHERE sku LIKE 'PTR-%' AND name LIKE 'Poutrelle%';

