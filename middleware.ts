import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAIN_HOST = "seriesypelis.lat";
const ADMIN_HOST = "admin.seriesypelis.lat";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.replace(/:\d+$/, "") ?? "";
  const pathname = request.nextUrl.pathname;
  const isMain = host === MAIN_HOST;
  const isAdmin = host === ADMIN_HOST;

  // En localhost no redirigir (desarrollo)
  if (host.startsWith("localhost")) {
    return NextResponse.next();
  }

  // Si entran al dominio principal por /admin → redirigir al subdominio admin
  if (isMain && pathname.startsWith("/admin")) {
    const url = new URL(request.url);
    url.host = ADMIN_HOST;
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  // Si entran al subdominio admin en la raíz / → mostrar entrada admin
  if (isAdmin && pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin", "/admin/:path*"],
};
