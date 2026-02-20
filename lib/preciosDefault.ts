/**
 * Precios por defecto al por mayor y al detal por plataforma.
 * Mapeado a nombres oficiales de PLATAFORMAS_OFICIALES.
 */

import { normalizarPlataforma } from "./plataformas";
import type { Plan, PerfilPrecio } from "./types";

export interface PreciosPlataforma {
  mayorista: number;
  detal: number;
}

/** Precios por defecto (mayorista, detal) - clave = nombre normalizado */
const PRECIOS_POR_PLATAFORMA: Record<string, PreciosPlataforma> = {
  netflix: { mayorista: 13000, detal: 15000 },
  "disney+": { mayorista: 13000, detal: 15000 },
  prime: { mayorista: 10000, detal: 12000 },
  "hbo max": { mayorista: 8000, detal: 11000 },
  "paramount+": { mayorista: 7000, detal: 9000 },
  crunchyroll: { mayorista: 6000, detal: 10000 },
  appletv: { mayorista: 8000, detal: 10000 },
  "vix+": { mayorista: 8000, detal: 10000 },
  "viki rakuten": { mayorista: 10500, detal: 10000 },
  directv: { mayorista: 10000, detal: 12000 },
  "universal+": { mayorista: 8000, detal: 10000 },
  canva: { mayorista: 6000, detal: 8000 },
  "win sports+": { mayorista: 16000, detal: 18000 },
  spotify: { mayorista: 5500, detal: 6500 },
  "youtube premium": { mayorista: 8000, detal: 10000 },
};

export function getPreciosDefault(plataforma: string): PreciosPlataforma {
  const key = normalizarPlataforma(plataforma).toLowerCase();
  return PRECIOS_POR_PLATAFORMA[key] ?? { mayorista: 10000, detal: 12000 };
}

/** Obtiene el precio efectivo de un plan según el perfil del usuario */
export function getPrecioEfectivo(plan: Plan, perfilPrecio: PerfilPrecio): number {
  if (plan.precioMayorista != null && plan.precioDetal != null) {
    return perfilPrecio === "mayorista" ? plan.precioMayorista : plan.precioDetal;
  }
  const def = getPreciosDefault(plan.nombre);
  return perfilPrecio === "mayorista" ? def.mayorista : def.detal;
}
