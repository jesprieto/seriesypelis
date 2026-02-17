-- Permitir estado 'Suspendido' en compras (acceso liberado por admin, datos ocultos al usuario)
ALTER TABLE compras DROP CONSTRAINT IF EXISTS compras_estado_check;
ALTER TABLE compras ADD CONSTRAINT compras_estado_check
  CHECK (estado IN ('Disponible', 'Expirado', 'Suspendido'));
