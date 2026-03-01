BEGIN;
-- ═══════════════════════════════════════════════════════
-- DEVICE CATALOG SEED DATA
-- Generated at 2026-03-01T03:38:38.371Z
-- ═══════════════════════════════════════════════════════

BEGIN;

-- Apple > iPhone 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 7', ARRAY['32GB','128GB','256GB'], ARRAY['2GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1F2020'),
  ((SELECT id FROM ins), 'Jet Black', '#1C1B1E'),
  ((SELECT id FROM ins), 'Silver', '#E4E4E2'),
  ((SELECT id FROM ins), 'Gold', '#FADCC2'),
  ((SELECT id FROM ins), 'Rose Gold', '#F7DDD5'),
  ((SELECT id FROM ins), 'Product Red', '#BF0013')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 7 Plus
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 7 Plus', ARRAY['32GB','128GB','256GB'], ARRAY['3GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1F2020'),
  ((SELECT id FROM ins), 'Jet Black', '#1C1B1E'),
  ((SELECT id FROM ins), 'Silver', '#E4E4E2'),
  ((SELECT id FROM ins), 'Gold', '#FADCC2'),
  ((SELECT id FROM ins), 'Rose Gold', '#F7DDD5'),
  ((SELECT id FROM ins), 'Product Red', '#BF0013')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone SE (1st generation)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone SE (1st generation)', ARRAY['16GB','32GB','64GB','128GB'], ARRAY['2GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Grey', '#272729'),
  ((SELECT id FROM ins), 'Silver', '#E4E4E2'),
  ((SELECT id FROM ins), 'Gold', '#FADCC2'),
  ((SELECT id FROM ins), 'Rose Gold', '#F7DDD5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 8', ARRAY['64GB','128GB','256GB'], ARRAY['2GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Grey', '#272729'),
  ((SELECT id FROM ins), 'Silver', '#E2E3E4'),
  ((SELECT id FROM ins), 'Gold', '#F7E8DD'),
  ((SELECT id FROM ins), 'Product Red', '#960111')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 8 Plus
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 8 Plus', ARRAY['64GB','128GB','256GB'], ARRAY['3GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Grey', '#272729'),
  ((SELECT id FROM ins), 'Silver', '#E2E3E4'),
  ((SELECT id FROM ins), 'Gold', '#F7E8DD'),
  ((SELECT id FROM ins), 'Product Red', '#960111')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone X
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone X', ARRAY['64GB','256GB'], ARRAY['3GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Grey', '#262529'),
  ((SELECT id FROM ins), 'Silver', '#E4E4E2')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone XR
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone XR', ARRAY['64GB','128GB','256GB'], ARRAY['3GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#2E3034'),
  ((SELECT id FROM ins), 'White', '#F3F3F3'),
  ((SELECT id FROM ins), 'Blue', '#48AEE6'),
  ((SELECT id FROM ins), 'Yellow', '#F9D045'),
  ((SELECT id FROM ins), 'Coral', '#FF6E5A'),
  ((SELECT id FROM ins), 'Product Red', '#B41325')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone XS
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone XS', ARRAY['64GB','256GB','512GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Grey', '#262529'),
  ((SELECT id FROM ins), 'Silver', '#E4E4E2'),
  ((SELECT id FROM ins), 'Gold', '#FADCC2')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone XS Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone XS Max', ARRAY['64GB','256GB','512GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Grey', '#262529'),
  ((SELECT id FROM ins), 'Silver', '#E4E4E2'),
  ((SELECT id FROM ins), 'Gold', '#FADCC2')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 11', ARRAY['64GB','128GB','256GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1F2020'),
  ((SELECT id FROM ins), 'White', '#F9F6EF'),
  ((SELECT id FROM ins), 'Green', '#AEE1CD'),
  ((SELECT id FROM ins), 'Yellow', '#FFE681'),
  ((SELECT id FROM ins), 'Purple', '#D1CDDA'),
  ((SELECT id FROM ins), 'Product Red', '#BA0C2E')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 11 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 11 Pro', ARRAY['64GB','256GB','512GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Green', '#4E5851'),
  ((SELECT id FROM ins), 'Space Grey', '#535150'),
  ((SELECT id FROM ins), 'Silver', '#EBEBE3'),
  ((SELECT id FROM ins), 'Gold', '#FAD7BD')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 11 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 11 Pro Max', ARRAY['64GB','256GB','512GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Green', '#4E5851'),
  ((SELECT id FROM ins), 'Space Grey', '#535150'),
  ((SELECT id FROM ins), 'Silver', '#EBEBE3'),
  ((SELECT id FROM ins), 'Gold', '#FAD7BD')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone SE (2nd generation)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone SE (2nd generation)', ARRAY['64GB','128GB','256GB'], ARRAY['3GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#262529'),
  ((SELECT id FROM ins), 'White', '#F3F3F3'),
  ((SELECT id FROM ins), 'Product Red', '#B41325')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 12 mini
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 12 mini', ARRAY['64GB','128GB','256GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#25212B'),
  ((SELECT id FROM ins), 'White', '#F6F2EF'),
  ((SELECT id FROM ins), 'Green', '#D8EFD5'),
  ((SELECT id FROM ins), 'Blue', '#023B63'),
  ((SELECT id FROM ins), 'Purple', '#B7AFE6'),
  ((SELECT id FROM ins), 'Product Red', '#D82E2E')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 12', ARRAY['64GB','128GB','256GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#25212B'),
  ((SELECT id FROM ins), 'White', '#F6F2EF'),
  ((SELECT id FROM ins), 'Green', '#D8EFD5'),
  ((SELECT id FROM ins), 'Blue', '#023B63'),
  ((SELECT id FROM ins), 'Purple', '#B7AFE6'),
  ((SELECT id FROM ins), 'Product Red', '#D82E2E')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 12 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 12 Pro', ARRAY['128GB','256GB','512GB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#52514D'),
  ((SELECT id FROM ins), 'Silver', '#E3E4DF'),
  ((SELECT id FROM ins), 'Gold', '#FCEBD3'),
  ((SELECT id FROM ins), 'Pacific Blue', '#2D4E5C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 12 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 12 Pro Max', ARRAY['128GB','256GB','512GB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#52514D'),
  ((SELECT id FROM ins), 'Silver', '#E3E4DF'),
  ((SELECT id FROM ins), 'Gold', '#FCEBD3'),
  ((SELECT id FROM ins), 'Pacific Blue', '#2D4E5C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 13 mini
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 13 mini', ARRAY['128GB','256GB','512GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight', '#232A31'),
  ((SELECT id FROM ins), 'Starlight', '#FAF6F2'),
  ((SELECT id FROM ins), 'Blue', '#276787'),
  ((SELECT id FROM ins), 'Pink', '#FADDD7'),
  ((SELECT id FROM ins), 'Green', '#394C38'),
  ((SELECT id FROM ins), 'Product Red', '#BF0013')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 13
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 13', ARRAY['128GB','256GB','512GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight', '#232A31'),
  ((SELECT id FROM ins), 'Starlight', '#FAF6F2'),
  ((SELECT id FROM ins), 'Blue', '#276787'),
  ((SELECT id FROM ins), 'Pink', '#FADDD7'),
  ((SELECT id FROM ins), 'Green', '#394C38'),
  ((SELECT id FROM ins), 'Product Red', '#BF0013')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 13 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 13 Pro', ARRAY['128GB','256GB','512GB','1TB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#54524F'),
  ((SELECT id FROM ins), 'Gold', '#FAE7CF'),
  ((SELECT id FROM ins), 'Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Sierra Blue', '#A7C1D9'),
  ((SELECT id FROM ins), 'Alpine Green', '#576856')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 13 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 13 Pro Max', ARRAY['128GB','256GB','512GB','1TB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#54524F'),
  ((SELECT id FROM ins), 'Gold', '#FAE7CF'),
  ((SELECT id FROM ins), 'Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Sierra Blue', '#A7C1D9'),
  ((SELECT id FROM ins), 'Alpine Green', '#576856')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 14
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 14', ARRAY['128GB','256GB','512GB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight', '#222930'),
  ((SELECT id FROM ins), 'Starlight', '#FAF6F2'),
  ((SELECT id FROM ins), 'Purple', '#E6DDEB'),
  ((SELECT id FROM ins), 'Yellow', '#F9E479'),
  ((SELECT id FROM ins), 'Blue', '#A0B4C7'),
  ((SELECT id FROM ins), 'Product Red', '#FC0324')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 14 Plus
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 14 Plus', ARRAY['128GB','256GB','512GB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight', '#222930'),
  ((SELECT id FROM ins), 'Starlight', '#FAF6F2'),
  ((SELECT id FROM ins), 'Purple', '#E6DDEB'),
  ((SELECT id FROM ins), 'Yellow', '#F9E479'),
  ((SELECT id FROM ins), 'Blue', '#A0B4C7'),
  ((SELECT id FROM ins), 'Product Red', '#FC0324')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 14 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 14 Pro', ARRAY['128GB','256GB','512GB','1TB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Black', '#403E3D'),
  ((SELECT id FROM ins), 'Silver', '#F0F2F2'),
  ((SELECT id FROM ins), 'Gold', '#F4E8CE'),
  ((SELECT id FROM ins), 'Deep Purple', '#594F63')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 14 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 14 Pro Max', ARRAY['128GB','256GB','512GB','1TB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Black', '#403E3D'),
  ((SELECT id FROM ins), 'Silver', '#F0F2F2'),
  ((SELECT id FROM ins), 'Gold', '#F4E8CE'),
  ((SELECT id FROM ins), 'Deep Purple', '#594F63')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone SE (3rd generation)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone SE (3rd generation)', ARRAY['64GB','128GB','256GB'], ARRAY['4GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight', '#232A31'),
  ((SELECT id FROM ins), 'Starlight', '#FAF6F2'),
  ((SELECT id FROM ins), 'Product Red', '#BF0013')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 15', ARRAY['128GB','256GB','512GB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#35393B'),
  ((SELECT id FROM ins), 'White', '#F5F5F5'),
  ((SELECT id FROM ins), 'Yellow', '#E5E0C1'),
  ((SELECT id FROM ins), 'Green', '#CAD4C5'),
  ((SELECT id FROM ins), 'Blue', '#CED5D9'),
  ((SELECT id FROM ins), 'Pink', '#E3C8CA')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 15 Plus
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 15 Plus', ARRAY['128GB','256GB','512GB'], ARRAY['6GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#35393B'),
  ((SELECT id FROM ins), 'White', '#F5F5F5'),
  ((SELECT id FROM ins), 'Yellow', '#E5E0C1'),
  ((SELECT id FROM ins), 'Green', '#CAD4C5'),
  ((SELECT id FROM ins), 'Blue', '#CED5D9'),
  ((SELECT id FROM ins), 'Pink', '#E3C8CA')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 15 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 15 Pro', ARRAY['128GB','256GB','512GB','1TB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black Titanium', '#1B1B1B'),
  ((SELECT id FROM ins), 'White Titanium', '#DDDDDD'),
  ((SELECT id FROM ins), 'Blue Titanium', '#2F4452'),
  ((SELECT id FROM ins), 'Natural Titanium', '#837F7D')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 15 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 15 Pro Max', ARRAY['256GB','512GB','1TB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black Titanium', '#1B1B1B'),
  ((SELECT id FROM ins), 'White Titanium', '#DDDDDD'),
  ((SELECT id FROM ins), 'Blue Titanium', '#2F4452'),
  ((SELECT id FROM ins), 'Natural Titanium', '#837F7D')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 16
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 16', ARRAY['128GB','256GB','512GB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#3C4042'),
  ((SELECT id FROM ins), 'White', '#FAFAFA'),
  ((SELECT id FROM ins), 'Pink', '#F2ADDA'),
  ((SELECT id FROM ins), 'Teal', '#B0D4D2'),
  ((SELECT id FROM ins), 'Ultramarine', '#9AADF6')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 16 Plus
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 16 Plus', ARRAY['128GB','256GB','512GB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#3C4042'),
  ((SELECT id FROM ins), 'White', '#FAFAFA'),
  ((SELECT id FROM ins), 'Pink', '#F2ADDA'),
  ((SELECT id FROM ins), 'Teal', '#B0D4D2'),
  ((SELECT id FROM ins), 'Ultramarine', '#9AADF6')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 16 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 16 Pro', ARRAY['128GB','256GB','512GB','1TB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black Titanium', '#3C3C3D'),
  ((SELECT id FROM ins), 'White Titanium', '#F2F1ED'),
  ((SELECT id FROM ins), 'Natural Titanium', '#C2BCB2'),
  ((SELECT id FROM ins), 'Desert Titanium', '#BFA48F')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 16 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 16 Pro Max', ARRAY['256GB','512GB','1TB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black Titanium', '#3C3C3D'),
  ((SELECT id FROM ins), 'White Titanium', '#F2F1ED'),
  ((SELECT id FROM ins), 'Natural Titanium', '#C2BCB2'),
  ((SELECT id FROM ins), 'Desert Titanium', '#BFA48F')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 17
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 17', ARRAY['256GB','512GB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#353839'),
  ((SELECT id FROM ins), 'Lavender', '#DFCEEA'),
  ((SELECT id FROM ins), 'Mist Blue', '#96AED1'),
  ((SELECT id FROM ins), 'Sage', '#A9B689'),
  ((SELECT id FROM ins), 'White', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 17 Air
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 17 Air', ARRAY['256GB','512GB'], ARRAY['8GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sky Blue', '#F0F9FF'),
  ((SELECT id FROM ins), 'Light Gold', '#FFFCF5'),
  ((SELECT id FROM ins), 'Space Black', '#000000'),
  ((SELECT id FROM ins), 'Cloud White', '#FCFCFC')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 17 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 17 Pro', ARRAY['256GB','512GB','1TB'], ARRAY['12GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Deep Blue', '#32374A'),
  ((SELECT id FROM ins), 'Cosmic Orange', '#F77E2D'),
  ((SELECT id FROM ins), 'Silver', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Apple > iPhone 17 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 17 Pro Max', ARRAY['256GB','512GB','1TB'], ARRAY['12GB'])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Deep Blue', '#32374A'),
  ((SELECT id FROM ins), 'Cosmic Orange', '#F77E2D'),
  ((SELECT id FROM ins), 'Silver', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;
COMMIT;
