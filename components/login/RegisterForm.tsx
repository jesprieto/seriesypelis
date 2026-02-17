"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock } from "lucide-react";
import { registrarCliente } from "@/lib/mockData";
import LoginLogo from "./LoginLogo";

export default function RegisterForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [error, setError] = useState("");
  const [exitoso, setExitoso] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) {
      setError("El nombre completo es obligatorio");
      return;
    }
    if (!correo.trim()) {
      setError("El correo es obligatorio");
      return;
    }
    if (!contraseña) {
      setError("La contraseña es obligatoria");
      return;
    }
    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (contraseña.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    const resultado = registrarCliente({
      nombre: nombre.trim(),
      correo: correo.trim(),
      contraseña,
      whatsapp: whatsapp.trim() || undefined,
    });
    if (!resultado.ok) {
      setError(resultado.error ?? "Error al registrar");
      return;
    }
    setExitoso(true);
    setTimeout(() => router.replace("/"), 2000);
  };

  if (exitoso) {
    return (
      <div className="w-full max-w-[320px] sm:max-w-sm mx-4 flex justify-center">
        <div className="w-full bg-gray-100/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-200/50 text-center">
          <LoginLogo compact />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
            <span className="text-2xl text-green-600">✓</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Registro exitoso</h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-4">
            Redirigiendo a la página principal...
          </p>
          <Link
            href="/"
            className="inline-block py-2.5 px-5 rounded-xl text-sm font-medium text-white bg-[#FFA500] hover:bg-orange-600 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[320px] sm:max-w-sm mx-4 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full bg-gray-100/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-200/50"
      >
        <LoginLogo compact />
        <h2 className="text-base font-semibold text-gray-900 mb-3 text-center">
          Crear cuenta
        </h2>
        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              placeholder="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmarContraseña}
              onChange={(e) => setConfirmarContraseña(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
        </div>
        {error && (
          <div className="mt-3 py-2 px-3 rounded-lg text-xs bg-red-100 text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FFA500] hover:bg-orange-600 transition-colors"
        >
          Registrarme
        </button>
        <p className="mt-3 text-center text-gray-500 text-xs">
          ¿Ya tienes cuenta?{" "}
          <Link href="/" className="text-gray-700 font-medium hover:underline">
            Ingresar
          </Link>
        </p>
      </form>
    </div>
  );
}
