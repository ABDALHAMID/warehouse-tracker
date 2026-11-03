-- Insert Categories
INSERT INTO categories (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Cement'),
  ('22222222-2222-2222-2222-222222222222', 'Timber');

-- Insert Items
INSERT INTO items (sku, name, category_id, unit, current_stock) VALUES 
  ('CEM-01', 'Portland 50kg', '11111111-1111-1111-1111-111111111111', 'bag', 100),
  ('TMB-01', 'Oak 2x4', '22222222-2222-2222-2222-222222222222', 'pallet', 50);