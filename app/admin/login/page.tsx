"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import Image from "next/image";
import { adminPath } from "@/lib/adminPaths";

export default function AdminLoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [verificando, setVerificando] = useState(false);
  const { login, isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!usuario.trim() || !clave.trim()) {
      setError("Ingresa usuario y contraseña");
      return;
    }
    setVerificando(true);
    try {
      const ok = await login(usuario, clave);
      if (ok) {
        router.replace(adminPath("/dashboard"));
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } finally {
      setVerificando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (isAdmin) {
    router.replace(adminPath("/dashboard"));
    return null;
  }

  const YOUTUBE_VIDEO_ID = "VyqwHgZIe7M";
  const YOUTUBE_EMBED = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&rel=0&modestbranding=1`;

  return (
    <main className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      {/* Video de fondo YouTube en loop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <iframe
          src={YOUTUBE_EMBED}
          title="Video de fondo"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "100vw",
            height: "56.25vw",
            minHeight: "100vh",
            minWidth: "177.78vh",
          }}
        />
      </div>
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/40 z-[1]" aria-hidden />
      {/* Decoración: crispetas desenfocadas */}
      <div className="absolute inset-0 select-none pointer-events-none z-[1]" aria-hidden>
        <div className="absolute top-[8%] left-[3%] w-32 h-32 sm:w-40 sm:h-40 opacity-20 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-[10%] right-[5%] w-40 h-40 sm:w-48 sm:h-48 opacity-20 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute top-[40%] right-[20%] w-36 h-36 opacity-15 blur-2xl">
          <img src="/crispetas.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="w-full max-w-[280px] sm:max-w-[320px] relative z-10">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl p-4 sm:p-5 shadow-xl border border-white/20 overflow-hidden"
        >
          {/* Fondo tipo liquid crystal - solo el bg de la tarjeta, sin afectar logo/campos/botones */}
          <div
            className="absolute inset-0 rounded-2xl backdrop-blur-[28px] bg-white/10"
            style={{ zIndex: -1 }}
            aria-hidden
          />
          <div className="flex flex-col items-center mb-4 sm:mb-5">
            <Image
              src="/logo.png"
              alt="Pelis & Series"
              width={160}
              height={70}
              className="object-contain w-[140px] sm:w-[160px] h-auto mb-1.5"
            />
            <h2 className="text-sm sm:text-base font-semibold text-gray-800">Panel de Administración</h2>
          </div>
          {error && (
            <div className="mb-3 py-1.5 px-3 rounded-lg bg-red-100 text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="Contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={verificando}
            className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FFA500] hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {verificando ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
