"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Copy } from "lucide-react";
import { requiereConexionWhatsApp } from "@/lib/plataformas";
import type { Compra } from "@/lib/types";

interface AccessSuccessModalProps {
  compra: Compra;
  onClose: () => void;
}

function textoParaCopiar(compra: Compra, soloCodigo: boolean = false): string {
  if (soloCodigo) {
    return `${compra.plataforma} - Código: ${compra.codigoHex ?? compra.codigo}`;
  }
  const lineas = [
    `🎬 ${compra.plataforma} Pantalla`,
    `📋 Código: ${compra.codigoHex ?? compra.codigo}`,
    "",
    `📧 Correo: ${compra.correo ?? "-"}`,
    `🔑 Contraseña: ${compra.contraseña ?? "-"}`,
    `👤 Perfil: ${compra.perfil ?? "-"}`,
    `🔒 PIN: ${compra.pin ?? "-"}`,
    `📅 Expira: ${compra.fechaExpiracion ?? "-"}`,
  ];
  return lineas.join("\n");
}

const MENSAJE_WHATSAPP =
  "Copia estos datos y envíalos por WhatsApp al administrador para que te haga la conexión con tus accesos actuales.";

export default function AccessSuccessModal({ compra, onClose }: AccessSuccessModalProps) {
  const [copiado, setCopiado] = useState(false);
  const esConexionWhatsApp = requiereConexionWhatsApp(compra.plataforma);

  const handleCopiar = async () => {
    const texto = textoParaCopiar(compra, esConexionWhatsApp);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFA500", "#FF8C00", "#FFD700", "#FF6347"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FFA500", "#FF8C00", "#FFD700", "#FF6347"],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    const t = setTimeout(() => {
      confetti.reset();
    }, duration + 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            ¡Compra exitosa!
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            No compartas el servicio con nadie para evitar el bloqueo o suspensión de la cuenta.
          </p>
          <p className="font-bold text-gray-900">
            {compra.plataforma} Pantalla
          </p>
          <p className="text-sm text-gray-600 mt-2 font-mono tracking-wider">
            Código: {compra.codigoHex ?? compra.codigo}
          </p>
        </div>

        {esConexionWhatsApp ? (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
            <p className="text-sm text-gray-700 font-medium leading-relaxed">
              {MENSAJE_WHATSAPP}
            </p>
          </div>
        ) : (
        <div className="space-y-3 rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Correo</span>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={compra.correo}>
              {compra.correo ?? "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Contraseña</span>
            <span className="text-sm font-medium text-gray-900 font-mono truncate max-w-[200px]" title={compra.contraseña}>
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

        {!esConexionWhatsApp && (
        <button
          type="button"
          onClick={handleCopiar}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors mb-3"
        >
          <Copy className="w-4 h-4 shrink-0" />
          {copiado ? "¡Copiado!" : "Copiar datos"}
        </button>
        )}

        {esConexionWhatsApp && (
        <button
          type="button"
          onClick={handleCopiar}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors mb-3"
        >
          <Copy className="w-4 h-4 shrink-0" />
          {copiado ? "¡Copiado!" : "Copiar código para enviar"}
        </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
