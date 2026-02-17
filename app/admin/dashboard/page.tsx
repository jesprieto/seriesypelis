"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { LogOut, LayoutDashboard } from "lucide-react";
import CrearPlataformaTab from "@/components/admin/CrearPlataformaTab";
import ClientesTab from "@/components/admin/ClientesTab";
import AccesosTab from "@/components/admin/AccesosTab";

type TabId = "plataformas" | "clientes" | "accesos";

export default function AdminDashboardPage() {
  const { isAdmin, isLoading, logout } = useAdmin();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("plataformas");

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/admin/login");
    }
  }, [isAdmin, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: "plataformas" as const, label: "Crear plataforma" },
    { id: "clientes" as const, label: "Clientes" },
    { id: "accesos" as const, label: "Accesos" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/planes"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-medium">Ir al sitio</span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
        <div className="flex gap-1 px-6 border-t border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {activeTab === "plataformas" && <CrearPlataformaTab />}
        {activeTab === "clientes" && <ClientesTab />}
        {activeTab === "accesos" && <AccesosTab />}
      </main>
    </div>
  );
}
