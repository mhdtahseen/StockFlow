BEGIN;

-- Samsung > Galaxy S7
WITH ins AS (
  INSERT INTO catalog_models (brand, model, storage, ram)
  VALUES ('Samsung', 'Galaxy S7', ARRAY['32GB','64GB'], ARRAY['4GB'])
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
  VALUES ('Samsung', 'Galaxy S7 edge', ARRAY['32GB','64GB'], ARRAY['4GB'])
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
  VALUES ('Samsung', 'Galaxy S8', ARRAY['64GB'], ARRAY['4GB'])
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
  VALUES ('Samsung', 'Galaxy S8+', ARRAY['64GB'], ARRAY['4GB'])
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
  VALUES ('Samsung', 'Galaxy S9', ARRAY['64GB','128GB'], ARRAY['4GB'])
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
  VALUES ('Samsung', 'Galaxy S9+', ARRAY['64GB','128GB','256GB'], ARRAY['6GB'])
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
  VALUES ('Samsung', 'Galaxy S10e', ARRAY['128GB','256GB'], ARRAY['6GB'])
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
  VALUES ('Samsung', 'Galaxy S10', ARRAY['128GB','512GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S10+', ARRAY['128GB','512GB'], ARRAY['8GB','12GB'])
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
  VALUES ('Samsung', 'Galaxy S10 5G', ARRAY['256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S20', ARRAY['128GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S20+', ARRAY['128GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S20 Ultra', ARRAY['128GB','256GB'], ARRAY['12GB'])
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
  VALUES ('Samsung', 'Galaxy S20 FE', ARRAY['128GB'], ARRAY['6GB'])
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
  VALUES ('Samsung', 'Galaxy S21', ARRAY['128GB','256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S21+', ARRAY['128GB','256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S21 Ultra', ARRAY['128GB','256GB','512GB'], ARRAY['12GB','16GB'])
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
  VALUES ('Samsung', 'Galaxy S21 FE', ARRAY['128GB','256GB'], ARRAY['6GB','8GB'])
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
  VALUES ('Samsung', 'Galaxy S22', ARRAY['128GB','256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S22+', ARRAY['128GB','256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S22 Ultra', ARRAY['128GB','256GB','512GB'], ARRAY['8GB','12GB'])
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
  VALUES ('Samsung', 'Galaxy S23', ARRAY['128GB','256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S23+', ARRAY['256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S23 Ultra', ARRAY['256GB','512GB'], ARRAY['8GB','12GB'])
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
  VALUES ('Samsung', 'Galaxy S23 FE', ARRAY['128GB','256GB'], ARRAY['6GB','8GB'])
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
  VALUES ('Samsung', 'Galaxy S24', ARRAY['128GB','256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S24+', ARRAY['256GB','512GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S24 Ultra', ARRAY['256GB','512GB','1TB'], ARRAY['12GB'])
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
  VALUES ('Samsung', 'Galaxy S24 FE', ARRAY['256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S25', ARRAY['256GB','512GB'], ARRAY['12GB'])
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
  VALUES ('Samsung', 'Galaxy S25+', ARRAY['256GB','512GB'], ARRAY['12GB'])
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
  VALUES ('Samsung', 'Galaxy S25 Ultra', ARRAY['256GB','512GB','1TB'], ARRAY['12GB'])
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
  VALUES ('Samsung', 'Galaxy S25 Edge', ARRAY['256GB'], ARRAY['12GB'])
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
  VALUES ('Samsung', 'Galaxy S25 FE', ARRAY['128GB','256GB'], ARRAY['8GB'])
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
  VALUES ('Samsung', 'Galaxy S26', ARRAY['256GB','512GB'], ARRAY['12GB'])
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
  VALUES ('Samsung', 'Galaxy S26+', ARRAY['256GB','512GB'], ARRAY['12GB'])
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
COMMIT;
