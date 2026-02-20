-- Agregar columna promo a planes (aparece en pestaña promociones y permite editar precio)
ALTER TABLE planes ADD COLUMN IF NOT EXISTS promo BOOLEAN NOT NULL DEFAULT false;
