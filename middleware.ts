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

  // Dominio principal: /admin* → redirigir al subdominio admin (con rutas cortas)
  if (isMain && pathname.startsWith("/admin")) {
    const url = new URL(request.url);
    url.host = ADMIN_HOST;
    url.port = "";
    url.protocol = "https:";
    if (pathname === "/admin" || pathname === "/admin/") {
      url.pathname = "/dashboard";
    } else if (pathname === "/admin/login") {
      url.pathname = "/login";
    } else if (pathname === "/admin/dashboard") {
      url.pathname = "/dashboard";
    } else {
      url.pathname = pathname.replace(/^\/admin/, "") || "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Subdominio admin: rutas cortas
  if (isAdmin) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname === "/dashboard") {
      return NextResponse.rewrite(new URL("/admin/dashboard", request.url));
    }
    if (pathname === "/login") {
      return NextResponse.rewrite(new URL("/admin/login", request.url));
    }
    // Redirigir /admin, /admin/login, /admin/dashboard a la versión corta
    if (pathname === "/admin" || pathname === "/admin/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (pathname === "/admin/dashboard") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/admin", "/admin/:path*"],
};
