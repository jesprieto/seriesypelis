"use client";

import type { Compra } from "@/lib/types";

interface AccesoModalProps {
  compra: Compra | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AccesoModal({ compra, isOpen, onClose }: AccesoModalProps) {
  if (!isOpen || !compra) return null;

  const suspendido = compra.estado === "Suspendido";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Acceso - {compra.plataforma}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        {suspendido ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
            <p className="text-sm text-amber-800">
              Este acceso fue suspendido. Los datos de correo, contraseña, perfil y pin ya no están disponibles.
            </p>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-gray-600">Correo</span>
              <span className="text-sm font-medium text-gray-900 text-right break-all" title={compra.correo}>
                {compra.correo ?? "-"}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-gray-600">Contraseña</span>
              <span className="text-sm font-medium text-gray-900 font-mono text-right break-all" title={compra.contraseña}>
                {compra.contraseña ?? "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600"># Perfil</span>
              <span className="text-sm font-medium text-gray-900">
                {compra.perfil ?? "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pin</span>
              <span className="text-sm font-bold text-gray-900 font-mono">
                {compra.pin ?? "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fecha de expiración</span>
              <span className="text-sm font-medium text-gray-900">
                {compra.fechaExpiracion ?? "-"}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
