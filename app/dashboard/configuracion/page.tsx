"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import HeaderCards from "@/components/dashboard/HeaderCards";
import { getAvatarParaCliente, getClienteByCorreo } from "@/lib/data";
import type { Cliente } from "@/lib/types";

export default function ConfiguracionPage() {
  const { saldo, historialCompras, user, nombrePerfil, avatarEmoji, perfilPrecio, updatePerfil, refreshCliente } = useAuth();
  const [nombre, setNombre] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  useEffect(() => {
    if (user) {
      getClienteByCorreo(user).then((c) => {
        setCliente(c ?? null);
        if (!nombrePerfil && c) setNombre(c.nombre);
        else if (!nombrePerfil && !c) setNombre(user?.split("@")[0] ?? "");
      });
    }
  }, [user]);
  useEffect(() => {
    if (nombrePerfil) setNombre(nombrePerfil);
  }, [nombrePerfil]);
  const [contraseñaActual, setContraseñaActual] = useState("");
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const avatar = avatarEmoji ?? (cliente ? getAvatarParaCliente(cliente.id).emoji : "🙂");
  const avatarColor = cliente ? getAvatarParaCliente(cliente.id).color : "bg-orange-100";

  const handleSubmitNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    const r = await updatePerfil({ nombre: nombre.trim() || undefined });
    if (r.ok) {
      setMensaje({ tipo: "ok", text: "Nombre actualizado" });
    } else {
      setMensaje({ tipo: "error", text: r.error ?? "Error" });
    }
  };

  const handleSubmitContraseña = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    if (nuevaContraseña !== confirmarContraseña) {
      setMensaje({ tipo: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    const r = await updatePerfil({
      contraseñaActual,
      nuevaContraseña,
    });
    if (r.ok) {
      setMensaje({ tipo: "ok", text: "Contraseña actualizada" });
      setContraseñaActual("");
      setNuevaContraseña("");
      setConfirmarContraseña("");
    } else {
      setMensaje({ tipo: "error", text: r.error ?? "Error" });
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Configuración
        </h1>
        <HeaderCards historialCompras={historialCompras} saldo={saldo} onRefresh={refreshCliente} />
      </div>

      <div className="max-w-xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi perfil</h2>

          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-16 h-16 rounded-full ${avatarColor} flex items-center justify-center text-3xl shrink-0`}
              title="Avatar (no editable)"
            >
              {avatar}
            </div>
            <div className="text-sm text-gray-500">
              <p>Tu avatar se asigna automáticamente y no puede cambiarse.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitNombre} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre para mostrar
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Este nombre solo se muestra en tu perfil. No afecta la base de datos.
              </p>
            </div>
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              Guardar nombre
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Perfil de precios</h2>
          <p className="text-sm text-gray-600 mb-3">
            Selecciona si eres mayorista o compras al detal. Esto afecta los precios que ves en las plataformas.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updatePerfil({ perfilPrecio: "mayorista" })}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                perfilPrecio === "mayorista"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Mayorista
            </button>
            <button
              type="button"
              onClick={() => updatePerfil({ perfilPrecio: "detal" })}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                perfilPrecio === "detal"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Detal
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de cuenta</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input
              type="email"
              value={user ?? ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">El correo no puede modificarse.</p>
          </div>

          <form onSubmit={handleSubmitContraseña} className="space-y-4">
            <h3 className="font-medium text-gray-800">Cambiar contraseña</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña actual
              </label>
              <input
                type="password"
                value={contraseñaActual}
                onChange={(e) => setContraseñaActual(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nuevaContraseña}
                onChange={(e) => setNuevaContraseña(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              />
            </div>
            <button
              type="submit"
              disabled={!contraseñaActual || !nuevaContraseña || !confirmarContraseña}
              className="py-2.5 px-4 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cambiar contraseña
            </button>
          </form>
        </div>

        {mensaje && (
          <div
            className={`py-3 px-4 rounded-xl text-sm ${
              mensaje.tipo === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
            }`}
          >
            {mensaje.text}
          </div>
        )}
      </div>
    </div>
  );
}
