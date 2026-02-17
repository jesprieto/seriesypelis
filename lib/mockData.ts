export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
}

export type EstadoCompra = "Disponible" | "Expirado" | "Suspendido";

export interface Compra {
  codigo: string;
  estado: EstadoCompra;
  fechaCompra: string;
  fechaCompraISO?: string;
  plataforma: string;
  informacion: string;
  valorCompra: number;
  correo?: string;
  contraseña?: string;
  perfil?: number;
  pin?: string;
  fechaExpiracion?: string;
  fechaExpiracionISO?: string;
}

const AVATAR_EMOJIS = ["😀", "😊", "😄", "🙂", "😃", "😁", "🥰", "😍"] as const;
const AVATAR_COLORS = [
  "bg-orange-100",
  "bg-blue-100",
  "bg-green-100",
  "bg-purple-100",
  "bg-pink-100",
  "bg-teal-100",
  "bg-amber-100",
  "bg-rose-100",
] as const;

export function getAvatarParaCliente(id: string): { emoji: string; color: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  const idx = Math.abs(hash) % AVATAR_EMOJIS.length;
  return { emoji: AVATAR_EMOJIS[idx], color: AVATAR_COLORS[idx] };
}

export interface Cliente {
  id: string;
  nombre: string;
  correo: string;
  contraseña: string;
  whatsapp?: string;
  avatarEmoji?: string;
  saldo: number;
  historialCompras: Compra[];
}

const PLANES_INICIALES: Plan[] = [];

const CLIENTES_INICIALES: Cliente[] = [];

const STORAGE_PLANES = "pelis-series-planes";
const STORAGE_USERS = "pelis-series-users-db";

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setInStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getPlanes(): Plan[] {
  return getFromStorage(STORAGE_PLANES, PLANES_INICIALES);
}

export function setPlanes(planes: Plan[]): void {
  setInStorage(STORAGE_PLANES, planes);
}

/** Obtiene los accesos ocupados por un cliente en el inventario, agrupados por plataforma */
function obtenerAccesosOcupadosPorCliente(clienteCorreo: string): Map<string, Array<{ correo: string; contraseña: string; perfil: number; pin: string; fechaExpiracion?: string }>> {
  const inv = getInventario();
  const porPlataforma = new Map<string, Array<{ correo: string; contraseña: string; perfil: number; pin: string; fechaExpiracion?: string }>>();
  const correoLower = clienteCorreo.toLowerCase();
  for (const plat of inv) {
    const lista: Array<{ correo: string; contraseña: string; perfil: number; pin: string; fechaExpiracion?: string }> = [];
    for (const cuenta of plat.cuentas) {
      for (const p of cuenta.perfiles) {
        if (p.estado === "ocupado" && p.clienteCorreo?.toLowerCase() === correoLower) {
          lista.push({
            correo: cuenta.correo,
            contraseña: cuenta.contraseña,
            perfil: p.numero,
            pin: p.pin,
            fechaExpiracion: p.fechaExpiracion,
          });
        }
      }
    }
    if (lista.length > 0) {
      lista.sort((a, b) => a.perfil - b.perfil);
      porPlataforma.set(plat.plataforma.toLowerCase(), lista);
    }
  }
  return porPlataforma;
}

/** Complementa compras con correo/contraseña/perfil desde el inventario cuando faltan */
export function hidratarHistorialCompras(historial: Compra[], clienteCorreo: string): Compra[] {
  const accesosPorPlat = obtenerAccesosOcupadosPorCliente(clienteCorreo);
  const indicesUsados = new Map<string, number>();
  return historial.map((c) => {
    const tieneDatos = c.correo != null && c.contraseña != null && (c.perfil != null || (c as { pantalla?: number }).pantalla != null);
    if (tieneDatos) {
      const migrado = { ...c };
      if (c.perfil == null && (c as { pantalla?: number }).pantalla != null) {
        migrado.perfil = (c as { pantalla?: number }).pantalla;
        delete (migrado as { pantalla?: number }).pantalla;
      }
      return migrado;
    }
    const platKey = c.plataforma.toLowerCase();
    const lista = accesosPorPlat.get(platKey);
    if (!lista) return c;
    const idx = indicesUsados.get(platKey) ?? 0;
    const acceso = lista[idx];
    if (!acceso) return c;
    indicesUsados.set(platKey, idx + 1);
    return {
      ...c,
      correo: acceso.correo,
      contraseña: acceso.contraseña,
      perfil: acceso.perfil,
      pin: acceso.pin,
      fechaExpiracion: acceso.fechaExpiracion ?? c.fechaExpiracion,
    };
  });
}

