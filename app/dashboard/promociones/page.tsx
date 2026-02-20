"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import HeaderCards from "@/components/dashboard/HeaderCards";
import PlanCard from "@/components/dashboard/PlanCard";
import { getPlanes, getDisponibilidadTodasPlataformas } from "@/lib/data";
import type { Plan } from "@/lib/types";

export default function PromocionesPage() {
  const { saldo, historialCompras, refreshCliente } = useAuth();
  const [planesPromo, setPlanesPromo] = useState<Plan[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPlanes().then((data) => data.filter((p) => p.promo === true)),
      getDisponibilidadTodasPlataformas(),
    ]).then(([promos, disp]) => {
      setPlanesPromo(promos);
      setDisponibilidad(disp);
      setLoading(false);
    });
    const handler = () => {
      getPlanes().then((data) => setPlanesPromo(data.filter((p) => p.promo === true)));
      getDisponibilidadTodasPlataformas().then(setDisponibilidad);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Promociones
        </h1>
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
      ) : planesPromo.length === 0 ? (
        <p className="text-gray-500">No hay promociones disponibles en este momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planesPromo.map((plan) => (
            <PlanCard key={plan.id} plan={plan} disponibilidadPrecargada={disponibilidad} />
          ))}
        </div>
      )}
    </div>
  );
}
