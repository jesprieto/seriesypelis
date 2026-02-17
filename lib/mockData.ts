export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
}

export type EstadoCompra = "Disponible" | "Expirado";

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

const PLANES_INICIALES: Plan[] = [
  { id: "1", nombre: "Crunchyroll", precio: 1500 },
  { id: "2", nombre: "Netflix", precio: 12000 },
  { id: "3", nombre: "Disney+", precio: 8000 },
  { id: "4", nombre: "HBO Max", precio: 10000 },
  { id: "5", nombre: "Amazon Prime", precio: 7500 },
  { id: "6", nombre: "Apple TV+", precio: 5500 },
  { id: "7", nombre: "Spotify", precio: 5500 },
  { id: "8", nombre: "DIRECTV", precio: 10000 },
  { id: "9", nombre: "Win Sports+", precio: 16000 },
];

const TEST_HISTORIAL: Compra[] = [
  {
    codigo: "45231",
    estado: "Disponible",
    fechaCompra: "10/02/2025, 14:30",
    fechaCompraISO: "2025-02-10T14:30:00.000Z",
    plataforma: "Netflix",
    informacion: "test@...",
    valorCompra: 12000,
    correo: "netflix.cuenta1@gmail.com",
    contraseña: "nfPass2025",
    perfil: 1,
    pin: "1234",
    fechaExpiracion: "12/03/2025",
    fechaExpiracionISO: "2025-03-12T14:30:00.000Z",
  },
  {
    codigo: "78192",
    estado: "Disponible",
    fechaCompra: "08/02/2025, 09:15",
    fechaCompraISO: "2025-02-08T09:15:00.000Z",
    plataforma: "Crunchyroll",
    informacion: "test@...",
    valorCompra: 1500,
    correo: "crunchy.cuenta1@outlook.com",
    contraseña: "crPass2025",
    perfil: 2,
    pin: "2222",
    fechaExpiracion: "10/03/2025",
    fechaExpiracionISO: "2025-03-10T09:15:00.000Z",
  },
  {
    codigo: "92341",
    estado: "Expirado",
    fechaCompra: "15/01/2025, 16:45",
    fechaCompraISO: "2025-01-15T16:45:00.000Z",
    plataforma: "Disney+",
    informacion: "test@...",
    valorCompra: 8000,
    correo: "disney.cuenta1@yahoo.com",
    contraseña: "dpPass2025",
    perfil: 3,
    pin: "300300",
    fechaExpiracion: "14/02/2025",
    fechaExpiracionISO: "2025-02-14T16:45:00.000Z",
  },
];

const CLIENTES_INICIALES: Cliente[] = [
  {
    id: "1",
    nombre: "Test Usuario",
    correo: "test@test.com",
    contraseña: "test123",
    avatarEmoji: "😊",
    saldo: 0,
    historialCompras: TEST_HISTORIAL,
  },
];

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

const INVENTARIO_INICIAL: InventarioPlataforma[] = [
  {
    plataforma: "Netflix",
    cuentas: [
      {
        id: "inv-1",
        correo: "netflix.cuenta1@gmail.com",
        contraseña: "nfPass2025",
        perfiles: [
          { numero: 1, pin: "1234", estado: "ocupado", clienteCorreo: "test@test.com", fechaAsignacion: "10/02/2025", fechaExpiracion: "12/03/2025" },
          { numero: 2, pin: "5678", estado: "disponible" },
          { numero: 3, pin: "9012", estado: "disponible" },
          { numero: 4, pin: "3456", estado: "disponible" },
          { numero: 5, pin: "7890", estado: "disponible" },
          { numero: 6, pin: "2345", estado: "disponible" },
        ],
      },
      {
        id: "inv-2",
        correo: "netflix.cuenta2@gmail.com",
        contraseña: "nfSec2025",
        perfiles: [
          { numero: 1, pin: "111111", estado: "disponible" },
          { numero: 2, pin: "222222", estado: "disponible" },
          { numero: 3, pin: "333333", estado: "disponible" },
          { numero: 4, pin: "444444", estado: "disponible" },
          { numero: 5, pin: "555555", estado: "disponible" },
          { numero: 6, pin: "666666", estado: "disponible" },
        ],
      },
    ],
  },
  {
    plataforma: "Crunchyroll",
    cuentas: [
      {
        id: "inv-3",
        correo: "crunchy.cuenta1@outlook.com",
        contraseña: "crPass2025",
        perfiles: [
          { numero: 1, pin: "1111", estado: "disponible" },
          { numero: 2, pin: "2222", estado: "ocupado", clienteCorreo: "test@test.com", fechaAsignacion: "08/02/2025", fechaExpiracion: "10/03/2025" },
          { numero: 3, pin: "3333", estado: "disponible" },
          { numero: 4, pin: "4444", estado: "disponible" },
          { numero: 5, pin: "5555", estado: "disponible" },
          { numero: 6, pin: "6666", estado: "disponible" },
        ],
      },
    ],
  },
  {
    plataforma: "Disney+",
    cuentas: [
      {
        id: "inv-4",
        correo: "disney.cuenta1@yahoo.com",
        contraseña: "dpPass2025",
        perfiles: [
          { numero: 1, pin: "100100", estado: "disponible" },
          { numero: 2, pin: "200200", estado: "disponible" },
          { numero: 3, pin: "300300", estado: "ocupado", clienteCorreo: "test@test.com", fechaAsignacion: "15/01/2025", fechaExpiracion: "14/02/2025" },
          { numero: 4, pin: "400400", estado: "disponible" },
          { numero: 5, pin: "500500", estado: "disponible" },
          { numero: 6, pin: "600600", estado: "disponible" },
        ],
      },
    ],
  },
];

export function getInventario(): InventarioPlataforma[] {
  return getFromStorage(STORAGE_INVENTARIO, INVENTARIO_INICIAL);
}

export function setInventario(inv: InventarioPlataforma[]): void {
  setInStorage(STORAGE_INVENTARIO, inv);
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

export const ADMIN_USUARIO = "admin";
export const ADMIN_CLAVE = "admin123";

export const DEFAULT_SALDO = 0;
export const DEFAULT_PERFILES = 4;
