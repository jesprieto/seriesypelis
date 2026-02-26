"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Plan, Compra } from "@/lib/types";
import { contarPerfilesDisponibles } from "@/lib/data";
import AccessSuccessModal from "./AccessSuccessModal";

interface PurchaseModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseModal({
  plan,
  isOpen,
  onClose,
}: PurchaseModalProps) {
  const { comprarPlan, saldo } = useAuth();
  const [compraExitosa, setCompraExitosa] = useState<Compra | null>(null);
  const [disponibles, setDisponibles] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [comprando, setComprando] = useState(false);
  const [cargandoPerfiles, setCargandoPerfiles] = useState(false);

  useEffect(() => {
    if (isOpen && plan) {
      setCargandoPerfiles(true);
      setDisponibles(null);
      setError("");
      setComprando(false);
      contarPerfilesDisponibles(plan.nombre)
        .then(setDisponibles)
        .finally(() => setCargandoPerfiles(false));
    } else {
      setDisponibles(null);
      setCargandoPerfiles(false);
    }
  }, [isOpen, plan]);

  const handleClose = () => {
    setCompraExitosa(null);
    setError("");
    setComprando(false);
    onClose();
  };

  const handleComprar = async () => {
    if (!plan || comprando) return;
    setError("");
    if (saldo < plan.precio) {
      setError("Saldo insuficiente, ve al botón recargar y compra más saldo.");
      return;
    }
    setComprando(true);
    try {
      const nuevaCompra = await comprarPlan(plan);
      if (nuevaCompra) {
        setCompraExitosa(nuevaCompra);
      } else {
        setError("No hay perfiles disponibles para esta plataforma");
      }
    } finally {
      setComprando(false);
    }
  };

  if (compraExitosa) {
    return (
      <AccessSuccessModal
        compra={compraExitosa}
        onClose={handleClose}
      />
    );
  }

  if (!isOpen) return null;

  const sinStock = !cargandoPerfiles && disponibles !== null && disponibles === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comprar plataforma
        </h3>
        {plan && (
          <div className="mb-4">
            <p className="text-gray-700 font-medium text-lg">{plan.nombre}</p>
            <p className="text-gray-500 text-sm">
              ${plan.precio.toLocaleString("es-CO")} COP
            </p>
          </div>
        )}

        {cargandoPerfiles && (
          <div className="mb-4 py-3 px-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
            <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-blue-700">Cargando las pantallas disponibles.</span>
          </div>
        )}

        {sinStock && (
          <div className="mb-4 py-2 px-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
            No hay perfiles disponibles para esta plataforma
          </div>
        )}

        {!cargandoPerfiles && !sinStock && disponibles !== null && (
          <p className="text-sm text-gray-500 mb-4">
            {disponibles} perfil{disponibles !== 1 ? "es" : ""} disponible{disponibles !== 1 ? "s" : ""}
          </p>
        )}

        {error && (
          <div className="mb-4 py-2 px-4 rounded-xl bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleComprar}
            disabled={sinStock || comprando || cargandoPerfiles}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[42px]"
          >
            {comprando ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              "Comprar"
            )}
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-500">* Al darle click en Comprar, estás comprando un (1) perfil.</p>
      </div>
    </div>
  );
}
