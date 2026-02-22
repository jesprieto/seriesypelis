"use client";

import { useState } from "react";
import Image from "next/image";
import type { Combo } from "@/lib/types";
import ComboPurchaseModal from "./ComboPurchaseModal";

interface ComboCardProps {
  combo: Combo;
}

export default function ComboCard({ combo }: ComboCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [imagenRota, setImagenRota] = useState(false);

  const formattedPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(combo.precio);

  return (
    <>
      <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
        <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center relative overflow-hidden">
          {combo.imagen && !imagenRota ? (
            <img
              src={combo.imagen}
              alt={combo.descripcion}
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
            onClick={() => setModalOpen(true)}
            className="absolute bottom-2 right-2 py-2 px-4 rounded-lg font-medium text-sm shadow-md bg-orange-500 hover:bg-orange-600 text-white hover:animate-bounce-subtle transition-colors"
          >
            Comprar
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{combo.descripcion}</h3>
            <span className="text-sm font-medium text-orange-600">{formattedPrecio}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">2 pantallas • Contactar por WhatsApp para recibir accesos</p>
        </div>
      </div>
      <ComboPurchaseModal
        combo={combo}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
