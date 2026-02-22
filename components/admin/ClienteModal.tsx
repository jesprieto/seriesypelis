"use client";

import { useState } from "react";
import type { Cliente, Compra, PerfilPrecio } from "@/lib/types";
import { esCompraDisponible } from "@/lib/utils";

interface ClienteModalProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onAgregarSaldo: (correo: string, monto: number) => void;
  onCambiarPerfilPrecio: (correo: string, perfilPrecio: PerfilPrecio) => void;
}

export default function ClienteModal({
  cliente,
  isOpen,
  onClose,
  onAgregarSaldo,
  onCambiarPerfilPrecio,
}: ClienteModalProps) {
  const [montoSaldo, setMontoSaldo] = useState("");
  const [mostrarAgregar, setMostrarAgregar] = useState(false);

  if (!isOpen) return null;
  if (!cliente) return null;

  const formatValor = (valor: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);

  const totalGastado = cliente.historialCompras.reduce(
    (sum, c) => sum + c.valorCompra,
    0
  );

  const handleAgregarSaldo = () => {
    const num = parseInt(montoSaldo.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num > 0) {
      onAgregarSaldo(cliente.correo, num);
      setMontoSaldo("");
      setMostrarAgregar(false);
    }
  };

  const formatInputPrecio = (v: string) => {
    const num = v.replace(/\D/g, "");
    if (!num) return "";
    return parseInt(num, 10).toLocaleString("es-CO");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {cliente.nombre}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Perfil de precios (lo que ve el cliente):</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 p-0.5 bg-gray-100">
              <button
                type="button"
                onClick={() => onCambiarPerfilPrecio(cliente.correo, "mayorista")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  (cliente.perfilPrecio ?? "detal") === "mayorista"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mayorista
              </button>
              <button
                type="button"
                onClick={() => onCambiarPerfilPrecio(cliente.correo, "detal")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  (cliente.perfilPrecio ?? "detal") === "detal"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Minorista
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <h4 className="text-sm font-semibold text-gray-700">
                Historial de compras
              </h4>
              <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-orange-50 border border-orange-100">
                <span className="text-xs text-gray-600">Total balance</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatValor(cliente.saldo)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!mostrarAgregar ? (
                <button
                  onClick={() => setMostrarAgregar(true)}
                  className="text-xs py-1.5 px-3 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Agregar saldo
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    value={montoSaldo}
                    onChange={(e) => setMontoSaldo(formatInputPrecio(e.target.value))}
                    placeholder="Monto (COP)"
                    className="w-28 text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                  <button
                    onClick={handleAgregarSaldo}
                    disabled={!montoSaldo || parseInt(montoSaldo.replace(/\D/g, ""), 10) <= 0}
                    className="text-xs py-1.5 px-2 rounded-lg font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      setMostrarAgregar(false);
                      setMontoSaldo("");
                    }}
                    className="text-xs py-1.5 px-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="mb-4 overflow-x-auto">
              {cliente.historialCompras.length === 0 ? (
                <p className="text-sm text-gray-500">Sin compras registradas</p>
              ) : (
                <>
                  <div className="rounded-xl overflow-hidden border border-gray-200 min-w-[620px]">
                    <div className="grid grid-cols-[minmax(100px,1fr)_minmax(130px,1fr)_minmax(90px,1fr)_minmax(130px,1.5fr)_minmax(90px,1fr)_minmax(65px,0.8fr)_minmax(90px,1fr)_minmax(85px,1fr)] items-center py-3 px-4 bg-gray-100 text-sm font-semibold text-gray-600 gap-2">
                      <span className="text-left">Código</span>
                      <span className="text-left">Fecha</span>
                      <span className="text-center">Plataforma</span>
                      <span className="text-center">Correo</span>
                      <span className="text-center">Contraseña</span>
                      <span className="text-center">Perfil</span>
                      <span className="text-center">Valor</span>
                      <span className="text-center">Estado</span>
                    </div>
                    {cliente.historialCompras.map((c: Compra, i: number) => {
                      const activa = esCompraDisponible(c);
                      const suspendido = c.estado === "Suspendido";
                      const muestraDatos = !suspendido;
                      return (
                        <div
                          key={`${c.codigoHex ?? c.codigo}-${i}`}
                          className={`grid grid-cols-[minmax(100px,1fr)_minmax(130px,1fr)_minmax(90px,1fr)_minmax(130px,1.5fr)_minmax(90px,1fr)_minmax(65px,0.8fr)_minmax(90px,1fr)_minmax(85px,1fr)] items-center py-4 px-4 text-sm gap-2 border-t border-gray-100 ${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                        <span className="text-gray-900 font-mono text-xs">{c.codigoHex ?? c.codigo}</span>
                        <span className="text-gray-600 text-left text-xs whitespace-nowrap">{c.fechaCompra}</span>
                      <span className="font-medium text-gray-800 text-center">{c.plataforma}</span>
                      <span className="text-gray-600 text-center text-sm truncate" title={muestraDatos ? (c.correo ?? "-") : ""}>
                        {muestraDatos ? (c.correo ?? "-") : "—"}
                      </span>
                      <span className="text-gray-600 text-center text-sm truncate" title={muestraDatos ? (c.contraseña ?? "-") : ""}>
                        {muestraDatos ? (c.contraseña ?? "-") : "—"}
                      </span>
                      <span className="text-gray-700 text-center font-medium">
                        {muestraDatos ? (c.perfil ?? "-") : "—"}
                      </span>
                      <span className="font-semibold text-gray-900 text-center">
                        {formatValor(c.valorCompra)}
                      </span>
                      <span className="text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            suspendido ? "bg-amber-100 text-amber-800" : activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {suspendido ? "Suspendido" : activa ? "Activa" : "Expirada"}
                        </span>
                      </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
