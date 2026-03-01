-- ═══════════════════════════════════════════════════════
-- DEVICE CATALOG SEED DATA
-- Generated at 2026-03-01T10:21:52.264Z
-- ═══════════════════════════════════════════════════════

BEGIN;

-- Apple > iPhone 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Apple', 'iPhone 7', ARRAY['32GB','128GB','256GB']::text[], ARRAY['2GB']::text[])
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
  VALUES ('Apple', 'iPhone 7 Plus', ARRAY['32GB','128GB','256GB']::text[], ARRAY['3GB']::text[])
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
  VALUES ('Apple', 'iPhone SE (1st generation)', ARRAY['16GB','32GB','64GB','128GB']::text[], ARRAY['2GB']::text[])
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
  VALUES ('Apple', 'iPhone 8', ARRAY['64GB','128GB','256GB']::text[], ARRAY['2GB']::text[])
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
  VALUES ('Apple', 'iPhone 8 Plus', ARRAY['64GB','128GB','256GB']::text[], ARRAY['3GB']::text[])
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
  VALUES ('Apple', 'iPhone X', ARRAY['64GB','256GB']::text[], ARRAY['3GB']::text[])
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
  VALUES ('Apple', 'iPhone XR', ARRAY['64GB','128GB','256GB']::text[], ARRAY['3GB']::text[])
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
  VALUES ('Apple', 'iPhone XS', ARRAY['64GB','256GB','512GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone XS Max', ARRAY['64GB','256GB','512GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 11', ARRAY['64GB','128GB','256GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 11 Pro', ARRAY['64GB','256GB','512GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 11 Pro Max', ARRAY['64GB','256GB','512GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone SE (2nd generation)', ARRAY['64GB','128GB','256GB']::text[], ARRAY['3GB']::text[])
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
  VALUES ('Apple', 'iPhone 12 mini', ARRAY['64GB','128GB','256GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 12', ARRAY['64GB','128GB','256GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 12 Pro', ARRAY['128GB','256GB','512GB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 12 Pro Max', ARRAY['128GB','256GB','512GB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 13 mini', ARRAY['128GB','256GB','512GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 13', ARRAY['128GB','256GB','512GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 13 Pro', ARRAY['128GB','256GB','512GB','1TB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 13 Pro Max', ARRAY['128GB','256GB','512GB','1TB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 14', ARRAY['128GB','256GB','512GB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 14 Plus', ARRAY['128GB','256GB','512GB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 14 Pro', ARRAY['128GB','256GB','512GB','1TB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 14 Pro Max', ARRAY['128GB','256GB','512GB','1TB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone SE (3rd generation)', ARRAY['64GB','128GB','256GB']::text[], ARRAY['4GB']::text[])
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
  VALUES ('Apple', 'iPhone 15', ARRAY['128GB','256GB','512GB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 15 Plus', ARRAY['128GB','256GB','512GB']::text[], ARRAY['6GB']::text[])
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
  VALUES ('Apple', 'iPhone 15 Pro', ARRAY['128GB','256GB','512GB','1TB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 15 Pro Max', ARRAY['256GB','512GB','1TB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 16', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 16 Plus', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 16 Pro', ARRAY['128GB','256GB','512GB','1TB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 16 Pro Max', ARRAY['256GB','512GB','1TB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 17', ARRAY['256GB','512GB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 17 Air', ARRAY['256GB','512GB']::text[], ARRAY['8GB']::text[])
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
  VALUES ('Apple', 'iPhone 17 Pro', ARRAY['256GB','512GB','1TB']::text[], ARRAY['12GB']::text[])
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
  VALUES ('Apple', 'iPhone 17 Pro Max', ARRAY['256GB','512GB','1TB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Deep Blue', '#32374A'),
  ((SELECT id FROM ins), 'Cosmic Orange', '#F77E2D'),
  ((SELECT id FROM ins), 'Silver', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S7', ARRAY['32GB','64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black Onyx', '#1C1C1C'),
  ((SELECT id FROM ins), 'Silver Titanium', '#C4C4C4'),
  ((SELECT id FROM ins), 'Gold Platinum', '#C9B97A'),
  ((SELECT id FROM ins), 'Blue Coral', '#5B8EA6')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S7 edge
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S7 edge', ARRAY['32GB','64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black Onyx', '#1C1C1C'),
  ((SELECT id FROM ins), 'Silver Titanium', '#C4C4C4'),
  ((SELECT id FROM ins), 'Gold Platinum', '#C9B97A'),
  ((SELECT id FROM ins), 'Blue Coral', '#5B8EA6')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S8', ARRAY['64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1C1C1C'),
  ((SELECT id FROM ins), 'Maple Gold', '#C5A87C'),
  ((SELECT id FROM ins), 'Orchid Gray', '#BAB0C0'),
  ((SELECT id FROM ins), 'Arctic Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Coral Blue', '#6590A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S8+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S8+', ARRAY['64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1C1C1C'),
  ((SELECT id FROM ins), 'Maple Gold', '#C5A87C'),
  ((SELECT id FROM ins), 'Orchid Gray', '#BAB0C0'),
  ((SELECT id FROM ins), 'Arctic Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Coral Blue', '#6590A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S9', ARRAY['64GB','128GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1C1C1C'),
  ((SELECT id FROM ins), 'Coral Blue', '#596C8C'),
  ((SELECT id FROM ins), 'Lilac Purple', '#8F6A8C'),
  ((SELECT id FROM ins), 'Sunrise Gold', '#BF957F'),
  ((SELECT id FROM ins), 'Ice Blue', '#A8BECF')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S9+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S9+', ARRAY['64GB','128GB','256GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1C1C1C'),
  ((SELECT id FROM ins), 'Coral Blue', '#596C8C'),
  ((SELECT id FROM ins), 'Lilac Purple', '#8F6A8C'),
  ((SELECT id FROM ins), 'Sunrise Gold', '#BF957F'),
  ((SELECT id FROM ins), 'Ice Blue', '#A8BECF')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S10e
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S10e', ARRAY['128GB','256GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Prism White', '#F0EDE8'),
  ((SELECT id FROM ins), 'Prism Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Prism Green', '#B8D4C4'),
  ((SELECT id FROM ins), 'Prism Blue', '#7090B0'),
  ((SELECT id FROM ins), 'Canary Yellow', '#E8D870'),
  ((SELECT id FROM ins), 'Flamingo Pink', '#E8B0B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S10', ARRAY['128GB','512GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Prism White', '#F0EDE8'),
  ((SELECT id FROM ins), 'Prism Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Prism Green', '#B8D4C4'),
  ((SELECT id FROM ins), 'Prism Blue', '#7090B0'),
  ((SELECT id FROM ins), 'Cardinal Red', '#7A1A20'),
  ((SELECT id FROM ins), 'Flamingo Pink', '#E8B0B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S10+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S10+', ARRAY['128GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Prism White', '#F0EDE8'),
  ((SELECT id FROM ins), 'Prism Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Prism Green', '#B8D4C4'),
  ((SELECT id FROM ins), 'Prism Blue', '#7090B0'),
  ((SELECT id FROM ins), 'Cardinal Red', '#7A1A20'),
  ((SELECT id FROM ins), 'Ceramic White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Ceramic Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S10 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S10 5G', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Crown Silver', '#C8C8C4'),
  ((SELECT id FROM ins), 'Majestic Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Royal Gold', '#C0A870')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S20
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S20', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Grey', '#9A9A9C'),
  ((SELECT id FROM ins), 'Cosmic Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cloud Blue', '#AABCCC'),
  ((SELECT id FROM ins), 'Cloud Pink', '#E8C0C8'),
  ((SELECT id FROM ins), 'Cloud White', '#F8F8F0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S20+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S20+', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Grey', '#9A9A9C'),
  ((SELECT id FROM ins), 'Cosmic Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cloud Blue', '#AABCCC'),
  ((SELECT id FROM ins), 'Cloud Pink', '#E8C0C8'),
  ((SELECT id FROM ins), 'Cloud White', '#F8F8F0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S20 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S20 Ultra', ARRAY['128GB','256GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cosmic Grey', '#9A9A9C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S20 FE
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S20 FE', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cloud White', '#F8F8F0'),
  ((SELECT id FROM ins), 'Cloud Blue', '#AABCCC'),
  ((SELECT id FROM ins), 'Cloud Red', '#C03830'),
  ((SELECT id FROM ins), 'Cloud Lavender', '#D4C0D8'),
  ((SELECT id FROM ins), 'Cloud Mint', '#A8CCC0'),
  ((SELECT id FROM ins), 'Cloud Navy', '#2A3848'),
  ((SELECT id FROM ins), 'Cloud Orange', '#E89060')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S21
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S21', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Gray', '#4A4C50'),
  ((SELECT id FROM ins), 'Phantom White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Phantom Violet', '#9070A8'),
  ((SELECT id FROM ins), 'Phantom Pink', '#D8A8B8'),
  ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S21+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S21+', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Phantom Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Phantom Violet', '#9070A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S21 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S21 Ultra', ARRAY['128GB','256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Phantom Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Phantom Titanium', '#8A8A8C'),
  ((SELECT id FROM ins), 'Phantom Navy', '#2A3A50'),
  ((SELECT id FROM ins), 'Phantom Brown', '#7A5A48')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S21 FE
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S21 FE', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Olive', '#707A5A'),
  ((SELECT id FROM ins), 'Lavender', '#C0B0D8'),
  ((SELECT id FROM ins), 'White', '#F0F0EE')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S22
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S22', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Phantom White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Green', '#405848'),
  ((SELECT id FROM ins), 'Pink Gold', '#C8A090'),
  ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Bora Purple', '#7058A0'),
  ((SELECT id FROM ins), 'Sky Blue', '#A0B8D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S22+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S22+', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Phantom White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Green', '#405848'),
  ((SELECT id FROM ins), 'Pink Gold', '#C8A090'),
  ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Bora Purple', '#7058A0'),
  ((SELECT id FROM ins), 'Sky Blue', '#A0B8D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S22 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S22 Ultra', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Phantom White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Burgundy', '#6A2030'),
  ((SELECT id FROM ins), 'Green', '#405848'),
  ((SELECT id FROM ins), 'Sky Blue', '#A0B8D0'),
  ((SELECT id FROM ins), 'Red', '#A02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S23
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S23', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Green', '#405848'),
  ((SELECT id FROM ins), 'Lavender', '#C0B0D8'),
  ((SELECT id FROM ins), 'Lime', '#D0D898'),
  ((SELECT id FROM ins), 'Sky Blue', '#A0B8D0'),
  ((SELECT id FROM ins), 'Red', '#A02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S23+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S23+', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Green', '#405848'),
  ((SELECT id FROM ins), 'Lavender', '#C0B0D8'),
  ((SELECT id FROM ins), 'Lime', '#D0D898'),
  ((SELECT id FROM ins), 'Sky Blue', '#A0B8D0'),
  ((SELECT id FROM ins), 'Red', '#A02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S23 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S23 Ultra', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Green', '#405848'),
  ((SELECT id FROM ins), 'Lavender', '#C0B0D8'),
  ((SELECT id FROM ins), 'Sky Blue', '#A0B8D0'),
  ((SELECT id FROM ins), 'Lime', '#D0D898'),
  ((SELECT id FROM ins), 'Red', '#A02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S23 FE
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S23 FE', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Lavender', '#C0B0D8'),
  ((SELECT id FROM ins), 'Mint', '#A8CCC0'),
  ((SELECT id FROM ins), 'Indigo', '#404878'),
  ((SELECT id FROM ins), 'Tangerine', '#D87040')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S24
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S24', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Onyx Black', '#2E2E30'),
  ((SELECT id FROM ins), 'Marble Gray', '#D0CEC8'),
  ((SELECT id FROM ins), 'Cobalt Violet', '#6858A0'),
  ((SELECT id FROM ins), 'Amber Yellow', '#D8C870')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S24+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S24+', ARRAY['256GB','512GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Onyx Black', '#2E2E30'),
  ((SELECT id FROM ins), 'Marble Gray', '#D0CEC8'),
  ((SELECT id FROM ins), 'Cobalt Violet', '#6858A0'),
  ((SELECT id FROM ins), 'Amber Yellow', '#D8C870')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S24 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S24 Ultra', ARRAY['256GB','512GB','1TB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Titanium Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Titanium Gray', '#8A8A8C'),
  ((SELECT id FROM ins), 'Titanium Violet', '#5A4878'),
  ((SELECT id FROM ins), 'Titanium Yellow', '#C8B050')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S24 FE
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S24 FE', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#5878A0'),
  ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Gray', '#9A9A9C'),
  ((SELECT id FROM ins), 'Mint', '#A8CCC0'),
  ((SELECT id FROM ins), 'Yellow', '#D8C870')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S25
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S25', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Icy Blue', '#C0D0DC'),
  ((SELECT id FROM ins), 'Mint', '#A8CCC0'),
  ((SELECT id FROM ins), 'Navy', '#283448'),
  ((SELECT id FROM ins), 'Silver Shadow', '#B8B8BC')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S25+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S25+', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Icy Blue', '#C0D0DC'),
  ((SELECT id FROM ins), 'Mint', '#A8CCC0'),
  ((SELECT id FROM ins), 'Navy', '#283448'),
  ((SELECT id FROM ins), 'Silver Shadow', '#B8B8BC')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S25 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S25 Ultra', ARRAY['256GB','512GB','1TB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Titanium Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Titanium Silver Blue', '#A8B8C8'),
  ((SELECT id FROM ins), 'Titanium White Silver', '#E8E8E4'),
  ((SELECT id FROM ins), 'Titanium Gray', '#8A8A8C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S25 Edge
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S25 Edge', ARRAY['256GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Titanium Icy Blue', '#A8C0D0'),
  ((SELECT id FROM ins), 'Titanium Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Titanium Jet Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S25 FE
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S25 FE', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Jet Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Icy Blue', '#B8CCD8'),
  ((SELECT id FROM ins), 'Navy', '#283448'),
  ((SELECT id FROM ins), 'White', '#F8F8F8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S26
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S26', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Sky Blue', '#A8C0D8'),
  ((SELECT id FROM ins), 'Cobalt Violet', '#504080')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S26+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S26+', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Sky Blue', '#A8C0D8'),
  ((SELECT id FROM ins), 'Cobalt Violet', '#504080')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy S26 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S26 Ultra', ARRAY['256GB','512GB','1TB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Sky Blue', '#A8C0D8'),
  ((SELECT id FROM ins), 'Cobalt Violet', '#504080')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Note8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Note8', ARRAY['64GB','128GB','256GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1C1C1C'),
  ((SELECT id FROM ins), 'Maple Gold', '#C5A87C'),
  ((SELECT id FROM ins), 'Deepsea Blue', '#1E2E58'),
  ((SELECT id FROM ins), 'Orchid Gray', '#BAB0C0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Note9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Note9', ARRAY['128GB','512GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ocean Blue', '#3A5878'),
  ((SELECT id FROM ins), 'Lavender Purple', '#8A68A8'),
  ((SELECT id FROM ins), 'Metallic Copper', '#B87848'),
  ((SELECT id FROM ins), 'Midnight Black', '#1C1C1C'),
  ((SELECT id FROM ins), 'Cloud Silver', '#C8C8C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Note10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Note10', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aura Glow', '#D8D4D0'),
  ((SELECT id FROM ins), 'Aura White', '#F0EEE8'),
  ((SELECT id FROM ins), 'Aura Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Aura Red', '#8A2020'),
  ((SELECT id FROM ins), 'Aura Pink', '#D8A8B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Note10+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Note10+', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aura Glow', '#D8D4D0'),
  ((SELECT id FROM ins), 'Aura White', '#F0EEE8'),
  ((SELECT id FROM ins), 'Aura Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Aura Red', '#8A2020'),
  ((SELECT id FROM ins), 'Aura Blue', '#3858A0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Note20
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Note20', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Gray', '#6E6E70'),
  ((SELECT id FROM ins), 'Mystic Bronze', '#8A6248'),
  ((SELECT id FROM ins), 'Mystic Green', '#3A5040'),
  ((SELECT id FROM ins), 'Mystic White', '#F0EEE8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Note20 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Note20 Ultra', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Mystic White', '#F0EEE8'),
  ((SELECT id FROM ins), 'Mystic Bronze', '#8A6248'),
  ((SELECT id FROM ins), 'Mystic Red', '#882030'),
  ((SELECT id FROM ins), 'Mystic Blue', '#3050A0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Fold3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Fold3', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Phantom Green', '#3A5040'),
  ((SELECT id FROM ins), 'Phantom Silver', '#C8C8C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Fold4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Fold4', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Burgundy', '#6A2030'),
  ((SELECT id FROM ins), 'Gray Green', '#687870'),
  ((SELECT id FROM ins), 'Beige', '#E8E0C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Fold5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Fold5', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Icy Blue', '#B8CCD8'),
  ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Fold6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Fold6', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Silver Shadow', '#B8B8BC'),
  ((SELECT id FROM ins), 'Pink', '#E8C0C8'),
  ((SELECT id FROM ins), 'Navy', '#283448')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Fold7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Fold7', ARRAY['256GB','512GB','1TB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue Shadow', '#3A5878'),
  ((SELECT id FROM ins), 'Jet Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Silver Shadow', '#B8B8BC')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Flip3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Flip3', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Lavender', '#C0B0D8'),
  ((SELECT id FROM ins), 'Green', '#3A5040'),
  ((SELECT id FROM ins), 'Pink', '#D8A8B8'),
  ((SELECT id FROM ins), 'White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Gray', '#6E6E70')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Flip4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Flip4', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Bora Purple', '#7058A0'),
  ((SELECT id FROM ins), 'Pink Gold', '#D8A898'),
  ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Blue', '#4870A0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Flip5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Flip5', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#A8CCC0'),
  ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Cream', '#EEE8D8'),
  ((SELECT id FROM ins), 'Lavender', '#C0B0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Flip6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Flip6', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Mint', '#A8CCC0'),
  ((SELECT id FROM ins), 'Silver Shadow', '#B8B8BC'),
  ((SELECT id FROM ins), 'Yellow', '#D8C870')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Flip7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Flip7', ARRAY['256GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue Shadow', '#3A5878'),
  ((SELECT id FROM ins), 'Jet Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Coral Red', '#C84848')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy Z Flip7 FE
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy Z Flip7 FE', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F8F8F8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A5 (2016)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A5 (2016)', ARRAY['16GB','32GB']::text[], ARRAY['2GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Gold', '#C8A870'),
  ((SELECT id FROM ins), 'Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Pink', '#D8A8B8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A7 (2016)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A7 (2016)', ARRAY['16GB','32GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Gold', '#C8A870'),
  ((SELECT id FROM ins), 'Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'White', '#F0F0EE')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A5 (2017)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A5 (2017)', ARRAY['32GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Peach Cloud', '#E8C0A8'),
  ((SELECT id FROM ins), 'Midnight Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue Mist', '#9090C0'),
  ((SELECT id FROM ins), 'Gold Sand', '#D8C090'),
  ((SELECT id FROM ins), 'Orchid Gray', '#BAB0C0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A7 (2017)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A7 (2017)', ARRAY['32GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Peach Cloud', '#E8C0A8'),
  ((SELECT id FROM ins), 'Midnight Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue Mist', '#9090C0'),
  ((SELECT id FROM ins), 'Gold Sand', '#D8C090')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A8 (2018)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A8 (2018)', ARRAY['32GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Orchid Gray', '#BAB0C0'),
  ((SELECT id FROM ins), 'Gold', '#C8A870'),
  ((SELECT id FROM ins), 'Blue', '#4870A0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A9 (2018)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A9 (2018)', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Caviar Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Lemonade Blue', '#78A8D0'),
  ((SELECT id FROM ins), 'Bubblegum Pink', '#E8A0B8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A50
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A50', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Coral', '#E08070')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A50s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A50s', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Prism Crush Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Prism Crush White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Prism Crush Violet', '#9070B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A70
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A70', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Coral', '#E08070')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A80
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A80', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Angel Gold', '#D8C080'),
  ((SELECT id FROM ins), 'Ghost White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Phantom Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A51
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A51', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Prism Crush Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Prism Crush White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Prism Crush Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Prism Crush Pink', '#E8A0B8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A51 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A51 5G', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Prism Cube Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Prism Cube White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Prism Cube Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Prism Cube Pink', '#E8A0B8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A71
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A71', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Prism Crush Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Prism Crush Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Prism Crush Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Prism Crush Pink', '#E8A0B8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A52
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A52', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Awesome Violet', '#9070B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A52s 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A52s 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Awesome Violet', '#9070B0'),
  ((SELECT id FROM ins), 'Awesome Mint', '#A8CCC0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A72
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A72', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Awesome Violet', '#9070B0'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A53 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A53 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Awesome Orange', '#D88050'),
  ((SELECT id FROM ins), 'Awesome Peach', '#E8C0A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A33 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A33 5G', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Awesome Light Green', '#A8C8B0'),
  ((SELECT id FROM ins), 'Awesome Peach', '#E8C0A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A54 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A54 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Awesome Lime', '#C8D880'),
  ((SELECT id FROM ins), 'Awesome Violet', '#9070B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A55 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A55 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Navy', '#283448'),
  ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome Iceblue', '#B8CCD8'),
  ((SELECT id FROM ins), 'Awesome Lilac', '#C0B0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A56 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A56 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Awesome Light Green', '#A8C8B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A36 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A36 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Awesome Lilac', '#C0B0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A26 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A26 5G', ARRAY['128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Awesome Blue', '#4870A0'),
  ((SELECT id FROM ins), 'Awesome Lilac', '#C0B0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy A16 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy A16 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Gold', '#C8A870'),
  ((SELECT id FROM ins), 'Light Blue', '#A8C0D8'),
  ((SELECT id FROM ins), 'Light Green', '#A8C8B0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M10', ARRAY['16GB','32GB']::text[], ARRAY['2GB','3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Charcoal Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Ocean Blue', '#2A5878')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M20
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M20', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ocean Blue', '#2A5878'),
  ((SELECT id FROM ins), 'Charcoal Black', '#2A2A2C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M30
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M30', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gradation Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Gradation Blue', '#2A5878')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M40
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M40', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Blue', '#1E2A40'),
  ((SELECT id FROM ins), 'Seawater Blue', '#305878'),
  ((SELECT id FROM ins), 'Midnight Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M10s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M10s', ARRAY['32GB','64GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Charcoal Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Opal Blue', '#80A8C0'),
  ((SELECT id FROM ins), 'Opal Green', '#80A878')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M30s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M30s', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Pearl White', '#F0EEE8'),
  ((SELECT id FROM ins), 'Sapphire Blue', '#284878'),
  ((SELECT id FROM ins), 'Opal Black', '#2A2A2C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M01
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M01', ARRAY['32GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Charcoal Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Smoky Blue', '#5A7A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M01s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M01s', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Persian Blue', '#2A5A8A'),
  ((SELECT id FROM ins), 'Soft Pink', '#F0C0C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M11', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Blue', '#1E2A40'),
  ((SELECT id FROM ins), 'Metallic Silver', '#C0C0C0'),
  ((SELECT id FROM ins), 'Charcoal Black', '#2A2A2C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M21
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M21', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Blue', '#1E2A40'),
  ((SELECT id FROM ins), 'Raven Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Iceberg Blue', '#90B0C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M21s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M21s', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Charcoal Black', '#2A2A2C'),
  ((SELECT id FROM ins), 'Metallic Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Mirage Blue', '#2A4A7A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M31
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M31', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Ocean Blue', '#2A5878'),
  ((SELECT id FROM ins), 'Red', '#A02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M31s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M31s', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mirage Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Mirage Blue', '#2A4878'),
  ((SELECT id FROM ins), 'Mirage White', '#F0EEE8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M51
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M51', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Mystic Silver', '#C8C8C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M02s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M02s', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M02
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M02', ARRAY['32GB']::text[], ARRAY['2GB','3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Gray', '#6E6E70'),
  ((SELECT id FROM ins), 'Red', '#A02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M12', ARRAY['32GB','64GB','128GB']::text[], ARRAY['3GB','4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F0F0EE'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Green', '#384A38')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M32
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M32', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Awesome Violet', '#7A5A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M32 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M32 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Awesome Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Awesome Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Awesome Violet', '#7A5A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M22 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M22 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Purple', '#9B7EB8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M52 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M52 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Icy Blue', '#B8CCD8'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'White', '#F0F0EE')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M23 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M23 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Deep Green', '#283A28'),
  ((SELECT id FROM ins), 'Pink Gold', '#D8A898'),
  ((SELECT id FROM ins), 'Light Blue', '#90B0C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M33 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M33 5G', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Blue', '#1E2A40'),
  ((SELECT id FROM ins), 'Deep Sea Blue', '#2A5878'),
  ((SELECT id FROM ins), 'Emerald Brown', '#504030'),
  ((SELECT id FROM ins), 'Brown', '#704830')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M34 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M34 5G', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Blue', '#1E2A40'),
  ((SELECT id FROM ins), 'Icy Blue', '#B8CCD8'),
  ((SELECT id FROM ins), 'Waterfall Blue', '#4878A0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M13 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M13 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Blue', '#1E2A40'),
  ((SELECT id FROM ins), 'Aqua Green', '#50A898'),
  ((SELECT id FROM ins), 'Stardust Brown', '#605040')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M04 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M04 5G', ARRAY['64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M14 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M14 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Arctic Blue', '#90B0C8'),
  ((SELECT id FROM ins), 'Berry Blue', '#5060A8'),
  ((SELECT id FROM ins), 'Smoky Teal', '#384848')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M25 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M25 5G', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Deep Sea Blue', '#2A5878'),
  ((SELECT id FROM ins), 'Haze Purple', '#706090'),
  ((SELECT id FROM ins), 'Sabrina Blue', '#4060A0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M35 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M35 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Icy Blue', '#B8CCD8'),
  ((SELECT id FROM ins), 'Light Violet', '#C0B0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M54 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M54 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Blue', '#1E2A40'),
  ((SELECT id FROM ins), 'Awesome Graphite', '#4A4C50'),
  ((SELECT id FROM ins), 'Awesome Iceblue', '#B8CCD8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M55 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M55 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M55s 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M55s 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M56 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M56 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M06 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M06 5G', ARRAY['128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M16 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M16 5G', ARRAY['128GB','256GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M36 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M36 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M57 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M57 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M67 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M67 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M17 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M17 5G', ARRAY['128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M27 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M27 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M37 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M37 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M58 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M58 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M59 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M59 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M69 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M69 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M18 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M18 5G', ARRAY['128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M28 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M28 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M38 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M38 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#3A6A9A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M50 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M50 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M51 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M51 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M53 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M53 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M60 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M60 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M61 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M61 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M62 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M62 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M63 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M63 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M64 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M64 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M65 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M65 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M66 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M66 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Samsung > Galaxy M68 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy M68 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1C'),
  ((SELECT id FROM ins), 'Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 4', ARRAY['16GB','32GB','64GB']::text[], ARRAY['2GB','3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Gold', '#C8A870')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 5', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A'),
  ((SELECT id FROM ins), 'Rose Gold', '#E8C0A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 5 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 5 Pro', ARRAY['64GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Gray', '#7A7A7A'),
  ((SELECT id FROM ins), 'Red', '#C02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 6 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 6 Pro', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A'),
  ((SELECT id FROM ins), 'Rose Gold', '#E8C0A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 7', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Red', '#C02020'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A'),
  ((SELECT id FROM ins), 'Neptune Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 7 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 7 Pro', ARRAY['64GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Red', '#C02020'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A'),
  ((SELECT id FROM ins), 'Neptune Blue', '#3A6A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 8', ARRAY['64GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Purple', '#7A5A9A'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A'),
  ((SELECT id FROM ins), 'Green', '#3A7A5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 8 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 8 Pro', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Purple', '#7A5A9A'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A'),
  ((SELECT id FROM ins), 'Green', '#3A7A5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 9', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Lake Green', '#5A9A7A'),
  ((SELECT id FROM ins), 'Interstellar Gray', '#6A6A7A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 9 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 9 Pro', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aurora Green', '#3A8A7A'),
  ((SELECT id FROM ins), 'Interstellar Gray', '#6A6A7A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 9S / 9 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 9S / 9 Pro', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aurora Green', '#3A8A7A'),
  ((SELECT id FROM ins), 'Interstellar Gray', '#6A6A7A'),
  ((SELECT id FROM ins), 'Ocean Blue', '#1A5A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 10', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Shadow Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Pebble White', '#F0EEE8'),
  ((SELECT id FROM ins), 'Grape Green', '#5A7A5A'),
  ((SELECT id FROM ins), 'Ocean Blue', '#1A5A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 10 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 10 Pro', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Shadow Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Glacier Blue', '#5A8AB0'),
  ((SELECT id FROM ins), 'Velvet Red', '#8A2030')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 10S
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 10S', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Shadow Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Frost White', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 11', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite Gray', '#4A4A4A'),
  ((SELECT id FROM ins), 'Pebble White', '#F0EEE8'),
  ((SELECT id FROM ins), 'Ocean Blue', '#1A5A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 11 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 11 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Mirror Purple', '#8A70A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 11S
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 11S', ARRAY['64GB','128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite Gray', '#4A4A4A'),
  ((SELECT id FROM ins), 'Silver', '#C8C8C8'),
  ((SELECT id FROM ins), 'Smoke Blue', '#5A7A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 12', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ice Blue', '#A8CCE0'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Lime Green', '#8AC840')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 12 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 12 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Lime Green', '#8AC840')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 12S
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 12S', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Sky Blue', '#7AB0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 12 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 12 Pro+', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Lime Green', '#8AC840')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 13
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 13', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Transparent Gray', '#7A7A8A'),
  ((SELECT id FROM ins), 'Lime Green', '#8AC840'),
  ((SELECT id FROM ins), 'Midnight Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 13 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 13 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lime Green', '#8AC840'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Mint', '#8AC8A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 13 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 13 Pro+', ARRAY['256GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lime Green', '#8AC840'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 14 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 14 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Aurora Green', '#3A8A7A'),
  ((SELECT id FROM ins), 'Sky Blue', '#7AB0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 14 Pro 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 14 Pro 5G', ARRAY['256GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aurora Green', '#3A8A7A'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 14 Pro+ 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 14 Pro+ 5G', ARRAY['256GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aurora Green', '#3A8A7A'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi Note 15 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi Note 15 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Lime Green', '#8AC840')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 9', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aqua Green', '#5AB8A8'),
  ((SELECT id FROM ins), 'Storm Blue', '#3A5A8A'),
  ((SELECT id FROM ins), 'Shadow Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 10', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Shadow Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Ocean Blue', '#1A5A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 11 Prime
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 11 Prime', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Aqua Green', '#5AB8A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 12', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Blue', '#5A8AB0'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Lime Green', '#8AC840')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 12C
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 12C', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Aqua Green', '#5AB8A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 13C
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 13C', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aqua Green', '#5AB8A8'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 12 Prime
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 12 Prime', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Aqua Blue', '#5AB8C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 13C 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 13C 5G', ARRAY['64GB','128GB','256GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Aqua', '#5AB8C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 14C 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 14C 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Aqua', '#5AB8C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi A2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi A2', ARRAY['32GB']::text[], ARRAY['2GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Sea Blue', '#3A6A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi A2+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi A2+', ARRAY['32GB']::text[], ARRAY['2GB','3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Sea Blue', '#3A6A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi A3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi A3', ARRAY['32GB','64GB']::text[], ARRAY['2GB','3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Sky Blue', '#7AB0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 14 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 14 5G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Sky Blue', '#7AB0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi 14 Pro 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi 14 Pro 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite', '#4A4A4A'),
  ((SELECT id FROM ins), 'Lime Green', '#8AC840')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi TWS 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi TWS 3', ARRAY[]::text[], ARRAY[]::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'White', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 9T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 9T', ARRAY['64GB','128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite Black', '#2A2A2A'),
  ((SELECT id FROM ins), 'Ruby Red', '#9A1020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 9T Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 9T Pro', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Carbon Black', '#2A2A2A'),
  ((SELECT id FROM ins), 'Ruby Red', '#9A1020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 10', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Pearl White', '#F5F5EE'),
  ((SELECT id FROM ins), 'Twilight Grey', '#5A5A6A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 11', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#1A1A2A'),
  ((SELECT id FROM ins), 'Glacier Blue', '#5A8AB0'),
  ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 11 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 11 Ultra', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ceramic White', '#F8F8F8'),
  ((SELECT id FROM ins), 'Ceramic Black', '#2A2A2A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 12', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Warm Black', '#2A2020'),
  ((SELECT id FROM ins), 'Sky Blue', '#7AB0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 13
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 13', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Green', '#3A7A5A'),
  ((SELECT id FROM ins), 'Purple', '#7A5A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 13 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 13 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Green', '#3A7A5A'),
  ((SELECT id FROM ins), 'White', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 14
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 14', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Moonstone Black', '#2A2A3A'),
  ((SELECT id FROM ins), 'Winter White', '#F0F0F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 14 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 14 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Moonstone Black', '#2A2A3A'),
  ((SELECT id FROM ins), 'Winter White', '#F0F0F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 15', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Jade Green', '#3A8A6A'),
  ((SELECT id FROM ins), 'Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Mi 16
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Mi 16', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Titanium Gray', '#7A7A7A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K20
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K20', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Flame Red', '#C02020'),
  ((SELECT id FROM ins), 'Ice Blue', '#A8CCE0'),
  ((SELECT id FROM ins), 'Onyx Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K20 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K20 Pro', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Flame Orange', '#D85020'),
  ((SELECT id FROM ins), 'Glacier Blue', '#5A8AB0'),
  ((SELECT id FROM ins), 'Carbon Black', '#2A2A2A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K30
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K30', ARRAY['64GB','128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Polar White', '#F0F0F0'),
  ((SELECT id FROM ins), 'Space Gray', '#5A5A5A'),
  ((SELECT id FROM ins), 'Deep Purple', '#4A3A6A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K30 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K30 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Polar White', '#F0F0F0'),
  ((SELECT id FROM ins), 'Space Gray', '#5A5A5A'),
  ((SELECT id FROM ins), 'Deep Purple', '#4A3A6A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K30 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K30 Pro', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Onyx Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Lunar Frost', '#E8EAEC')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K30 Ultra / K30S Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K30 Ultra / K30S Ultra', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Frosty White', '#F0F0F0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K40
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K40', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Happy 150', '#5A8AC8'),
  ((SELECT id FROM ins), 'Youth Edition', '#A8D8C8'),
  ((SELECT id FROM ins), 'Glow Black', '#1A1A2A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K40 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K40 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aquamarine Blue', '#3A9AAA'),
  ((SELECT id FROM ins), 'Glow Black', '#1A1A2A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K40 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K40 Pro+', ARRAY['256GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glow Black', '#1A1A2A'),
  ((SELECT id FROM ins), 'Aquamarine Blue', '#3A9AAA')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K40 Gaming Edition
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K40 Gaming Edition', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Red', '#C02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K50
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K50', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cyber Black', '#1A1A2A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A'),
  ((SELECT id FROM ins), 'Storm Green', '#2A5A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K50 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K50 Pro', ARRAY['256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cyber Black', '#1A1A2A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A'),
  ((SELECT id FROM ins), 'Storm Green', '#2A5A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K50 Gaming
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K50 Gaming', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Red', '#C02020'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K51
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K51', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K52
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K52', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K53
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K53', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Blue', '#2A5A9A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K54
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K54', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K55
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K55', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K56
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K56', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K57
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K57', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K58
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K58', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K59
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K59', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K60
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K60', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Meteor Black', '#1A1A2A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A'),
  ((SELECT id FROM ins), 'Galaxy White', '#F0F0F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K60 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K60 Pro', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Meteor Black', '#1A1A2A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K60 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K60 Ultra', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Carbon Black', '#2A2A2A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K70
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K70', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Carbon Black', '#2A2A2A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A'),
  ((SELECT id FROM ins), 'Emerald Green', '#2A7A5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K70 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K70 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Carbon Black', '#2A2A2A'),
  ((SELECT id FROM ins), 'Emerald Green', '#2A7A5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K80
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K80', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Nebula Blue', '#2A4A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Xiaomi > Redmi K80 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Xiaomi', 'Redmi K80 Pro', ARRAY['512GB','1TB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Titanium Gray', '#7A7A7A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > M3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'M3', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0'),
  ((SELECT id FROM ins), 'Power Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > M4 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'M4 Pro', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0'),
  ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Power White', '#F5F5F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > M5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'M5', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > M6 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'M6 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Hunter Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Hunter Blue', '#1A3A6A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X3', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0'),
  ((SELECT id FROM ins), 'Shadow Gray', '#5A5A5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X3 NFC
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X3 NFC', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0'),
  ((SELECT id FROM ins), 'Shadow Gray', '#5A5A5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X4 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X4 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0'),
  ((SELECT id FROM ins), 'Power Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X5 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X5 Pro', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0'),
  ((SELECT id FROM ins), 'Power Black', '#1A1A1A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X6', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Mint', '#8AC8A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X6 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X6 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Mint', '#8AC8A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > F1
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'F1', ARRAY['64GB','128GB','256GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Graphite Black', '#2A2A2A'),
  ((SELECT id FROM ins), 'Steel Blue', '#4A7A9A'),
  ((SELECT id FROM ins), 'Rosso Red', '#B02020')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > F2 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'F2 Pro', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gradientshock', '#8A50C8')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > F3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'F3', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sharp White', '#F0F0F0'),
  ((SELECT id FROM ins), 'Night Black', '#1A1A2A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > F4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'F4', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Night Black', '#1A1A2A'),
  ((SELECT id FROM ins), 'Sharp White', '#F0F0F0')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > F5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'F5', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0'),
  ((SELECT id FROM ins), 'Night Black', '#1A1A2A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > F6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'F6', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0'),
  ((SELECT id FROM ins), 'Night Black', '#1A1A2A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > F7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'F7', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > C31
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'C31', ARRAY['32GB','64GB']::text[], ARRAY['2GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Sky Blue', '#7AB0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > C51
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'C51', ARRAY['32GB','64GB']::text[], ARRAY['2GB','3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Sea Blue', '#3A6A8A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > C55
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'C55', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > C65
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'C65', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#8AC8A8'),
  ((SELECT id FROM ins), 'Graphite', '#4A4A4A')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > N10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'N10', ARRAY['64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > N12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'N12', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > N15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'N15', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Bright Blue', '#3A7AB8')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X10', ARRAY['64GB','128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Cool Blue', '#3A7AB0')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X12', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X15', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Frost Blue', '#A8C8E0')
ON CONFLICT (model_id, label) DO NOTHING;

-- POCO > X20
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('POCO', 'X20', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Power Black', '#1A1A1A'),
  ((SELECT id FROM ins), 'Mint', '#8AC8A8')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Oppo F1
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Oppo F1', ARRAY['16GB','32GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ruby Red', '#F57C5F'),
  ((SELECT id FROM ins), 'Rose Gold', '#FCADE6')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F1s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F1s', ARRAY['16GB','32GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Matte Black', '#191919'),
  ((SELECT id FROM ins), 'Rose Gold', '#FCADE6')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F3', ARRAY['64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F3 Plus
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F3 Plus', ARRAY['64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F5', ARRAY['32GB','64GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F7', ARRAY['64GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sunset Red', '#F57C5F'),
  ((SELECT id FROM ins), 'Solar Red', '#BF0013')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F9', ARRAY['64GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sunset Glow', '#FDD96B'),
  ((SELECT id FROM ins), 'Twilight Valley', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A5 (2020)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A5 (2020)', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Dazzling White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Mysterious Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A15', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Twilight Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A16
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A16', ARRAY['32GB','64GB','128GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Moonlight Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A31
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A31', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystery Black', '#191919'),
  ((SELECT id FROM ins), 'Retro White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A53
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A53', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystery Black', '#191919'),
  ((SELECT id FROM ins), 'Retro White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Space Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A54
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A54', ARRAY['128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Olive Green', '#7E9F88'),
  ((SELECT id FROM ins), 'Starry Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A55
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A55', ARRAY['128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Crystal Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Star Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A74 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A74 5G', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Crystal Nebula', '#4C4A46'),
  ((SELECT id FROM ins), 'Mystic Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A93
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A93', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Black', '#191919'),
  ((SELECT id FROM ins), 'Radiant Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A94
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A94', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Black', '#191919'),
  ((SELECT id FROM ins), 'Radiant Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A56 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A56 5G', ARRAY['128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Snow White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Starry Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A58 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A58 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Snow White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Night Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 1
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 1', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sunset Pink', '#FAE0D8'),
  ((SELECT id FROM ins), 'Lunar Blue', '#437691'),
  ((SELECT id FROM ins), 'Starry Night', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 2', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mist White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Sky Blue', '#6EC1E4'),
  ((SELECT id FROM ins), 'Twilight Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 3 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 3 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sigma White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Ocean Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 4', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Rack Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Moonlight Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 5 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 5 5G', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Black', '#191919'),
  ((SELECT id FROM ins), 'Starry Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 6 Pro 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 6 Pro 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Purple', '#A495B2'),
  ((SELECT id FROM ins), 'Stellar Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 7', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Startrail Black', '#191919'),
  ((SELECT id FROM ins), 'Starry Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 8', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 9', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Meteor Gray', '#41424C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 10', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Cosmic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 15', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 15 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 15 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#191919'),
  ((SELECT id FROM ins), 'Sky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Reno 15 Pro Max
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Reno 15 Pro Max', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#191919'),
  ((SELECT id FROM ins), 'Deep Blue', '#1E3D5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K1
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K1', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Black', '#191919'),
  ((SELECT id FROM ins), 'Neon Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K3', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starlit Black', '#191919'),
  ((SELECT id FROM ins), 'Aurora Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K7', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ink Black', '#191919'),
  ((SELECT id FROM ins), 'Transparent Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K9', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Blue', '#437691'),
  ((SELECT id FROM ins), 'Starry Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K10 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K10 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Blue', '#437691'),
  ((SELECT id FROM ins), 'Space Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K11x 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K11x 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Blue', '#437691'),
  ((SELECT id FROM ins), 'Space Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K12 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K12 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Ocean Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > K13 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'K13 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Grey', '#41424C'),
  ((SELECT id FROM ins), 'Cosmic Purple', '#A495B2')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X2', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Green', '#7E9F88'),
  ((SELECT id FROM ins), 'Volcanic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X2 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X2 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Green', '#7E9F88'),
  ((SELECT id FROM ins), 'Cerulean Blue', '#1E3D5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X3', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Volcanic Black', '#191919'),
  ((SELECT id FROM ins), 'Cosmic Shimmer', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X5', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gloss Black', '#191919'),
  ((SELECT id FROM ins), 'Cosmic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X5 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X5 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gloss Black', '#191919'),
  ((SELECT id FROM ins), 'Evergreen', '#7E9F88')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X5 Pro+ 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X5 Pro+ 5G', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Evergreen', '#7E9F88')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X6 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X6 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Divine Green', '#505E4C'),
  ((SELECT id FROM ins), 'Cosmic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X6 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X6 Ultra', ARRAY['256GB','512GB','1TB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X7', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Sapphire Blue', '#3E4B69')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X7 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X7 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#191919'),
  ((SELECT id FROM ins), 'Sky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X7 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X7 Ultra', ARRAY['512GB','1TB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#191919'),
  ((SELECT id FROM ins), 'Deep Blue', '#1E3D5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X8', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Alpine Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X8 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X8 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X9', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Sky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find X9 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find X9 Pro', ARRAY['512GB','1TB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Deep Blue', '#1E3D5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find N
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find N', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Night Black', '#191919'),
  ((SELECT id FROM ins), 'Moonbeam Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find N2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find N2', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Rhapsody Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find N3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find N3', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Cosmic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > Find N3 Flip
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'Find N3 Flip', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Coral Red', '#F57C5F')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F17 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F17 Pro', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Metallic Black', '#191919'),
  ((SELECT id FROM ins), 'Silky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F19 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F19 Pro+', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Blue', '#437691'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F19 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F19 Pro', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Metallic Black', '#191919'),
  ((SELECT id FROM ins), 'Silky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F21 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F21 Pro', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Alpha Black', '#191919'),
  ((SELECT id FROM ins), 'Moonlit White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > F23
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'F23', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Flame Orange', '#FDD96B'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A77 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A77 5G', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Crystal Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Star Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A78 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A78 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Crystal Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Star Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Oppo > A97 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Oppo', 'A97 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Black', '#191919'),
  ((SELECT id FROM ins), 'Ocean Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V5', ARRAY['32GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gold', '#F5E7D0'),
  ((SELECT id FROM ins), 'Rose Gold', '#FCADE6')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V5s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V5s', ARRAY['64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gold', '#F5E7D0'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V7', ARRAY['32GB','64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V9', ARRAY['64GB']::text[], ARRAY['64GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sunrise Gold', '#FDD96B'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V11i
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V11i', ARRAY['64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Black', '#191919'),
  ((SELECT id FROM ins), 'Dazzling Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y91
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y91', ARRAY['32GB']::text[], ARRAY['2GB','3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y93
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y93', ARRAY['32GB','64GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y12', ARRAY['32GB','64GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y15', ARRAY['32GB','64GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Blue', '#437691'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y17
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y17', ARRAY['128GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mirage Blue', '#437691'),
  ((SELECT id FROM ins), 'Midnight Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y19
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y19', ARRAY['128GB']::text[], ARRAY['4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#191919'),
  ((SELECT id FROM ins), 'Glacier Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y20
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y20', ARRAY['32GB','64GB']::text[], ARRAY['3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Blue', '#437691'),
  ((SELECT id FROM ins), 'Midnight Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y20s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y20s', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y21
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y21', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Marvel Blue', '#437691'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y21s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y21s', ARRAY['128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Blue', '#437691'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y30
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y30', ARRAY['128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#191919'),
  ((SELECT id FROM ins), 'Mirage Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y31
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y31', ARRAY['128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Blue', '#437691'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y51 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y51 5G', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Blue', '#437691'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y53s
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y53s', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starlight Black', '#191919'),
  ((SELECT id FROM ins), 'Stellar Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y73
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y73', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y76 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y76 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Blue', '#437691'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y100
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y100', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Blue', '#437691'),
  ((SELECT id FROM ins), 'Myst Shock', '#4C4A46'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y200
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y200', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Black', '#191919'),
  ((SELECT id FROM ins), 'Mystic Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > Y27
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'Y27', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Black', '#191919'),
  ((SELECT id FROM ins), 'Mystic Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V15', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Royal Blue', '#437691'),
  ((SELECT id FROM ins), 'Phoenix Red', '#BF0013')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V17 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V17 Pro', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#191919'),
  ((SELECT id FROM ins), 'Mirror Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V19
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V19', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Magnet Black', '#191919'),
  ((SELECT id FROM ins), 'Crystal Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V21
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V21', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glamour Black', '#191919'),
  ((SELECT id FROM ins), 'Swan Lake Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V21e
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V21e', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Onyx Black', '#191919'),
  ((SELECT id FROM ins), 'Twin Tone Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V23
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V23', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Diamond Galaxy Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V25
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V25', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Desert Black', '#191919'),
  ((SELECT id FROM ins), 'Forest Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V27
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V27', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Desert Black', '#191919'),
  ((SELECT id FROM ins), 'Forest Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V29
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V29', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Black', '#191919'),
  ((SELECT id FROM ins), 'Starry Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V30
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V30', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Black', '#191919'),
  ((SELECT id FROM ins), 'Starry Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V30 Lite 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V30 Lite 5G', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V50
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V50', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Black', '#191919'),
  ((SELECT id FROM ins), 'Starry Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V60 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V60 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mystic Blue', '#437691'),
  ((SELECT id FROM ins), 'Mystic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > V70 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'V70 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Black', '#191919'),
  ((SELECT id FROM ins), 'Cosmic Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X21
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X21', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Phantom Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Ink Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X21 UD
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X21 UD', ARRAY['128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Diamond Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Phantom Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X23
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X23', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sunrise Fairy', '#FDD96B'),
  ((SELECT id FROM ins), 'Starry Night', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X27
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X27', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lunar Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Starry Night', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X27 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X27 Pro', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Starry Night', '#191919'),
  ((SELECT id FROM ins), 'Lunar Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X30
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X30', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lunar Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Charcoal Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X30 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X30 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lunar Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Charcoal Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X50
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X50', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X50 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X50 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X50 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X50 Pro+', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X60
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X60', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cloud Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Night Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X60 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X60 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cloud Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Night Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X60 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X60 Pro+', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cloud Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Night Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X70
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X70', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X70 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X70 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X70 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X70 Pro+', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X80
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X80', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X80 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X80 Pro', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X80 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X80 Pro+', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X90
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X90', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X90 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X90 Pro', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X90 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X90 Pro+', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X100
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X100', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Sky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X100 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X100 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Sky Blue', '#6EC1E4')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X100 Ultra
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X100 Ultra', ARRAY['512GB','1TB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Deep Blue', '#1E3D5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X110
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X110', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Ocean Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > X110 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'X110 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Ocean Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > iQOO Z3 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'iQOO Z3 5G', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Alluring Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > iQOO 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'iQOO 7', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Legendary Black', '#191919'),
  ((SELECT id FROM ins), 'Legendary Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > iQOO 8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'iQOO 8', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Legendary Black', '#191919'),
  ((SELECT id FROM ins), 'Legendary Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > iQOO 9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'iQOO 9', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Legendary Black', '#191919'),
  ((SELECT id FROM ins), 'Legendary Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > iQOO 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'iQOO 10', ARRAY['256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Eternal Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > iQOO 11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'iQOO 11', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Eternal Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Vivo > iQOO 12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Vivo', 'iQOO 12', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Eternal Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '3', ARRAY['64GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Soft Gold', '#F5E7D0'),
  ((SELECT id FROM ins), 'Graphite', '#41424C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '5', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#191919'),
  ((SELECT id FROM ins), 'Slate Gray', '#41424C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '6', ARRAY['64GB','128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mirror Black', '#191919'),
  ((SELECT id FROM ins), 'Midnight Black', '#191919'),
  ((SELECT id FROM ins), 'Silk White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '7', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mirror Gray', '#41424C'),
  ((SELECT id FROM ins), 'Glacial Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '8', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacial Green', '#505E4C'),
  ((SELECT id FROM ins), 'Onyx Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '9', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Morningmist Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Wintermist Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Babypink', '#FAE0D8')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '10', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Iron Gray', '#41424C'),
  ((SELECT id FROM ins), 'Emerald Forest', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '11', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Metallic Black', '#191919'),
  ((SELECT id FROM ins), 'Emerald Forest', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '12', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Obsidian Black', '#191919'),
  ((SELECT id FROM ins), 'Alpine Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 13
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '13', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Alpine Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 14
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '14', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Glacier Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 3T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '3T', ARRAY['64GB','128GB']::text[], ARRAY['6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Soft Gold', '#F5E7D0'),
  ((SELECT id FROM ins), 'Gunmetal', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 5T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '5T', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Midnight Black', '#191919'),
  ((SELECT id FROM ins), 'Midnight Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 6T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '6T', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mirror Black', '#191919'),
  ((SELECT id FROM ins), 'Midnight Black', '#191919'),
  ((SELECT id FROM ins), 'Midnight Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 7 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '7 Pro', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Nebula Blue', '#437691'),
  ((SELECT id FROM ins), 'Almond', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 7T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '7T', ARRAY['128GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Frosted Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Glacial Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 7T Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '7T Pro', ARRAY['256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Haze Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Emerald Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 8 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '8 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Onyx Black', '#191919'),
  ((SELECT id FROM ins), 'Ultramarine Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 8T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '8T', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Aquamarine Green', '#505E4C'),
  ((SELECT id FROM ins), 'Lunar Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 9 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '9 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Morningmist Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Pine Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 9R
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '9R', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lake Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Rocky Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 10 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '10 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Emerald Forest', '#505E4C'),
  ((SELECT id FROM ins), 'Volcanic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 10T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '10T', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Moonstone Black', '#191919'),
  ((SELECT id FROM ins), 'Jade Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 12R
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '12R', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Galactic Black', '#191919'),
  ((SELECT id FROM ins), 'Jade Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > 14 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', '14 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Glacier Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord (2020)
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord (2020)', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gray Onyx', '#41424C'),
  ((SELECT id FROM ins), 'Blue Midgray', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord 2 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord 2 5G', ARRAY['128GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gray Onyx', '#41424C'),
  ((SELECT id FROM ins), 'Blue Haze', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord CE
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord CE', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Charcoal Ink', '#191919'),
  ((SELECT id FROM ins), 'Blue Void', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord CE 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord CE 2', ARRAY['128GB']::text[], ARRAY['6GB','8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gray Shade', '#41424C'),
  ((SELECT id FROM ins), 'Blue Haze', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord CE 2 Lite 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord CE 2 Lite 5G', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gray Shade', '#41424C'),
  ((SELECT id FROM ins), 'Blue Haze', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord 2T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord 2T', ARRAY['128GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Silver Shadow', '#F1F2ED'),
  ((SELECT id FROM ins), 'Jade Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord 3 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord 3 5G', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Tempest Green', '#505E4C'),
  ((SELECT id FROM ins), 'Glacier Green', '#505E4C'),
  ((SELECT id FROM ins), 'Black Cool', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord 4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord 4', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Arctic Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Jet Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord 5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord 5', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ocean Blue', '#437691'),
  ((SELECT id FROM ins), 'Star Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord 6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord 6', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Meteor Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Cosmic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord 6 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord 6 Pro', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord CE 5 Lite
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord CE 5 Lite', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Cosmic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Nord N30 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Nord N30 5G', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Ace
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Ace', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Translucent Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Ace 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Ace 2', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Emerald Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Ace 2V
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Ace 2V', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Emerald Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Ace 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Ace 3', ARRAY['128GB','256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Emerald Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Ace 4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Ace 4', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Fold 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Fold 2', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Fold 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Fold 3', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Emerald Green', '#505E4C')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Fold 4
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Fold 4', ARRAY['512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cosmic Black', '#191919'),
  ((SELECT id FROM ins), 'Nebula Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Watch 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Watch 2', ARRAY[]::text[], ARRAY[]::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Stainless Steel', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Watch 2R
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Watch 2R', ARRAY[]::text[], ARRAY[]::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Beige', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Buds Pro 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Buds Pro 2', ARRAY[]::text[], ARRAY[]::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > Buds 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'Buds 3', ARRAY[]::text[], ARRAY[]::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > TV Y1
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'TV Y1', ARRAY[]::text[], ARRAY[]::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- OnePlus > TV U1
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('OnePlus', 'TV U1', ARRAY[]::text[], ARRAY[]::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 1
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '1', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '2', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Black', '#191919'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '3', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Dynamic Black', '#191919'),
  ((SELECT id FROM ins), 'Radiant Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '5', ARRAY['32GB','64GB','128GB']::text[], ARRAY['3GB','4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ocean Blue', '#437691'),
  ((SELECT id FROM ins), 'Flame Red', '#F57C5F')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '6', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Comet Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Comet White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '7', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mist Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Mist White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '8', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Supernova', '#4C4A46'),
  ((SELECT id FROM ins), 'Infinite Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 9
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '9', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Supernova Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '10', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '11', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '12', ARRAY['128GB','256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 13
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '13', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 14
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '14', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 15
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '15', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 16
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '16', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 17
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '17', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 3 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '3 Pro', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Dynamic Black', '#191919'),
  ((SELECT id FROM ins), 'Color Shift Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 5 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '5 Pro', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Sapphire Blue', '#3E4B69'),
  ((SELECT id FROM ins), 'Diamond Red', '#F57C5F')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 6 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '6 Pro', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lightning Blue', '#437691'),
  ((SELECT id FROM ins), 'Lightning White', '#F2F3F5')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 7 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '7 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mirror Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Mirror Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 8 5G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '8 5G', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Supernova', '#4C4A46'),
  ((SELECT id FROM ins), 'Infinite Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 8 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '8 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Supernova Orange', '#FDD96B')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 9 4G
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '9 4G', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Supernova Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 9 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '9 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Supernova Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 9 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '9 Pro+', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Stellar Black', '#191919'),
  ((SELECT id FROM ins), 'Supernova Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 10 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '10 Pro', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 10 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '10 Pro+', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 11 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '11 Pro', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 11 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '11 Pro+', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 12 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '12 Pro', ARRAY['256GB']::text[], ARRAY['8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 12 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '12 Pro+', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 13 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '13 Pro', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 13 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '13 Pro+', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 14 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '14 Pro', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 14 Pro+
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '14 Pro+', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 15 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '15 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > 17 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', '17 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Infinite Black', '#191919'),
  ((SELECT id FROM ins), 'Sunset Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C11
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C11', ARRAY['32GB']::text[], ARRAY['2GB','3GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Cool Gray', '#41424C'),
  ((SELECT id FROM ins), 'Cool Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C12
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C12', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mist Gray', '#41424C'),
  ((SELECT id FROM ins), 'Mist Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C21
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C21', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mist Blue', '#437691'),
  ((SELECT id FROM ins), 'Mist Gray', '#41424C')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C31
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C31', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Gray', '#41424C'),
  ((SELECT id FROM ins), 'Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C41
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C41', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Lime Blue', '#437691'),
  ((SELECT id FROM ins), 'Space Blue', '#1E3D5A')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C55
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C55', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Rainy Emerald', '#505E4C'),
  ((SELECT id FROM ins), 'Glamour Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C57
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C57', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Rainy Emerald', '#505E4C'),
  ((SELECT id FROM ins), 'Glamour Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C58
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C58', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Rainy Emerald', '#505E4C'),
  ((SELECT id FROM ins), 'Glamour Gold', '#F5E7D0')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C61
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C61', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C63
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C63', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C65
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C65', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C70
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C70', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C71
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C71', ARRAY['128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C81
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C81', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ocean Blue', '#437691'),
  ((SELECT id FROM ins), 'Star Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > C83
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'C83', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Ocean Blue', '#437691'),
  ((SELECT id FROM ins), 'Star Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 20
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 20', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Polar White', '#F2F3F5'),
  ((SELECT id FROM ins), 'Space Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 30
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 30', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Racing Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Racing Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 30 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 30 Pro', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Racing Silver', '#F1F2ED'),
  ((SELECT id FROM ins), 'Racing Blue', '#437691')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 50
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 50', ARRAY['64GB','128GB']::text[], ARRAY['4GB','6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 50A
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 50A', ARRAY['32GB','64GB']::text[], ARRAY['3GB','4GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Glacier Blue', '#4C4A46'),
  ((SELECT id FROM ins), 'Dynamic Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 50 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 50 Pro', ARRAY['64GB','128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 60
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 60', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Mint', '#7F9B88'),
  ((SELECT id FROM ins), 'Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 70
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 70', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Blue', '#437691'),
  ((SELECT id FROM ins), 'Starry Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 70x
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 70x', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Blue', '#437691'),
  ((SELECT id FROM ins), 'Starry Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > Narzo 80
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'Narzo 80', ARRAY['128GB']::text[], ARRAY['6GB','8GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Space Blue', '#437691'),
  ((SELECT id FROM ins), 'Starry Black', '#191919')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT Neo 2
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT Neo 2', ARRAY['128GB','256GB']::text[], ARRAY['6GB','8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Atlantis Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT Neo 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT Neo 3', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT Neo 3T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT Neo 3T', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT Neo 5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT Neo 5', ARRAY['128GB','256GB','512GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT Neo 5 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT Neo 5 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT Neo 6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT Neo 6', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT Neo 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT Neo 7', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 3
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 3', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 3T
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 3T', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 3 Neo
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 3 Neo', ARRAY['128GB','256GB']::text[], ARRAY['8GB','12GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 5
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 5', ARRAY['256GB','512GB']::text[], ARRAY['8GB','12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Dawn Blue', '#4C4A46')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 5 Pro
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 5 Pro', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Titanium Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 6
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 6', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Titanium Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 7', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Titanium Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 8
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 8', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Titanium Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

-- Realme > GT 10
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Realme', 'GT 10', ARRAY['256GB','512GB']::text[], ARRAY['12GB','16GB']::text[])
  ON CONFLICT (brand, model) DO UPDATE SET storage = EXCLUDED.storage, ram = EXCLUDED.ram
  RETURNING id
)
INSERT INTO catalog_model_colors (model_id, label, hex)
VALUES ((SELECT id FROM ins), 'Eternal Black', '#191919'),
  ((SELECT id FROM ins), 'Titanium Silver', '#F1F2ED')
ON CONFLICT (model_id, label) DO NOTHING;

COMMIT;

-- Total: 556 models, 1474 colors