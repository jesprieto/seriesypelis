-- ============================================
-- Unificación de nombres de plataformas
-- Amazon Prime -> Prime, Apple TV+ -> Appletv, DIRECTV -> Directv
-- ============================================

-- 1. PLANES: unificar nombres
UPDATE planes SET nombre = 'Prime' WHERE LOWER(TRIM(nombre)) IN ('amazon prime', 'amazonprime');
UPDATE planes SET nombre = 'Appletv' WHERE LOWER(TRIM(nombre)) IN ('apple tv+', 'apple tv', 'appletv');
UPDATE planes SET nombre = 'Directv' WHERE LOWER(TRIM(nombre)) IN ('directv', 'direct tv', 'direct tv go');

-- 2. COMPRAS: unificar plataforma en historial
UPDATE compras SET plataforma = 'Prime' WHERE LOWER(TRIM(plataforma)) IN ('amazon prime', 'amazonprime');
UPDATE compras SET plataforma = 'Appletv' WHERE LOWER(TRIM(plataforma)) IN ('apple tv+', 'apple tv', 'appletv');
UPDATE compras SET plataforma = 'Directv' WHERE LOWER(TRIM(plataforma)) IN ('directv', 'direct tv', 'direct tv go');

-- 3. INVENTARIO: unificar (manejar posibles duplicados)
DO $$
DECLARE
  old_id TEXT;
  new_id TEXT;
BEGIN
  -- Amazon Prime -> Prime
  SELECT id INTO old_id FROM inventario_plataformas WHERE LOWER(TRIM(plataforma)) IN ('amazon prime', 'amazonprime') LIMIT 1;
  SELECT id INTO new_id FROM inventario_plataformas WHERE LOWER(TRIM(plataforma)) = 'prime' LIMIT 1;
  IF old_id IS NOT NULL THEN
    IF new_id IS NOT NULL AND old_id != new_id THEN
      UPDATE cuentas_plataforma SET inventario_plataforma_id = new_id WHERE inventario_plataforma_id = old_id;
      DELETE FROM inventario_plataformas WHERE id = old_id;
    ELSIF new_id IS NULL THEN
      UPDATE inventario_plataformas SET plataforma = 'Prime' WHERE id = old_id;
    END IF;
  END IF;

  -- Apple TV+ / Apple TV -> Appletv (old_id = variante que no sea ya 'appletv')
  SELECT id INTO old_id FROM inventario_plataformas WHERE LOWER(TRIM(plataforma)) IN ('apple tv+', 'apple tv') LIMIT 1;
  SELECT id INTO new_id FROM inventario_plataformas WHERE LOWER(TRIM(plataforma)) = 'appletv' LIMIT 1;
  IF old_id IS NOT NULL THEN
    IF new_id IS NOT NULL AND old_id != new_id THEN
      UPDATE cuentas_plataforma SET inventario_plataforma_id = new_id WHERE inventario_plataforma_id = old_id;
      DELETE FROM inventario_plataformas WHERE id = old_id;
    ELSIF new_id IS NULL THEN
      UPDATE inventario_plataformas SET plataforma = 'Appletv' WHERE id = old_id;
    END IF;
  END IF;

  -- DIRECTV / Direct TV -> Directv (old = variantes; new = ya 'Directv' exacto)
  SELECT id INTO old_id FROM inventario_plataformas WHERE plataforma IN ('DIRECTV', 'Direct TV', 'Direct TV Go') LIMIT 1;
  SELECT id INTO new_id FROM inventario_plataformas WHERE plataforma = 'Directv' LIMIT 1;
  IF old_id IS NOT NULL THEN
    IF new_id IS NOT NULL AND old_id != new_id THEN
      UPDATE cuentas_plataforma SET inventario_plataforma_id = new_id WHERE inventario_plataforma_id = old_id;
      DELETE FROM inventario_plataformas WHERE id = old_id;
    ELSIF new_id IS NULL THEN
      UPDATE inventario_plataformas SET plataforma = 'Directv' WHERE id = old_id;
    END IF;
  END IF;
END $$;
