-- ==============================================================================
-- SEED DATA: MOROCCAN LOCAL BUILDING MATERIALS WAREHOUSE (ديبو مواد البناء بالمغرب)
-- Categories and Items tailored for local Moroccan construction supply depots
-- ==============================================================================

-- 1. Insert Moroccan Warehouse Categories
INSERT INTO public.categories (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Ciment, Sable & Granulats (السيما والكياس والرملة)'),
  ('22222222-2222-2222-2222-222222222222', 'Fer à Béton & Armatures (الحديد والكرومة)'),
  ('33333333-3333-3333-3333-333333333333', 'Briques, Hourdis & Parpaings (الباجور والياجور والبارفان)'),
  ('44444444-4444-4444-4444-444444444444', 'Bois de Coffrage & Charpente (العود والكوفراج)'),
  ('55555555-5555-5555-5555-555555555555', 'Plomberie & Assainissement (الرصاصة والبلومبري وجعاب)'),
  ('66666666-6666-6666-6666-666666666666', 'Peinture, Droguerie & Étanchéité (الصباغة والكتامة وليدوفيج)'),
  ('77777777-7777-7777-7777-777777777777', 'Carrelage & Revêtements (الزليج والكولا وفينيسيون)')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name;

-- 2. Insert Moroccan Warehouse Items
INSERT INTO public.items (sku, name, category_id, unit, current_stock, min_stock_level, location_bin) VALUES 
  -- Category 1: Ciment, Sable & Granulats
  ('CEM-CPJ45', 'Ciment CPJ 45 (Lafarge / Asment) - Sac 50kg (خنشة السيما 45)', '11111111-1111-1111-1111-111111111111', 'sac', 350.00, 80.00, 'Hangar A - Allée 1'),
  ('CEM-CPJ35', 'Ciment CPJ 35 Maçonnerie - Sac 50kg (خنشة السيما 35)', '11111111-1111-1111-1111-111111111111', 'sac', 160.00, 40.00, 'Hangar A - Allée 2'),
  ('CEM-BLANC', 'Ciment Blanc CPJ 35 - Sac 25kg (السيما البيضا)', '11111111-1111-1111-1111-111111111111', 'sac', 45.00, 20.00, 'Hangar A - Rayon Finition'),
  ('SAB-OUED', 'Sable d''Oued Tamisé pour Mortier (الرملة الواد د البني)', '11111111-1111-1111-1111-111111111111', 'm3', 55.00, 15.00, 'Zone Vrac - Dépôt Nord'),
  ('GRAV-G1', 'Gravette Concassée G1 15/25 Béton (الكياس د البيطون)', '11111111-1111-1111-1111-111111111111', 'm3', 40.00, 12.00, 'Zone Vrac - Dépôt Nord'),
  ('CHX-HYD', 'Chaux Hydraulique Éteinte - Sac 25kg (الجير الرطب المطفى)', '11111111-1111-1111-1111-111111111111', 'sac', 70.00, 25.00, 'Hangar A - Allée 3'),
  ('PLT-MA', 'Plâtre Traditionnel de Construction - Sac 40kg (الجبص الرومي)', '11111111-1111-1111-1111-111111111111', 'sac', 90.00, 30.00, 'Hangar A - Allée 3'),

  -- Category 2: Fer à Béton & Armatures
  ('FER-HA08', 'Fer à Béton FeE500 Ø8mm Barre 12m (حديد 8 تور)', '22222222-2222-2222-2222-222222222222', 'barre', 420.00, 100.00, 'Parc à Fer - Casier 1'),
  ('FER-HA10', 'Fer à Béton FeE500 Ø10mm Barre 12m (حديد 10 تور)', '22222222-2222-2222-2222-222222222222', 'barre', 310.00, 80.00, 'Parc à Fer - Casier 2'),
  ('FER-HA12', 'Fer à Béton FeE500 Ø12mm Barre 12m (حديد 12 تور)', '22222222-2222-2222-2222-222222222222', 'barre', 240.00, 70.00, 'Parc à Fer - Casier 3'),
  ('FER-HA14', 'Fer à Béton FeE500 Ø14mm Barre 12m (حديد 14 تور)', '22222222-2222-2222-2222-222222222222', 'barre', 150.00, 50.00, 'Parc à Fer - Casier 4'),
  ('FER-HA16', 'Fer à Béton FeE500 Ø16mm Barre 12m (حديد 16 تور)', '22222222-2222-2222-2222-222222222222', 'barre', 95.00, 35.00, 'Parc à Fer - Casier 5'),
  ('TRE-15X15', 'Treillis Soudé PAF-C 150x150x6mm Panneau 2.4x6m (الكرومة د الدالة)', '22222222-2222-2222-2222-222222222222', 'panneau', 80.00, 25.00, 'Parc à Fer - Zone Treillis'),
  ('FIL-LIG', 'Fil de Fer Recuit pour Ligature Rouleau 25kg (سلك الرباط د الشانطي)', '22222222-2222-2222-2222-222222222222', 'rouleau', 45.00, 15.00, 'Magasin Quincaillerie'),

  -- Category 3: Briques, Hourdis & Parpaings
  ('BRQ-06T', 'Brique Creuse Rouge 6 Trous 20x20x7cm (باجور 6 تقابي)', '33333333-3333-3333-3333-333333333333', 'piece', 3200.00, 600.00, 'Yard - Zone Briques 1'),
  ('BRQ-08T', 'Brique Creuse Rouge 8 Trous 20x20x10cm (باجور 8 تقابي)', '33333333-3333-3333-3333-333333333333', 'piece', 4100.00, 800.00, 'Yard - Zone Briques 2'),
  ('BRQ-12T', 'Brique Creuse Rouge 12 Trous 20x20x15cm (باجور 12 تقبة)', '33333333-3333-3333-3333-333333333333', 'piece', 1800.00, 400.00, 'Yard - Zone Briques 3'),
  ('PAR-15C', 'Parpaing Creux Béton 15x20x40cm (بارفان / طوبيا 15)', '33333333-3333-3333-3333-333333333333', 'piece', 1400.00, 300.00, 'Yard - Zone Parpaing'),
  ('PAR-20C', 'Parpaing Creux Béton 20x20x40cm Porteur (بارفان د الساس 20)', '33333333-3333-3333-3333-333333333333', 'piece', 950.00, 200.00, 'Yard - Zone Parpaing'),
  ('HOU-16B', 'Hourdis Béton pour Plancher H16cm (الهوردي د الدالة 16)', '33333333-3333-3333-3333-333333333333', 'piece', 820.00, 250.00, 'Yard - Zone Planchers'),

  -- Category 4: Bois de Coffrage & Charpente
  ('MAD-04M', 'Madriers Pin Rouge Traité 4m x 7.5cm x 22.5cm (المادري د الكوفراج)', '44444444-4444-4444-4444-444444444444', 'piece', 180.00, 45.00, 'Hangar B - Rayon Bois 1'),
  ('CHV-04M', 'Chevrons Pin Rouge 4m x 7.5cm x 7.5cm (الشفرون 4 ميترو)', '44444444-4444-4444-4444-444444444444', 'piece', 260.00, 60.00, 'Hangar B - Rayon Bois 2'),
  ('PLN-04M', 'Planches de Coffrage Pin 4m x 15cm x 2.5cm (البلانش د الكوفراج)', '44444444-4444-4444-4444-444444444444', 'piece', 520.00, 150.00, 'Hangar B - Rayon Bois 3'),
  ('PLY-18M', 'Contreplaqué Bakélisé Filmé Noir 18mm 1.22x2.44m (كونتربلاكي كوفراج)', '44444444-4444-4444-4444-444444444444', 'panneau', 85.00, 25.00, 'Hangar B - Zone Panneaux'),

  -- Category 5: Plomberie & Assainissement
  ('PVC-110', 'Tube PVC Évacuation Assainissement Ø110mm Barre 4m (قادوس 110)', '55555555-5555-5555-5555-555555555555', 'barre', 130.00, 40.00, 'Rack Extérieur - PVC 1'),
  ('PVC-050', 'Tube PVC Évacuation Sanitaire Ø50mm Barre 4m (قادوس ديامتر 50)', '55555555-5555-5555-5555-555555555555', 'barre', 95.00, 30.00, 'Rack Extérieur - PVC 2'),
  ('PEH-032', 'Tube PEHD Eau Potable PN16 Ø32mm Couronne 100m (جعبة كحلة 32)', '55555555-5555-5555-5555-555555555555', 'rouleau', 15.00, 5.00, 'Magasin Plomberie'),
  ('MLT-016', 'Tube Multicouche Isolé Blanc Ø16mm Couronne 50m (الملتيكوش ديامتر 16)', '55555555-5555-5555-5555-555555555555', 'rouleau', 22.00, 6.00, 'Magasin Plomberie'),

  -- Category 6: Peinture, Droguerie & Étanchéité
  ('PNT-VIN30', 'Peinture Vinyle Blanche Intérieure Seau 30kg Astral (صباغة الفينيل 30 كغ)', '66666666-6666-6666-6666-666666666666', 'seau', 75.00, 20.00, 'Magasin Droguerie - Rayon Peinture'),
  ('PNT-FAC20', 'Peinture Façade Acrylique Hydrofuge Seau 20kg (صباغة الواجهة ليدوفيج)', '66666666-6666-6666-6666-666666666666', 'seau', 50.00, 15.00, 'Magasin Droguerie - Rayon Peinture'),
  ('ROL-ETN4M', 'Membrane d''Étanchéité Bitumineuse Sablée 4mm 1x10m (الرولو د ليتونشيتي)', '66666666-6666-6666-6666-666666666666', 'rouleau', 60.00, 20.00, 'Magasin Droguerie - Rayon Étanchéité'),
  ('IMP-FIX20', 'Fixateur d''Accrochage Façade Bidon 20L (الفيكساتور د الصباغة)', '66666666-6666-6666-6666-666666666666', 'bidon', 30.00, 10.00, 'Magasin Droguerie - Rayon Peinture'),

  -- Category 7: Carrelage & Revêtements
  ('COL-ZEL25', 'Colle à Carrelage Mortier Haute Adhérence C2 Sac 25kg (كولا د الزليج)', '77777777-7777-7777-7777-777777777777', 'sac', 160.00, 45.00, 'Hangar A - Allée 4'),
  ('JNT-ZEL05', 'Joint à Carrelage Blanc Hydrofuge Sac 5kg (الروان د الزليج أبيض)', '77777777-7777-7777-7777-777777777777', 'sac', 110.00, 30.00, 'Hangar A - Allée 4'),
  ('CRL-60X60', 'Grès Cérame Rectifié Sol 60x60cm Effet Marbre (زليج بلانكو 60/60)', '77777777-7777-7777-7777-777777777777', 'm2', 360.00, 90.00, 'Zone Carrelage - Palette 1-4')
ON CONFLICT (sku) DO UPDATE 
SET 
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  unit = EXCLUDED.unit,
  current_stock = EXCLUDED.current_stock,
  min_stock_level = EXCLUDED.min_stock_level,
  location_bin = EXCLUDED.location_bin,
  updated_at = NOW();