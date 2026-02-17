-- ============================================
-- Esquema inicial para seriesypelis en Supabase
-- Ejecutar en el SQL Editor del dashboard de Supabase
-- ============================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PLANES (plataformas)
CREATE TABLE planes (
  id TEXT PRIMARY KEY DEFAULT ('p-' || substr(uuid_generate_v4()::text, 1, 8)),
  nombre TEXT NOT NULL,
  precio INTEGER NOT NULL DEFAULT 0,
  imagen TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CLIENTES
CREATE TABLE clientes (
  id TEXT PRIMARY KEY DEFAULT ('c-' || substr(uuid_generate_v4()::text, 1, 8)),
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  contraseña TEXT NOT NULL,
  whatsapp TEXT,
  avatar_emoji TEXT,
  saldo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COMPRAS (historial de compras de clientes)
CREATE TABLE compras (
  id TEXT PRIMARY KEY DEFAULT ('comp-' || substr(uuid_generate_v4()::text, 1, 8)),
  codigo TEXT NOT NULL,
  cliente_correo TEXT NOT NULL REFERENCES clientes(correo) ON DELETE CASCADE,
  plataforma TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Expirado')),
  valor_compra INTEGER NOT NULL,
  informacion TEXT,
  correo TEXT,
  contraseña TEXT,
  perfil INTEGER,
  pin TEXT,
  fecha_compra TEXT,
  fecha_compra_iso TIMESTAMPTZ,
  fecha_expiracion TEXT,
  fecha_expiracion_iso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INVENTARIO DE PLATAFORMAS
CREATE TABLE inventario_plataformas (
  id TEXT PRIMARY KEY DEFAULT ('invp-' || substr(uuid_generate_v4()::text, 1, 8)),
  plataforma TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CUENTAS POR PLATAFORMA
CREATE TABLE cuentas_plataforma (
  id TEXT PRIMARY KEY DEFAULT ('cuenta-' || substr(uuid_generate_v4()::text, 1, 8)),
  inventario_plataforma_id TEXT NOT NULL REFERENCES inventario_plataformas(id) ON DELETE CASCADE,
  correo TEXT NOT NULL,
  contraseña TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PERFILES POR CUENTA
CREATE TABLE perfiles (
  id TEXT PRIMARY KEY DEFAULT ('perf-' || substr(uuid_generate_v4()::text, 1, 8)),
  cuenta_plataforma_id TEXT NOT NULL REFERENCES cuentas_plataforma(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  pin TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupado')),
  cliente_correo TEXT,
  fecha_asignacion TEXT,
  fecha_expiracion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cuenta_plataforma_id, numero)
);

-- 7. ADMIN (opcional - para login admin)
CREATE TABLE admin_usuarios (
  id TEXT PRIMARY KEY DEFAULT ('admin-' || substr(uuid_generate_v4()::text, 1, 8)),
  usuario TEXT NOT NULL UNIQUE,
  clave TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar consultas
CREATE INDEX idx_clientes_correo ON clientes(correo);
CREATE INDEX idx_compras_cliente ON compras(cliente_correo);
CREATE INDEX idx_cuentas_inventario ON cuentas_plataforma(inventario_plataforma_id);
CREATE INDEX idx_perfiles_cuenta ON perfiles(cuenta_plataforma_id);
CREATE INDEX idx_perfiles_estado ON perfiles(estado);

-- Habilitar RLS (Row Level Security) - política básica para permitir todo por ahora
-- Ajustar según tu estrategia de autenticación
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_plataformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir todo para desarrollo (usando service_role key desde backend)
-- En producción deberías restringir por auth.uid() o similar
CREATE POLICY "Allow all for service role" ON planes FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON compras FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON inventario_plataformas FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON cuentas_plataforma FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON perfiles FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON admin_usuarios FOR ALL USING (true);

-- Datos iniciales (nombres unificados según PLATAFORMAS_OFICIALES)
INSERT INTO planes (id, nombre, precio) VALUES
  ('1', 'Crunchyroll', 1500),
  ('2', 'Netflix', 12000),
  ('3', 'Disney+', 8000),
  ('4', 'HBO Max', 10000),
  ('5', 'Prime', 7500),
  ('6', 'Appletv', 5500),
  ('7', 'Spotify', 5500),
  ('8', 'Directv', 10000),
  ('9', 'Win Sports+', 16000);

INSERT INTO admin_usuarios (usuario, clave) VALUES ('admin', 'admin123');
