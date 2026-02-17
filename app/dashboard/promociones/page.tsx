"use client";

import { useAuth } from "@/context/AuthContext";
import HeaderCards from "@/components/dashboard/HeaderCards";

export default function PromocionesPage() {
  const { saldo, historialCompras } = useAuth();

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Promociones
        </h1>
        <HeaderCards historialCompras={historialCompras} saldo={saldo} />
      </div>
      <p className="text-gray-500">Próximamente...</p>
    </div>
  );
}
