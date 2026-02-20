"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { requiereConexionWhatsApp } from "@/lib/plataformas";
import type { Compra } from "@/lib/types";

interface AccesoModalProps {
  compra: Compra | null;
  isOpen: boolean;
  onClose: () => void;
}

const MENSAJE_WHATSAPP =
  "Copia estos datos, dirígete a la opción \"Soporte\" en el menú y pégalos en el WhatsApp de Ventas. Nuestro equipo te responderá con tus accesos a la brevedad.";

export default function AccesoModal({ compra, isOpen, onClose }: AccesoModalProps) {
  const [copiado, setCopiado] = useState(false);
  if (!isOpen || !compra) return null;

  const suspendido = compra.estado === "Suspendido";
  const esConexionWhatsApp = requiereConexionWhatsApp(compra.plataforma);

  const handleCopiar = async () => {
    const texto = `${compra.plataforma} - Código: ${compra.codigoHex ?? compra.codigo}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

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
        ) : esConexionWhatsApp ? (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6 text-center">
            <p className="text-sm text-gray-700 font-medium leading-relaxed">
              {MENSAJE_WHATSAPP}
            </p>
            <p className="text-sm text-gray-600 mt-2 font-mono">
              Código: {compra.codigoHex ?? compra.codigo}
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

        {esConexionWhatsApp && !suspendido && (
          <button
            type="button"
            onClick={handleCopiar}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors mb-3"
          >
            <Copy className="w-4 h-4 shrink-0" />
            {copiado ? "¡Copiado!" : "Copiar código"}
          </button>
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
