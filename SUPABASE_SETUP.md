# Guía: Conectar Supabase a seriesypelis

## Resumen de datos actuales

Tu app usa **localStorage** para guardar:

| Dato | Clave localStorage | Descripción |
|------|--------------------|-------------|
| **Planes** | `pelis-series-planes` | Plataformas (Netflix, Disney+, etc.) con precio |
| **Clientes** | `pelis-series-users-db` | Usuarios registrados con saldo e historial |
| **Inventario** | `pelis-series-inventario` | Cuentas de streaming con perfiles (disponibles/ocupados) |
| **Auth** | `pelis-series-auth` | Sesión del usuario logueado |
| **Admin** | `pelis-series-admin-auth` | Sesión del administrador |

---

## Pasos para conectar Supabase

### 1. Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) e inicia sesión
2. Clic en **"New Project"**
3. Elige organización, nombre del proyecto (ej: `seriesypelis`), contraseña de base de datos
4. Espera a que se cree el proyecto

### 2. Ejecutar el esquema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Copia todo el contenido de `supabase/migrations/001_schema_inicial.sql`
3. Pégalo en el editor y ejecútalo (Run)

Con esto se crearán las tablas: `planes`, `clientes`, `compras`, `inventario_plataformas`, `cuentas_plataforma`, `perfiles`, `admin_usuarios`.

### 3. Obtener las credenciales

1. Ve a **Project Settings** (icono engranaje) → **API**
2. Copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public** key (para el frontend)
   - **service_role** key (para operaciones de backend, más privilegios)

### 4. Configurar variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

> **Importante**: Añade `.env.local` al `.gitignore` (si no está ya) para no subir secretos a GitHub.

### 5. Bucket de imágenes (Storage)

Las imágenes de las plataformas se guardan automáticamente en Supabase Storage al crearlas o editarlas.

**Importante**: Sin este bucket las imágenes se guardan en base64 (funcionan pero ocupan más espacio).

1. En Supabase → **Storage** → **New bucket**
2. Nombre: `images` (exactamente)
3. **Public bucket**: activar ON (obligatorio para que las URLs funcionen)
4. Create bucket
5. Ejecuta `supabase/migrations/002_storage_policies.sql` en el SQL Editor

---

## Después del setup

La app usa **solo Supabase** como fuente de datos. La capa unificada está en `lib/data.ts` y llama a `lib/supabaseData.ts`. Los tipos están en `lib/types.ts`. Sin variables de Supabase configuradas, las funciones devuelven vacío ([] / null / false).

---

## Admin en subdominio (admin.seriesypelis.lat)

El panel de administración está pensado para usarse en **admin.seriesypelis.lat**. En Vercel:

1. Asigna al **mismo proyecto** los dos dominios: `seriesypelis.lat` y `admin.seriesypelis.lat`.
2. El **middleware** (`middleware.ts`) redirige: si alguien entra a `seriesypelis.lat/admin` va a `admin.seriesypelis.lat/admin`; si entra a `admin.seriesypelis.lat/` va a `admin.seriesypelis.lat/admin`.
3. Opcional: en **Variables de entorno** define `NEXT_PUBLIC_MAIN_SITE_URL=https://seriesypelis.lat` para que el enlace "Ir al sitio" del panel apunte al sitio principal.
