"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import HeaderCards from "@/components/dashboard/HeaderCards";
import PlanCard from "@/components/dashboard/PlanCard";
import { getPlanes, getDisponibilidadTodasPlataformas } from "@/lib/data";
import type { Plan } from "@/lib/types";

export default function PlanesPage() {
  const { saldo, historialCompras, refreshCliente } = useAuth();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const cargarPlanes = useCallback(() => {
    Promise.all([getPlanes(), getDisponibilidadTodasPlataformas()]).then(([data, disp]) => {
      setPlanes(data);
      setDisponibilidad(disp);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    cargarPlanes();
  }, [cargarPlanes]);

  useEffect(() => {
    const onFocus = () => cargarPlanes();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [cargarPlanes]);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Plataformas
          </h1>
          <button
            type="button"
            onClick={cargarPlanes}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <HeaderCards historialCompras={historialCompras} saldo={saldo} onRefresh={refreshCliente} />
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
              <div className="aspect-[16/9] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map((plan) => (
            <PlanCard key={plan.id} plan={plan} disponibilidadPrecargada={disponibilidad} />
          ))}
        </div>
      )}
    </div>
  );
}
