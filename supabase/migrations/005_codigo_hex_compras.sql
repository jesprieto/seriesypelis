-- Agregar columna codigo_hex a compras (código único hex para referencias)
ALTER TABLE compras ADD COLUMN IF NOT EXISTS codigo_hex TEXT;
-- Rellenar compras existentes con hex único basado en UUID
UPDATE compras SET codigo_hex = UPPER(SUBSTR(REPLACE(uuid_generate_v4()::text, '-', ''), 1, 12))
WHERE codigo_hex IS NULL OR codigo_hex = '';
