"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import HeaderCards from "@/components/dashboard/HeaderCards";
import PlanCard from "@/components/dashboard/PlanCard";
import { getPlanes } from "@/lib/mockData";
import type { Plan } from "@/lib/mockData";

export default function PlanesPage() {
  const { saldo, historialCompras } = useAuth();
  const [planes, setPlanes] = useState<Plan[]>([]);

  useEffect(() => {
    setPlanes(getPlanes());
    const handler = () => setPlanes(getPlanes());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Plataformas
        </h1>
        <HeaderCards historialCompras={historialCompras} saldo={saldo} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {planes.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