export function getClientes(): Cliente[] {
  const raw = getFromStorage(STORAGE_USERS, CLIENTES_INICIALES);
  return raw.map((c) => ({
    ...c,
    historialCompras: hidratarHistorialCompras(c.historialCompras, c.correo),
  }));
}

export function setClientes(clientes: Cliente[]): void {
  setInStorage(STORAGE_USERS, clientes);
}

export function getClienteByCorreo(correo: string): Cliente | undefined {
  const clientes = getClientes();
  return clientes.find((c) => c.correo.toLowerCase() === correo.toLowerCase());
}

export function registrarCliente(data: {
  nombre: string;
  correo: string;
  contraseña: string;
  whatsapp?: string;
}): { ok: boolean; error?: string } {
  const clientes = getClientes();
  if (clientes.some((c) => c.correo.toLowerCase() === data.correo.trim().toLowerCase())) {
    return { ok: false, error: "Este correo ya está registrado" };
  }
  const id = String(Date.now());
  const { emoji } = getAvatarParaCliente(id);
  const nuevo: Cliente = {
    id,
    nombre: data.nombre.trim(),
    correo: data.correo.trim(),
    contraseña: data.contraseña,
    whatsapp: data.whatsapp?.trim() || undefined,
    avatarEmoji: emoji,
    saldo: DEFAULT_SALDO,
    historialCompras: [],
  };
  setClientes([...clientes, nuevo]);
  return { ok: true };
}

export function actualizarCliente(
  correo: string,
  updater: (c: Cliente) => Cliente
): void {
  const clientes = getClientes();
  const idx = clientes.findIndex((c) => c.correo.toLowerCase() === correo.toLowerCase());
  if (idx < 0) return;
  const updated = [...clientes];
  updated[idx] = updater(updated[idx]);
  setClientes(updated);
}

// ── Inventario de cuentas ──

export type EstadoPerfil = "disponible" | "ocupado";

export interface Perfil {
  numero: number;
  pin: string;
  estado: EstadoPerfil;
  clienteCorreo?: string;
  fechaAsignacion?: string;
  fechaExpiracion?: string;
}

export interface CuentaPlataforma {
  id: string;
  correo: string;
  contraseña: string;
  perfiles: Perfil[];
}

export interface InventarioPlataforma {
  plataforma: string;
  cuentas: CuentaPlataforma[];
}

const STORAGE_INVENTARIO = "pelis-series-inventario";

const INVENTARIO_INICIAL: InventarioPlataforma[] = [];

export function getInventario(): InventarioPlataforma[] {
  return getFromStorage(STORAGE_INVENTARIO, INVENTARIO_INICIAL);
}

export function setInventario(inv: InventarioPlataforma[]): void {
  setInStorage(STORAGE_INVENTARIO, inv);
}

/** Crea la entrada en inventario si no existe (para sincronizar planes con inventario) */
export function ensureInventarioPlataformaExists(plataforma: string): void {
  const inv = getInventario();
  const nombre = plataforma.trim();
  const existe = inv.some((i) => i.plataforma.toLowerCase() === nombre.toLowerCase());
  if (!existe) {
    inv.push({ plataforma: nombre, cuentas: [] });
    setInventario(inv);
  }
}

/** Devuelve true si ya existe una cuenta con ese correo en la plataforma (mismo correo = no permitido). */
export function correoYaExisteEnPlataforma(plataforma: string, correo: string): boolean {
  const inv = getInventario();
  const plat = inv.find(
    (i) => i.plataforma.toLowerCase() === plataforma.toLowerCase()
  );
  if (!plat) return false;
  return plat.cuentas.some(
    (c) => c.correo.trim().toLowerCase() === correo.trim().toLowerCase()
  );
}

