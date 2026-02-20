/**
 * Capa de datos. Solo usa Supabase (supabaseData.ts).
 * Si Supabase no está configurado, las funciones devuelven vacío/false.
 */

import { normalizarPlataforma } from "./plataformas";
import * as db from "./supabaseData";
import type { Plan, Cliente, Compra, InventarioPlataforma, CuentaPlataforma } from "./types";

// ─── Planes ───

export async function getPlanes(): Promise<Plan[]> {
  return db.getPlanesFromSupabase();
}

export async function setPlanes(planes: Plan[]): Promise<void> {
  await db.setPlanesInSupabase(planes);
}

export async function updatePlan(plan: Plan): Promise<void> {
  await db.updatePlanInSupabase(plan);
}

export async function deletePlan(planId: string): Promise<void> {
  await db.deletePlanFromSupabase(planId);
}

// ─── Clientes ───

export async function getClientes(): Promise<Cliente[]> {
  return db.getClientesFromSupabase();
}

export async function getClienteByCorreo(correo: string): Promise<Cliente | undefined> {
  return db.getClienteByCorreoFromSupabase(correo);
}

export async function registrarCliente(data: {
  nombre: string;
  correo: string;
  contraseña: string;
  whatsapp?: string;
}): Promise<{ ok: boolean; error?: string }> {
  return db.registrarClienteInSupabase(data);
}

export async function actualizarCliente(
  correo: string,
  updater: (c: Cliente) => Cliente | Partial<Cliente>
): Promise<void> {
  await db.actualizarClienteInSupabase(correo, updater as (c: Cliente) => Partial<Cliente>);
}

// ─── Inventario / Compras ───

export async function asignarPerfilDisponible(
  plataforma: string,
  clienteCorreo: string
): Promise<{ correo: string; contraseña: string; perfil: number; pin: string; fechaExpiracion: string; fechaExpiracionISO: string } | null> {
  const nombreNorm = normalizarPlataforma(plataforma);
  return db.asignarPerfilDisponibleInSupabase(nombreNorm, clienteCorreo);
}

export async function insertarCompra(clienteCorreo: string, compra: Compra): Promise<void> {
  await db.insertarCompraInSupabase(clienteCorreo, compra);
}

export async function contarPerfilesDisponibles(plataforma: string): Promise<number> {
  const nombreNorm = normalizarPlataforma(plataforma);
  return db.contarPerfilesDisponiblesInSupabase(nombreNorm);
}

/** Obtiene disponibilidad de todas las plataformas en una sola llamada */
export async function getDisponibilidadTodasPlataformas(): Promise<Record<string, number>> {
  return db.getDisponibilidadTodasPlataformasInSupabase();
}

// ─── Inventario ───

export async function getInventario(): Promise<InventarioPlataforma[]> {
  return db.getInventarioFromSupabase();
}

export async function setInventario(inv: InventarioPlataforma[]): Promise<void> {
  await db.setInventarioInSupabase(inv);
}

export async function ensureInventarioPlataformaExists(plataforma: string): Promise<void> {
  const nombreNorm = normalizarPlataforma(plataforma);
  await db.ensureInventarioPlataformaExistsInSupabase(nombreNorm);
}

export async function correoYaExisteEnPlataforma(
  plataforma: string,
  correo: string
): Promise<boolean> {
  const nombreNorm = normalizarPlataforma(plataforma);
  return db.correoYaExisteEnPlataformaEnSupabase(nombreNorm, correo);
}

export async function liberarPerfil(
  plataforma: string,
  cuentaId: string,
  cuentaCorreo: string,
  numeroPerfil: number,
  clienteCorreo: string
): Promise<boolean> {
  const nombreNorm = normalizarPlataforma(plataforma);
  return db.liberarPerfilInSupabase(
    nombreNorm,
    cuentaId,
    cuentaCorreo,
    numeroPerfil,
    clienteCorreo
  );
}

export async function eliminarCuentaDelInventario(
  plataforma: string,
  cuentaId: string
): Promise<boolean> {
  const nombreNorm = normalizarPlataforma(plataforma);
  return db.eliminarCuentaDelInventarioInSupabase(nombreNorm, cuentaId);
}

export async function agregarCuentaAlInventario(
  plataforma: string,
  cuenta: CuentaPlataforma
): Promise<void> {
  const nombreNorm = normalizarPlataforma(plataforma);
  await db.agregarCuentaAlInventarioInSupabase(nombreNorm, cuenta);
}

// ─── Re-export ───

export { getAvatarParaCliente } from "./types";
