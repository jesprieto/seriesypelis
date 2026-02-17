"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  DEFAULT_SALDO,
  getClientes,
  setClientes,
  getAvatarParaCliente,
} from "@/lib/mockData";
import {
  getClienteByCorreo,
  actualizarCliente,
  asignarPerfilDisponible as asignarPerfilData,
  insertarCompra,
  registrarCliente,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Compra, Plan } from "@/lib/mockData";

const STORAGE_KEY = "pelis-series-auth";
const PERFIL_KEY_PREFIX = "pelis-series-perfil-";

function generateCodigo(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function generateInformacion(userEmail: string): string {
  const local = userEmail.split("@")[0] || "user";
  return `${local}@...`;
}

function formatoFecha(date: Date): string {
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AuthState {
  user: string | null;
  saldo: number;
  isAuthenticated: boolean;
  historialCompras: Compra[];
  nombrePerfil: string | null;
  avatarEmoji: string | null;
}

interface AuthContextType extends AuthState {
  isLoading: boolean;
  login: (correo: string, clave: string) => void;
  logout: () => void;
  comprarPlan: (plan: Plan) => Promise<Compra | null>;
  updatePerfil: (opciones: { nombre?: string; contraseñaActual?: string; nuevaContraseña?: string }) => Promise<{ ok: boolean; error?: string }>;
  refreshCliente: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  saldo: DEFAULT_SALDO,
  isAuthenticated: false,
  historialCompras: [],
  nombrePerfil: null,
  avatarEmoji: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const historial = Array.isArray(parsed.historialCompras) ? parsed.historialCompras : [];
        let nombrePerfilVal = parsed.nombrePerfil ?? null;
        if (!nombrePerfilVal && parsed.user && typeof window !== "undefined") {
          try {
            nombrePerfilVal = localStorage.getItem(PERFIL_KEY_PREFIX + parsed.user);
          } catch {
            // ignore
          }
        }
        setState({
          user: parsed.user,
          saldo: parsed.saldo ?? DEFAULT_SALDO,
          isAuthenticated: !!parsed.user,
          historialCompras: historial,
          nombrePerfil: nombrePerfilVal,
          avatarEmoji: parsed.avatarEmoji ?? null,
        });
      } catch {
        // invalid stored data
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (state.isAuthenticated) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: state.user,
          saldo: state.saldo,
          historialCompras: state.historialCompras,
          nombrePerfil: state.nombrePerfil,
          avatarEmoji: state.avatarEmoji,
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state, mounted]);

  const refreshCliente = async () => {
    if (!state.user) return;
    const cliente = await getClienteByCorreo(state.user);
    if (cliente) {
      setState((prev) => ({
        ...prev,
        saldo: cliente.saldo,
        historialCompras: cliente.historialCompras,
        avatarEmoji: cliente.avatarEmoji ?? prev.avatarEmoji,
      }));
    }
  };

  useEffect(() => {
    if (!mounted || !state.isAuthenticated || !state.user) return;
    const onFocus = () => refreshCliente();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [mounted, state.isAuthenticated, state.user]);

  const login = async (correo: string, clave: string) => {
    if (!correo.trim() || !clave.trim()) return;
    const correoTrim = correo.trim();
    const cliente = await getClienteByCorreo(correoTrim);
    if (cliente) {
      const avatar = cliente.avatarEmoji ?? getAvatarParaCliente(cliente.id).emoji;
      if (!cliente.avatarEmoji) {
        await actualizarCliente(correoTrim, (c) => ({ ...c, avatarEmoji: avatar }));
      }
      let savedNombre: string | null = null;
      if (typeof window !== "undefined") {
        try {
          savedNombre = localStorage.getItem(PERFIL_KEY_PREFIX + correoTrim);
        } catch {
          // ignore
        }
      }
      setState({
        user: correoTrim,
        saldo: cliente.saldo,
        isAuthenticated: true,
        historialCompras: cliente.historialCompras,
        nombrePerfil: savedNombre,
        avatarEmoji: avatar,
      });
    } else {
      const newId = String(Date.now());
      const { emoji } = getAvatarParaCliente(newId);
      const nombre = correoTrim.split("@")[0] || "Usuario";
      if (isSupabaseConfigured()) {
        const res = await registrarCliente({ nombre, correo: correoTrim, contraseña: clave });
        if (!res.ok) return;
      } else {
        const newCliente = {
          id: newId,
          nombre,
          correo: correoTrim,
          contraseña: clave,
          avatarEmoji: emoji,
          saldo: DEFAULT_SALDO,
          historialCompras: [] as Compra[],
        };
        setClientes([...getClientes(), newCliente]);
      }
      setState({
        user: correoTrim,
        saldo: DEFAULT_SALDO,
        isAuthenticated: true,
        historialCompras: [],
        nombrePerfil: null,
        avatarEmoji: emoji,
      });
    }
  };

  const logout = () => {
    setState(initialState);
  };

  const comprarPlan = async (plan: Plan): Promise<Compra | null> => {
    if (state.saldo < plan.precio) return null;

    const asignado = await asignarPerfilData(plan.nombre, state.user || "desconocido");
    if (!asignado) return null;

    const now = new Date();
    const nuevaCompra: Compra = {
      codigo: generateCodigo(),
      estado: "Disponible",
      fechaCompra: formatoFecha(now),
      fechaCompraISO: now.toISOString(),
      plataforma: plan.nombre,
      informacion: state.user ? generateInformacion(state.user) : "-",
      valorCompra: plan.precio,
      correo: asignado.correo,
      contraseña: asignado.contraseña,
      perfil: asignado.perfil,
      pin: asignado.pin,
      fechaExpiracion: asignado.fechaExpiracion,
      fechaExpiracionISO: asignado.fechaExpiracionISO,
    };
    setState((prev) => ({
      ...prev,
      saldo: prev.saldo - plan.precio,
      historialCompras: [nuevaCompra, ...prev.historialCompras],
    }));
    if (state.user) {
      // Solo actualizar saldo en la tabla clientes (NO tocar historialCompras para evitar duplicados)
      await actualizarCliente(state.user, (c) => ({
        ...c,
        saldo: c.saldo - plan.precio,
      }));
      // Insertar la compra UNA sola vez en la tabla compras
      await insertarCompra(state.user, nuevaCompra);
    }
    return nuevaCompra;
  };

  const updatePerfil = async (opciones: {
    nombre?: string;
    contraseñaActual?: string;
    nuevaContraseña?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (!state.user) return { ok: false, error: "No hay sesión activa" };
    if (opciones.nombre !== undefined) {
      const val = opciones.nombre?.trim() || null;
      setState((prev) => ({ ...prev, nombrePerfil: val }));
      if (typeof window !== "undefined") {
        if (val) localStorage.setItem(PERFIL_KEY_PREFIX + state.user!, val);
        else localStorage.removeItem(PERFIL_KEY_PREFIX + state.user!);
      }
    }
    if (opciones.nuevaContraseña !== undefined) {
      if (!opciones.contraseñaActual || !opciones.nuevaContraseña) {
        return { ok: false, error: "Contraseña actual y nueva son requeridas" };
      }
      const cliente = await getClienteByCorreo(state.user);
      if (!cliente) return { ok: false, error: "Cliente no encontrado" };
      if (cliente.contraseña !== opciones.contraseñaActual) {
        return { ok: false, error: "La contraseña actual no es correcta" };
      }
      if (opciones.nuevaContraseña.length < 4) {
        return { ok: false, error: "La nueva contraseña debe tener al menos 4 caracteres" };
      }
      await actualizarCliente(state.user, (c) => ({
        ...c,
        contraseña: opciones.nuevaContraseña!,
      }));
    }
    return { ok: true };
  };

  useEffect(() => {
    if (mounted && state.isAuthenticated && state.user && isSupabaseConfigured()) {
      refreshCliente();
    }
  }, [mounted, state.isAuthenticated, state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isLoading: !mounted,
        login,
        logout,
        comprarPlan,
        updatePerfil,
        refreshCliente,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
