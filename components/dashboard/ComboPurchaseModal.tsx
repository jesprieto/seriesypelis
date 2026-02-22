"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Combo, Compra } from "@/lib/types";
import AccessSuccessModal from "./AccessSuccessModal";

interface ComboPurchaseModalProps {
  combo: Combo | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ComboPurchaseModal({
  combo,
  isOpen,
  onClose,
}: ComboPurchaseModalProps) {
  const { comprarCombo, saldo } = useAuth();
  const [compraExitosa, setCompraExitosa] = useState<Compra | null>(null);
  const [error, setError] = useState("");
  const [comprando, setComprando] = useState(false);

  const handleClose = () => {
    setCompraExitosa(null);
    setError("");
    setComprando(false);
    onClose();
  };

  const handleComprar = async () => {
    if (!combo || comprando) return;
    setError("");
    if (saldo < combo.precio) {
      setError("Saldo insuficiente. Ve a Configuración para recargar.");
      return;
    }
    setComprando(true);
    try {
      const nuevaCompra = await comprarCombo(combo);
      if (nuevaCompra) {
        setCompraExitosa(nuevaCompra);
      } else {
        setError("No se pudo procesar la compra");
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
          Comprar combo
        </h3>
        {combo && (
          <div className="mb-4">
            <p className="text-gray-700 font-medium text-lg">{combo.descripcion}</p>
            <p className="text-gray-500 text-sm">
              {combo.precio.toLocaleString("es-CO")} COP (2 pantallas)
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Debes contactar por WhatsApp para recibir tus accesos una vez comprado.
            </p>
          </div>
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
            disabled={comprando}
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
      </div>
    </div>
  );
}
