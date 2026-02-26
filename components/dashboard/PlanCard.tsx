"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { normalizarPlataforma } from "@/lib/plataformas";
import { getPrecioEfectivo } from "@/lib/preciosDefault";
import type { Plan } from "@/lib/types";
import { contarPerfilesDisponibles } from "@/lib/data";
import PurchaseModal from "./PurchaseModal";

interface PlanCardProps {
  plan: Plan;
  /** Disponibilidad pre-cargada (evita llamada individual) */
  disponibilidadPrecargada?: Record<string, number>;
}

export default function PlanCard({ plan, disponibilidadPrecargada }: PlanCardProps) {
  const { perfilPrecio } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [perfilesDisponibles, setPerfilesDisponibles] = useState<number | null>(null);
  const [mostrarCargando, setMostrarCargando] = useState(false);
  const [imagenRota, setImagenRota] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (disponibilidadPrecargada) {
      const key = normalizarPlataforma(plan.nombre);
      const val = disponibilidadPrecargada[key];
      setPerfilesDisponibles(typeof val === "number" ? val : 0);
      return;
    }
    setPerfilesDisponibles(null);
    setMostrarCargando(false);
    timeoutRef.current = setTimeout(() => setMostrarCargando(true), 2000);
    contarPerfilesDisponibles(plan.nombre).then((n) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPerfilesDisponibles(n);
    });
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [plan.nombre, disponibilidadPrecargada]);
  useEffect(() => {
    setImagenRota(false);
  }, [plan.imagen]);
  const cargando = perfilesDisponibles === null;
  const agotado = !cargando && perfilesDisponibles === 0;
  const textoBoton = cargando
    ? mostrarCargando
      ? "Cargando"
      : "..."
    : agotado
      ? "Agotado"
      : "Comprar";

  const precioEfectivo = getPrecioEfectivo(plan, perfilPrecio);
  const formattedPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(precioEfectivo);

  return (
    <>
      <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
        <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center relative overflow-hidden">
          {plan.imagen && !imagenRota ? (
            <img
              src={plan.imagen}
              alt={plan.nombre}
              className="w-full h-full object-cover"
              onError={() => setImagenRota(true)}
            />
          ) : (
            <Image
              src="/store.svg"
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 opacity-70"
            />
          )}
          <button
            onClick={() => !agotado && !cargando && setModalOpen(true)}
            disabled={agotado || cargando}
            className={`absolute bottom-2 right-2 py-2 px-4 rounded-lg font-medium text-sm shadow-md transition-colors ${
              cargando
                ? "bg-gray-300 text-white cursor-wait"
                : agotado
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white hover:animate-bounce-subtle"
            }`}
          >
            {textoBoton}
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{plan.nombre}</h3>
              <span className="text-sm font-medium text-orange-600">{formattedPrecio}</span>
            </div>
            <div className="text-sm text-gray-500">
              {cargando ? (
                mostrarCargando ? "Cargando..." : "..."
              ) : (
                <>{perfilesDisponibles} {perfilesDisponibles === 1 ? "unidad" : "unidades"} disponible{perfilesDisponibles !== 1 ? "s" : ""}</>
              )}
            </div>
          </div>
        </div>
      </div>
      <PurchaseModal
        plan={{ ...plan, precio: precioEfectivo }}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
