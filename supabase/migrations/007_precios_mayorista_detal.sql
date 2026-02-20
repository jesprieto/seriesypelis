-- Precios mayorista y detal en planes
ALTER TABLE planes ADD COLUMN IF NOT EXISTS precio_mayorista INTEGER;
ALTER TABLE planes ADD COLUMN IF NOT EXISTS precio_detal INTEGER;

-- Perfil de precio en clientes (mayorista/detal)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS perfil_precio TEXT CHECK (perfil_precio IN ('mayorista', 'detal'));
