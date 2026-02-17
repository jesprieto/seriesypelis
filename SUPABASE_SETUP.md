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

1. En Supabase → **Storage** → **New bucket**
2. Nombre: `images`
3. Marca **Public bucket** (para que las imágenes sean accesibles por URL)
4. Ejecuta `supabase/migrations/002_storage_policies.sql` en el SQL Editor para las políticas de upload

O bien: en el panel Admin → pestaña **Migración**, haz clic en "Crear bucket images".

### 6. Migrar datos existentes

En el panel Admin → pestaña **Migración**:

1. Clic en **Crear bucket images** (si no existe)
2. Clic en **Ejecutar migración** para copiar clientes, inventario y planes desde localStorage a Supabase
3. Los duplicados (clientes por correo) se omiten automáticamente
4. Las imágenes base64 de plataformas se suben al bucket y se guardan como URL

---

## Después del setup

Ya está creada la capa de datos en `lib/supabaseData.ts` con funciones equivalentes a `mockData`:

| mockData | Supabase |
|----------|----------|
| `getPlanes()` | `getPlanesFromSupabase()` |
| `setPlanes()` | `setPlanesInSupabase()` |
| `getClientes()` | `getClientesFromSupabase()` |
| `getClienteByCorreo()` | `getClienteByCorreoFromSupabase()` |
| `registrarCliente()` | `registrarClienteInSupabase()` |
| `actualizarCliente()` | `actualizarClienteInSupabase()` |
| `getInventario()` | `getInventarioFromSupabase()` |
| `setInventario()` | `setInventarioInSupabase()` |
| `asignarPerfilDisponible()` | `asignarPerfilDisponibleInSupabase()` |
| `contarPerfilesDisponibles()` | `contarPerfilesDisponiblesInSupabase()` |

**Siguiente paso**: Migrar los componentes para usar estas funciones async cuando Supabase esté configurado. Las funciones de Supabase son **asíncronas**, por lo que habrá que adaptar `AuthContext`, `RegisterForm`, `PlanCard`, `planes/page`, `AccesosTab`, `ClientesTab`, `CrearPlataformaTab` y `Sidebar` para cargar datos de forma async (por ejemplo con `useEffect` + `useState` o SWR).
