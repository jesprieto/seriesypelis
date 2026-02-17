"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoginLogo from "./LoginLogo";

export default function LoginForm() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !clave.trim()) return;
    login(correo, clave);
    // No navegar aquí: el setState es asíncrono. La página principal
    // redirige en su useEffect cuando isAuthenticated cambia.
  };

  return (
    <div className="w-full max-w-[320px] sm:max-w-sm mx-4 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full bg-gray-100/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-200/50"
      >
        <LoginLogo compact />
        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              placeholder="clave"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FFA500] hover:bg-orange-600 transition-colors"
        >
          Ingresar
        </button>
        <p className="mt-3 text-center text-gray-500 text-xs">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="text-gray-700 font-medium hover:underline"
          >
            Regístrate
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            Acceso administrador
          </Link>
        </p>
      </form>
    </div>
  );
}
