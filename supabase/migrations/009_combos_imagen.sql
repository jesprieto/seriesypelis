-- Agregar columna imagen a combos (mismo bucket 'images' de Supabase)
ALTER TABLE combos ADD COLUMN IF NOT EXISTS imagen TEXT;
