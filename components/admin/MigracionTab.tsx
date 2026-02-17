"use client";

import { useState } from "react";
import { Database, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { setPlanes } from "@/lib/data";
import { getInventario } from "@/lib/mockData";
import {
  getClientesFromSupabase,
  setInventarioInSupabase,
  registrarClienteInSupabase,
} from "@/lib/supabaseData";
import { ensureImagesBucket, dataUrlToFile, uploadPlatformImage } from "@/lib/storage";
import type { Cliente, Plan } from "@/lib/mockData";

function getFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export default function MigracionTab() {
  const [estado, setEstado] = useState<{
    tipo: "idle" | "running" | "ok" | "error";
    mensaje: string;
    detalles: string[];
  }>({ tipo: "idle", mensaje: "", detalles: [] });

  const handleCrearBucket = async () => {
    if (!isSupabaseConfigured()) {
      setEstado({ tipo: "error", mensaje: "Supabase no configurado", detalles: [] });
      return;
    }
    setEstado({ tipo: "running", mensaje: "Creando bucket images...", detalles: [] });
    try {
      const ok = await ensureImagesBucket();
      if (ok) {
        setEstado({ tipo: "ok", mensaje: "Bucket 'images' listo", detalles: [] });
      } else {
        const res = await fetch("/api/storage/create-bucket", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok || data.ok) {
          setEstado({ tipo: "ok", mensaje: "Bucket 'images' listo", detalles: [] });
        } else {
          setEstado({
            tipo: "error",
            mensaje: "Créalo manualmente: Supabase → Storage → New bucket → images (public)",
            detalles: [],
          });
        }
      }
    } catch {
      setEstado({
        tipo: "error",
        mensaje: "Créalo manualmente: Supabase → Storage → New bucket → images (public)",
        detalles: [],
      });
    }
  };

  const handleMigrar = async () => {
    if (!isSupabaseConfigured()) {
      setEstado({ tipo: "error", mensaje: "Supabase no configurado", detalles: [] });
      return;
    }
    setEstado({ tipo: "running", mensaje: "Migrando datos...", detalles: [] });

    const detalles: string[] = [];
    let errores = 0;

    // 1. Clientes + compras
    const clientesParaMigrar = getFromLocalStorage<Cliente[]>("pelis-series-users-db") ?? [];
    if (Array.isArray(clientesParaMigrar) && clientesParaMigrar.length > 0) {
      const existentes = await getClientesFromSupabase();
      const correosExistentes = new Set(existentes.map((c) => c.correo.toLowerCase()));
      let insertados = 0;
      const supabase = (await import("@/lib/supabase")).supabase;

      for (const c of clientesParaMigrar) {
        if (correosExistentes.has(c.correo.toLowerCase())) {
          detalles.push(`Cliente ${c.correo} ya existe, omitido`);
          continue;
        }
        const res = await registrarClienteInSupabase({
          nombre: c.nombre,
          correo: c.correo,
          contraseña: c.contraseña,
          whatsapp: c.whatsapp,
        });
        if (res.error) {
          detalles.push(`Error cliente ${c.correo}: ${res.error}`);
          errores++;
        } else {
          correosExistentes.add(c.correo.toLowerCase());
          insertados++;
          detalles.push(`Cliente ${c.correo} migrado`);

          // Actualizar saldo y avatar si difieren del default
          if (c.saldo !== 0 || c.avatarEmoji) {
            await supabase
              .from("clientes")
              .update({
                saldo: c.saldo,
                avatar_emoji: c.avatarEmoji ?? null,
              })
              .eq("correo", c.correo);
          }

          // Migrar historial de compras del cliente
          if (c.historialCompras?.length) {
            for (const comp of c.historialCompras) {
              await supabase.from("compras").insert({
                codigo: comp.codigo,
                cliente_correo: c.correo,
                plataforma: comp.plataforma,
                estado: comp.estado,
                valor_compra: comp.valorCompra,
                informacion: comp.informacion,
                correo: comp.correo ?? null,
                contraseña: comp.contraseña ?? null,
                perfil: comp.perfil ?? null,
                pin: comp.pin ?? null,
                fecha_compra: comp.fechaCompra,
                fecha_compra_iso: comp.fechaCompraISO ?? null,
                fecha_expiracion: comp.fechaExpiracion ?? null,
                fecha_expiracion_iso: comp.fechaExpiracionISO ?? null,
              });
            }
            detalles.push(`  → ${c.historialCompras.length} compras`);
          }
        }
      }
      detalles.push(`Clientes: ${insertados} nuevos`);
    } else {
      detalles.push("No hay clientes en localStorage");
    }

    // 2. Inventario
    const inv = getInventario();
    if (inv.length > 0) {
      await setInventarioInSupabase(inv);
      detalles.push(`Inventario: ${inv.length} plataformas migradas`);
    } else {
      detalles.push("No hay inventario en localStorage");
    }

    // 3. Planes (subir imágenes base64 a Storage, guardar URLs)
    const planesLocal = getFromLocalStorage<Plan[]>("pelis-series-planes");
    const planesParaMigrar = planesLocal ?? [];
    if (planesParaMigrar.length > 0) {
      const planesConUrls: Plan[] = [];
      for (const p of planesParaMigrar) {
        let imagenUrl = p.imagen;
        if (imagenUrl?.startsWith("data:")) {
          const file = dataUrlToFile(imagenUrl, `${p.id}.png`);
          if (file) {
            const res = await uploadPlatformImage(file, p.id);
            if ("url" in res) imagenUrl = res.url;
            else detalles.push(`Imagen ${p.nombre}: ${res.error}`);
          }
        }
        planesConUrls.push({ ...p, imagen: imagenUrl });
      }
      await setPlanes(planesConUrls);
      detalles.push(`Planes: ${planesConUrls.length} migrados`);
    }

    setEstado({
      tipo: errores > 0 ? "error" : "ok",
      mensaje: errores > 0 ? `Migración con ${errores} errores` : "Migración completada",
      detalles,
    });
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <p className="text-amber-800 font-medium">Supabase no está configurado.</p>
        <p className="text-amber-700 text-sm mt-1">Añade las variables de entorno en .env.local</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Migración a Supabase</h2>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">1. Bucket de imágenes</h3>
          <p className="text-sm text-gray-600 mb-3">
            Crea el bucket &quot;images&quot; en Supabase Storage para almacenar fotos de plataformas.
          </p>
          <button
            onClick={handleCrearBucket}
            disabled={estado.tipo === "running"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Crear bucket images
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2">2. Migrar datos de localStorage</h3>
          <p className="text-sm text-gray-600 mb-3">
            Copia clientes, inventario y planes desde localStorage a Supabase. Los duplicados (por correo) se omiten.
          </p>
          <button
            onClick={handleMigrar}
            disabled={estado.tipo === "running"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {estado.tipo === "running" ? "Migrando..." : "Ejecutar migración"}
          </button>
        </div>

        {estado.mensaje && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl ${
              estado.tipo === "ok"
                ? "bg-green-50 text-green-800 border border-green-200"
                : estado.tipo === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            {estado.tipo === "ok" && <CheckCircle className="w-5 h-5 shrink-0" />}
            {estado.tipo === "error" && <AlertCircle className="w-5 h-5 shrink-0" />}
            <div>
              <p className="font-medium">{estado.mensaje}</p>
              {estado.detalles.length > 0 && (
                <ul className="mt-2 text-sm space-y-1 max-h-40 overflow-y-auto">
                  {estado.detalles.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
