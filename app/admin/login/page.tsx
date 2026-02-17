"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import Image from "next/image";

export default function AdminLoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const { login, isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!usuario.trim() || !clave.trim()) {
      setError("Ingresa usuario y contraseña");
      return;
    }
    const ok = login(usuario, clave);
    if (ok) {
      router.replace("/admin/dashboard");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (isAdmin) {
    router.replace("/admin/dashboard");
    return null;
  }

  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 select-none pointer-events-none opacity-40 blur-2xl">
        <div className="absolute top-[8%] left-[3%] w-48 h-48">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-[10%] right-[5%] w-60 h-60">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="w-full max-w-md mx-4 relative z-10">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-100/80 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-gray-200/50"
        >
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/logo.png"
              alt="Pelis & Series"
              width={220}
              height={96}
              className="object-contain mb-2"
            />
            <h2 className="text-lg font-semibold text-gray-700">Panel de Administración</h2>
          </div>
          {error && (
            <div className="mb-4 py-2 px-4 rounded-xl bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-[#FFA500] hover:bg-orange-600 transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}
