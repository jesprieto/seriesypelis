/**
 * En el subdominio admin (admin.seriesypelis.lat) las rutas son cortas: /login, /dashboard.
 * En localhost o dominio principal usamos /admin/login, /admin/dashboard.
 */
const ADMIN_HOST = "admin.seriesypelis.lat";

export function getAdminBasePath(): string {
  if (typeof window === "undefined") return "/admin";
  return window.location.hostname === ADMIN_HOST ? "" : "/admin";
}

export function adminPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return `/admin${p}`.replace("//", "/");
  const base = window.location.hostname === ADMIN_HOST ? "" : "/admin";
  return `${base}${p}`.replace("//", "/");
}
