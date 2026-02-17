"use client";

import { useState, useEffect } from "react";
import {
  getClientes,
  actualizarCliente,
  getClienteByCorreo,
} from "@/lib/mockData";
import type { Cliente } from "@/lib/mockData";
import { getPlataformasActivas } from "@/lib/utils";
import ClienteModal from "./ClienteModal";

export default function ClientesTab() {
  const [clientes, setClientesState] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = () => setClientesState(getClientes());

  useEffect(() => {
    refresh();
  }, []);

  const formatValor = (valor: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);

  const handleAbrir = (c: Cliente) => {
    setSelectedCliente(getClienteByCorreo(c.correo) ?? c);
    setModalOpen(true);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setSelectedCliente(null);
    refresh();
  };

  const handleAgregarSaldo = (correo: string, monto: number) => {
    actualizarCliente(correo, (c) => ({
      ...c,
      saldo: c.saldo + monto,
    }));
    const updated = getClienteByCorreo(correo);
    if (updated) setSelectedCliente(updated);
    refresh();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Clientes</h2>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Nombre
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Correo
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  Contraseña
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  Saldo actual
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                  Plataformas activas
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500 text-sm"
                  >
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                clientes.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-100 last:border-0 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">{c.nombre}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{c.correo}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                      {c.contraseña}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 text-center">
                      {formatValor(c.saldo)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-center">
                      {getPlataformasActivas(c.historialCompras).length}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleAbrir(c)}
                        className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClienteModal
        cliente={selectedCliente}
        isOpen={modalOpen}
        onClose={handleCerrarModal}
        onAgregarSaldo={handleAgregarSaldo}
      />
    </div>
  );
}
