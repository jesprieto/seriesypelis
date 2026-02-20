/**
 * Lista única oficial de plataformas.
 * Usar en todos los formularios (Crear plataforma, Accesos) para evitar typos.
 */

export const PLATAFORMAS_OFICIALES = [
  "Netflix",
  "Disney+",
  "Prime",
  "Crunchyroll",
  "Paramount+",
  "HBO Max",
  "Directv",
  "Spotify",
  "Vix+",
  "Appletv",
  "Viki rakuten",
  "Youtube Premium",
  "Universal+",
  "Canva",
  "Win Sports+",
] as const;

export type PlataformaOficial = (typeof PLATAFORMAS_OFICIALES)[number];

/** Mapeo de nombres antiguos/variantes a nombre oficial (para unificar datos existentes) */
export const PLATAFORMA_ALIASES: Record<string, string> = {
  "amazon prime": "Prime",
  "prime": "Prime",
  "apple tv+": "Appletv",
  "apple tv": "Appletv",
  "appletv": "Appletv",
  "directv": "Directv",
  "direct tv": "Directv",
  "hbo max": "HBO Max",
  "youtube premium": "Youtube Premium",
  "vix+": "Vix+",
  "viki rakuten": "Viki rakuten",
  "paramount+": "Paramount+",
  "universal+": "Universal+",
  "netflix": "Netflix",
  "disney+": "Disney+",
  "crunchyroll": "Crunchyroll",
  "spotify": "Spotify",
  "canva": "Canva",
  "win sports+": "Win Sports+",
};

/**
 * Normaliza un nombre de plataforma al nombre oficial.
 * Útil para unificar datos existentes con variaciones (Amazon Prime -> Prime).
 */
export function normalizarPlataforma(nombre: string): string {
  const key = nombre.trim().toLowerCase();
  return PLATAFORMA_ALIASES[key] ?? nombre.trim();
}

/** Plataformas que requieren conexión por WhatsApp (no muestran enlaces/accesos) */
const PLATAFORMAS_CONEXION_WHATSAPP = ["Spotify", "Youtube Premium"];

export function requiereConexionWhatsApp(plataforma: string): boolean {
  return PLATAFORMAS_CONEXION_WHATSAPP.some(
    (p) => normalizarPlataforma(plataforma) === p
  );
}
