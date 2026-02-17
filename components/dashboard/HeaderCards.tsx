"use client";

import { Monitor, Wallet, RefreshCw } from "lucide-react";
import { getPlataformasActivas } from "@/lib/utils";
import type { Compra } from "@/lib/mockData";

interface HeaderCardsProps {
  historialCompras: Compra[];
  saldo: number;
  onRefresh?: () => void;
}

const PLATAFORMA_COLORS = [
  "bg-red-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-cyan-400",
  "bg-amber-400",
  "bg-purple-400",
  "bg-rose-400",
  "bg-teal-400",
  "bg-indigo-400",
];

export default function HeaderCards({ historialCompras, saldo, onRefresh }: HeaderCardsProps) {
  const plataformasActivas = getPlataformasActivas(historialCompras);
  const numPerfiles = plataformasActivas.length;

  const formattedSaldo = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(saldo);

  return (
    <div className="flex gap-3 flex-wrap">
      <div className="bg-gray-100 rounded-xl border border-gray-200 px-4 py-3 shadow-sm min-w-[160px]">
        <div className="flex items-center gap-3">
          <Monitor className="w-5 h-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Perfiles actuales</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {plataformasActivas.map((plataforma, i) => (
                  <div
                    key={`${plataforma}-${i}`}
                    className={`w-5 h-5 rounded-full border-2 border-white ${
                      PLATAFORMA_COLORS[i % PLATAFORMA_COLORS.length]
                    }`}
                    title={plataforma}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-800">
                {numPerfiles} perfil{numPerfiles !== 1 ? "es" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 rounded-xl border border-gray-200 px-4 py-3 shadow-sm min-w-[160px]">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-gray-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Saldo actual</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-gray-900">{formattedSaldo}</p>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                  title="Actualizar saldo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <a
                href="https://wa.link/fnvpib"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 py-1.5 px-3 rounded-lg text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
              >
                Recargar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
