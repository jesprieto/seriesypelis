/**
 * Tipos y utilidades compartidas. Los datos provienen siempre de Supabase (lib/data.ts → supabaseData.ts).
 */

export interface Plan {
  id: string;
  nombre: string;
  precio: number;
  precioMayorista?: number;
  precioDetal?: number;
  imagen?: string;
  promo?: boolean;
}

export type PerfilPrecio = "mayorista" | "detal";

export type EstadoCompra = "Disponible" | "Expirado" | "Suspendido";

export interface Compra {
  codigo: string;
  codigoHex?: string;
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
  perfilPrecio?: PerfilPrecio;
  historialCompras: Compra[];
}

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

export interface PerfilAsignado {
  correo: string;
  contraseña: string;
  perfil: number;
  pin: string;
  fechaExpiracion: string;
  fechaExpiracionISO: string;
}

export const DEFAULT_SALDO = 0;
export const DEFAULT_PERFILES = 4;
