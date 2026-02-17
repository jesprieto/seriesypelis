"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import HeaderCards from "@/components/dashboard/HeaderCards";
import AccesoModal from "@/components/dashboard/AccesoModal";
import { esCompraDisponible } from "@/lib/utils";
import type { Compra } from "@/lib/mockData";

function estadoCalculado(compra: Compra): Compra["estado"] {
  return esCompraDisponible(compra) ? "Disponible" : "Expirado";
}

export default function HistorialPage() {
  const { saldo, historialCompras } = useAuth();
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [modalAccesoOpen, setModalAccesoOpen] = useState(false);

  const comprasConEstado = useMemo(
    () =>
      historialCompras.map((c) => ({
        ...c,
        estado: estadoCalculado(c),
      })),
    [historialCompras]
  );

  const formatValor = (valor: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);

  const truncate = (text: string, max: number) =>
    text.length > max ? `${text.slice(0, max)}...` : text;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Historial
        </h1>
        <HeaderCards historialCompras={historialCompras} saldo={saldo} />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Código
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Estado
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Fecha de compra
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Plataforma
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Correo
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Contraseña
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  Perfil
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                  Valor compra
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {historialCompras.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-gray-500 text-sm"
                  >
                    No hay compras registradas
                  </td>
                </tr>
              ) : (
                comprasConEstado.map((compra, index) => (
                  <tr
                    key={`${compra.codigo}-${compra.fechaCompra}-${index}`}
                    className={`border-b border-gray-100 last:border-0 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {compra.codigo}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          compra.estado === "Disponible"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {compra.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {compra.fechaCompra}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {truncate(compra.plataforma, 20)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[160px]" title={compra.correo ?? "-"}>
                      {compra.correo ?? "-"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono truncate max-w-[120px]" title={compra.contraseña ?? "-"}>
                      {compra.contraseña ?? "-"}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 text-center">
                      {compra.perfil ?? "-"}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                      {formatValor(compra.valorCompra)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setCompraSeleccionada(compra);
                          setModalAccesoOpen(true);
                        }}
                        className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors whitespace-nowrap"
                      >
                        Ver acceso
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AccesoModal
        compra={compraSeleccionada}
        isOpen={modalAccesoOpen}
        onClose={() => {
          setModalAccesoOpen(false);
          setCompraSeleccionada(null);
        }}
      />
    </div>
  );
}
