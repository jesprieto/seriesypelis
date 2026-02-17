/**
 * Capa de datos unificada.
 * Usa Supabase cuando está configurado, sino localStorage (mockData).
 */

import { isSupabaseConfigured } from "./supabase";
import * as mock from "./mockData";
import * as db from "./supabaseData";
import type { Plan, Cliente, Compra } from "./mockData";

// ─── Planes ───

export async function getPlanes(): Promise<Plan[]> {
  if (isSupabaseConfigured()) return db.getPlanesFromSupabase();
  return mock.getPlanes();
}

export async function setPlanes(planes: Plan[]): Promise<void> {
  if (isSupabaseConfigured()) {
    await db.setPlanesInSupabase(planes);
  } else {
    mock.setPlanes(planes);
  }
}

// ─── Clientes ───

export async function getClientes(): Promise<Cliente[]> {
  if (isSupabaseConfigured()) return db.getClientesFromSupabase();
  return mock.getClientes();
}

export async function getClienteByCorreo(correo: string): Promise<Cliente | undefined> {
  if (isSupabaseConfigured()) return db.getClienteByCorreoFromSupabase(correo);
  return mock.getClienteByCorreo(correo);
}

export async function registrarCliente(data: {
  nombre: string;
  correo: string;
  contraseña: string;
  whatsapp?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured()) return db.registrarClienteInSupabase(data);
  return mock.registrarCliente(data);
}

export async function actualizarCliente(
  correo: string,
  updater: (c: Cliente) => Cliente | Partial<Cliente>
): Promise<void> {
  if (isSupabaseConfigured()) {
    await db.actualizarClienteInSupabase(correo, updater as (c: Cliente) => Partial<Cliente>);
  } else {
    mock.actualizarCliente(correo, updater as (c: Cliente) => Cliente);
  }
}

// ─── Inventario / Compras ───

export async function asignarPerfilDisponible(
  plataforma: string,
  clienteCorreo: string
): Promise<{ correo: string; contraseña: string; perfil: number; pin: string; fechaExpiracion: string; fechaExpiracionISO: string } | null> {
  if (isSupabaseConfigured()) return db.asignarPerfilDisponibleInSupabase(plataforma, clienteCorreo);
  return mock.asignarPerfilDisponible(plataforma, clienteCorreo);
}

export async function insertarCompra(clienteCorreo: string, compra: Compra): Promise<void> {
  if (isSupabaseConfigured()) {
    await db.insertarCompraInSupabase(clienteCorreo, compra);
  }
}

export async function contarPerfilesDisponibles(plataforma: string): Promise<number> {
  if (isSupabaseConfigured()) return db.contarPerfilesDisponiblesInSupabase(plataforma);
  return mock.contarPerfilesDisponibles(plataforma);
}

// ─── Otros (re-export) ───

export { getAvatarParaCliente } from "./mockData";
