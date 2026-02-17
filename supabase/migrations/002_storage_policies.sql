-- Políticas para el bucket "images" (crear el bucket primero desde Dashboard o API)
-- Ejecutar después de crear el bucket en Supabase → Storage

-- Permitir lectura pública de imágenes
CREATE POLICY "Public read for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Permitir inserción/actualización (upload) para usuarios anónimos (desde el frontend)
CREATE POLICY "Allow upload to images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow update in images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');
