-- Tabla combos: descripción + precio (un valor para dos pantallas)
CREATE TABLE combos (
  id TEXT PRIMARY KEY DEFAULT ('combo-' || substr(uuid_generate_v4()::text, 1, 8)),
  descripcion TEXT NOT NULL,
  precio INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla accesos_combo: accesos vendidos de combos (estilo YouTube/Spotify)
-- correo/contraseña/tipo_plataforma se agregan manualmente después de la compra
CREATE TABLE accesos_combo (
  id TEXT PRIMARY KEY DEFAULT ('acombo-' || substr(uuid_generate_v4()::text, 1, 8)),
  combo_id TEXT NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  correo_comprador TEXT NOT NULL,
  unidades_disponibles INTEGER NOT NULL DEFAULT 2,
  correo TEXT,
  contraseña TEXT,
  tipo_plataforma TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'entregado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_accesos_combo_combo ON accesos_combo(combo_id);
CREATE INDEX idx_accesos_combo_correo_comprador ON accesos_combo(correo_comprador);
CREATE INDEX idx_accesos_combo_estado ON accesos_combo(estado);

ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE accesos_combo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role" ON combos FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON accesos_combo FOR ALL USING (true);