export function agregarCuentaAlInventario(
  plataforma: string,
  cuenta: CuentaPlataforma
): void {
  const inv = getInventario();
  let plat = inv.find(
    (i) => i.plataforma.toLowerCase() === plataforma.toLowerCase()
  );
  if (!plat) {
    plat = { plataforma, cuentas: [] };
    inv.push(plat);
  }
  plat.cuentas.push(cuenta);
  setInventario(inv);
}

export interface PerfilAsignado {
  correo: string;
  contraseña: string;
  perfil: number;
  pin: string;
  fechaExpiracion: string;
  fechaExpiracionISO: string;
}

export function asignarPerfilDisponible(
  plataforma: string,
  clienteCorreo: string
): PerfilAsignado | null {
  const inv = getInventario();
  const plat = inv.find(
    (i) => i.plataforma.toLowerCase() === plataforma.toLowerCase()
  );
  if (!plat) return null;

  for (const cuenta of plat.cuentas) {
    for (const perfil of cuenta.perfiles) {
      if (perfil.estado === "disponible") {
        const now = new Date();
        const exp = new Date(now);
        exp.setDate(exp.getDate() + 30);
        const fechaAct = now.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
        const fechaExp = exp.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });

        perfil.estado = "ocupado";
        perfil.clienteCorreo = clienteCorreo;
        perfil.fechaAsignacion = fechaAct;
        perfil.fechaExpiracion = fechaExp;

        setInventario(inv);

        return {
          correo: cuenta.correo,
          contraseña: cuenta.contraseña,
          perfil: perfil.numero,
          pin: perfil.pin,
          fechaExpiracion: fechaExp,
          fechaExpiracionISO: exp.toISOString(),
        };
      }
    }
  }
  return null;
}

export function contarPerfilesDisponibles(plataforma: string): number {
  const inv = getInventario();
  const plat = inv.find(
    (i) => i.plataforma.toLowerCase() === plataforma.toLowerCase()
  );
  if (!plat) return 0;
  let count = 0;
  for (const cuenta of plat.cuentas) {
    for (const perfil of cuenta.perfiles) {
      if (perfil.estado === "disponible") count++;
    }
  }
  return count;
}

/**
 * Cambia un perfil de ocupado a disponible: limpia cliente asignado en inventario,
 * pone la compra correspondiente del usuario en estado Suspendido y oculta sus datos.
 */
export function liberarPerfilOcupado(
  plataforma: string,
  cuentaId: string,
  cuentaCorreo: string,
  numeroPerfil: number
): boolean {
  const inv = getInventario();
  const plat = inv.find(
    (i) => i.plataforma.toLowerCase() === plataforma.toLowerCase()
  );
  if (!plat) return false;
  const cuenta = plat.cuentas.find((c) => c.id === cuentaId);
  if (!cuenta) return false;
  const perfil = cuenta.perfiles.find((p) => p.numero === numeroPerfil);
  if (!perfil || perfil.estado !== "ocupado" || !perfil.clienteCorreo) return false;

  const clienteCorreo = perfil.clienteCorreo;

  perfil.estado = "disponible";
  perfil.clienteCorreo = undefined;
  perfil.fechaAsignacion = undefined;
  perfil.fechaExpiracion = undefined;
  setInventario(inv);

  const clientes = getClientes();
  const idxCliente = clientes.findIndex(
    (c) => c.correo.toLowerCase() === clienteCorreo.toLowerCase()
  );
  if (idxCliente >= 0) {
    const cliente = clientes[idxCliente];
    const historial = cliente.historialCompras.map((comp) => {
      const coincide =
        comp.plataforma.toLowerCase() === plataforma.toLowerCase() &&
        (comp.correo ?? "").toLowerCase() === cuentaCorreo.toLowerCase() &&
        comp.perfil === numeroPerfil;
      if (!coincide) return comp;
      return {
        ...comp,
        estado: "Suspendido" as const,
        correo: undefined,
        contraseña: undefined,
        perfil: undefined,
        pin: undefined,
      };
    });
    const clienteActualizado = { ...cliente, historialCompras: historial };
    const updated = [...clientes];
    updated[idxCliente] = clienteActualizado;
    setClientes(updated);
  }
  return true;
}

export const ADMIN_USUARIO = "admin";
export const ADMIN_CLAVE = "admin123";

export const DEFAULT_SALDO = 0;
export const DEFAULT_PERFILES = 4;
