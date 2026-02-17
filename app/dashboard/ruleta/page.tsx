"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import HeaderCards from "@/components/dashboard/HeaderCards";

export default function RuletaPage() {
  const { saldo, historialCompras } = useAuth();

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ruleta</h1>
        <HeaderCards historialCompras={historialCompras} saldo={saldo} />
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        <Image
          src="/wheel.svg"
          alt="Ruleta"
          width={120}
          height={120}
          className="w-32 h-32 opacity-70 mb-4"
        />
        <p className="text-gray-500">Próximamente...</p>
      </div>
    </div>
  );
}
