import type { Compra } from "./mockData";

const DIAS_EXPIRACION = 30;

export function esCompraDisponible(compra: Compra): boolean {
  if (compra.estado === "Expirado" || compra.estado === "Suspendido") return false;
  if (compra.fechaCompraISO) {
    const fecha = new Date(compra.fechaCompraISO);
    const ahora = new Date();
    const dias = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);
    if (dias > DIAS_EXPIRACION) return false;
  }
  return compra.estado === "Disponible";
}

export function getPlataformasActivas(historialCompras: Compra[]): string[] {
  return historialCompras
    .filter(esCompraDisponible)
    .map((c) => c.plataforma)
    .filter((p, i, arr) => arr.indexOf(p) === i);
}
