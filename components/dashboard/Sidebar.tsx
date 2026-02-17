"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Tag, Clock, Settings, Maximize2, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAvatarParaCliente } from "@/lib/types";

const navItems = [
  { href: "/dashboard/planes", label: "Planes", icon: "/store.svg" },
  { href: "/dashboard/historial", label: "Historial de compras", icon: Clock },
  { href: "/dashboard/promociones", label: "Promociones", icon: Tag },
  { href: "/dashboard/ruleta", label: "Ruleta", icon: "/wheel.svg" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, nombrePerfil, nombreCliente, avatarEmoji, logout } = useAuth();
  const avatar = avatarEmoji ?? (user ? getAvatarParaCliente(user).emoji : "🙂");
  const avatarColor = user ? getAvatarParaCliente(user).color : "bg-orange-100";
  const nombreMostrar = nombrePerfil || nombreCliente || user?.split("@")[0] || "Usuario";
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.replace("/");
  };

  const sidebarContent = (
    <>
      <div className="p-4 pt-6">
        <div
          className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-2xl mx-auto mb-2 shrink-0`}
        >
          {avatar}
        </div>
        <p className="text-center text-gray-700 text-sm font-medium truncate px-2" title={nombreMostrar}>
          {nombreMostrar}
        </p>
        <p className="text-center text-gray-400 text-xs truncate px-2" title={user || ""}>
          {user || ""}
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full mt-2 py-2 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const isImageIcon = typeof icon === "string";
          const IconLucide = !isImageIcon ? (icon as React.ComponentType<{ className?: string }>) : null;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-orange-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {isImageIcon ? (
                <Image
                  src={icon as string}
                  alt={label}
                  width={20}
                  height={20}
                  className="w-5 h-5 shrink-0 opacity-70"
                />
              ) : (
                IconLucide && <IconLucide className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-2 mb-2">
        <div className="h-24 rounded-lg bg-gray-100 flex items-start justify-end p-2 border border-gray-200">
          <Maximize2 className="w-5 h-5 text-gray-500" />
        </div>
      </div>
      <div className="p-2">
        <Link
          href="/dashboard/configuracion"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">Configuración</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`w-64 min-h-screen bg-white md:bg-gray-100 border-r border-gray-200 flex flex-col shrink-0 fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out md:transform-none shadow-xl md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="font-semibold">Menú</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
