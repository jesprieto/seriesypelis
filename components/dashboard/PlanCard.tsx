"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plan } from "@/lib/mockData";
import { contarPerfilesDisponibles } from "@/lib/data";
import PurchaseModal from "./PurchaseModal";

interface PlanCardProps {
  plan: Plan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [perfilesDisponibles, setPerfilesDisponibles] = useState<number | null>(null);
  const [imagenRota, setImagenRota] = useState(false);
  useEffect(() => {
    setPerfilesDisponibles(null);
    contarPerfilesDisponibles(plan.nombre).then(setPerfilesDisponibles);
  }, [plan.nombre]);
  useEffect(() => {
    setImagenRota(false);
  }, [plan.imagen]);
  const cargando = perfilesDisponibles === null;
  const agotado = !cargando && perfilesDisponibles === 0;

  const formattedPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(plan.precio);

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
            {cargando ? "..." : agotado ? "Agotado" : "Comprar"}
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{plan.nombre}</h3>
            <span className="text-sm font-medium text-orange-600">{formattedPrecio}</span>
          </div>
        </div>
      </div>
      <PurchaseModal
        plan={plan}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
