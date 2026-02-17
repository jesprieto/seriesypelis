-- Políticas para el bucket "images"
-- 1. Crear el bucket: Supabase → Storage → New bucket → name: "images" → Public: ON
-- 2. Ejecutar este SQL en el SQL Editor

-- Eliminar políticas previas si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Public read for images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update in images" ON storage.objects;

-- Lectura pública (cualquiera puede ver)
CREATE POLICY "Public read for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Subida permitida para anon y authenticated
CREATE POLICY "Allow upload to images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Actualización (necesario para upsert)
CREATE POLICY "Allow update in images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');
