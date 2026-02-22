"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { getPlanes, setPlanes, updatePlan, deletePlan, contarPerfilesDisponibles } from "@/lib/data";
import { PLATAFORMAS_OFICIALES } from "@/lib/plataformas";
import CombosTab from "./CombosTab";
import { getPreciosDefault } from "@/lib/preciosDefault";
import ProcesandoSpinner from "@/components/ui/ProcesandoSpinner";
import { uploadPlatformImage } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Plan } from "@/lib/types";

function PlanRow({
  plan,
  onEditar,
  onEliminar,
  contarPerfilesDisponibles,
}: {
  plan: Plan;
  onEditar: () => void;
  onEliminar: () => void;
  contarPerfilesDisponibles: (plataforma: string) => Promise<number>;
}) {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    contarPerfilesDisponibles(plan.nombre).then(setDisp);
  }, [plan.nombre, contarPerfilesDisponibles]);

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {plan.imagen ? (
            <img
              src={plan.imagen}
              alt=""
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
              <Image src="/store.svg" alt="" width={20} height={20} className="opacity-50" />
            </div>
          )}
          <span className="font-medium text-gray-900">{plan.nombre}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            disp > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {disp} {disp === 1 ? "perfil disponible" : "perfiles disponibles"}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEditar}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-600 transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onEliminar}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

type SubTabId = "plataformas" | "combos";

export default function CrearPlataformaTab() {
  const [subTab, setSubTab] = useState<SubTabId>("plataformas");
  const [planes, setPlanesState] = useState<Plan[]>([]);
  const [nombre, setNombre] = useState("");
  const [precioMayorista, setPrecioMayorista] = useState("");
  const [precioDetal, setPrecioDetal] = useState("");
  const [promo, setPromo] = useState(false);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const [editando, setEditando] = useState<Plan | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecioMayorista, setEditPrecioMayorista] = useState("");
  const [editPrecioDetal, setEditPrecioDetal] = useState("");
  const [editPromo, setEditPromo] = useState(false);
  const [editImagen, setEditImagen] = useState<string | null>(null);
  const [editImagenFile, setEditImagenFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setCargandoPlanes(true);
    try {
      const data = await getPlanes();
      setPlanesState(data);
    } finally {
      setCargandoPlanes(false);
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMensaje({ tipo: "error", text: "Solo se permiten imágenes" });
      return;
    }
    setImagenFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagenBase64(reader.result as string);
      setImagenPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setEditImagenFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditImagen(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePlataformaSelect = (plat: string) => {
    setNombre(plat);
    if (plat) {
      const def = getPreciosDefault(plat);
      setPrecioMayorista(def.mayorista.toLocaleString("es-CO"));
      setPrecioDetal(def.detal.toLocaleString("es-CO"));
    } else {
      setPrecioMayorista("");
      setPrecioDetal("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    const valMayorista = parseInt(precioMayorista.replace(/\D/g, ""), 10);
    const valDetal = parseInt(precioDetal.replace(/\D/g, ""), 10);
    if (!nombre) {
      setMensaje({ tipo: "error", text: "Selecciona una plataforma" });
      return;
    }
    if (isNaN(valMayorista) || valMayorista <= 0 || isNaN(valDetal) || valDetal <= 0) {
      setMensaje({ tipo: "error", text: "Ambos precios deben ser números mayores a 0" });
      return;
    }
    setLoading(true);
    setMensaje(null);
    let usadoFallbackImagen = false;
    try {
      const planId = String(Date.now());
      let imagenUrl: string | undefined;
      if (imagenFile || imagenBase64) {
        if (isSupabaseConfigured() && imagenFile) {
          const res = await uploadPlatformImage(imagenFile, planId);
          if ("url" in res) {
            imagenUrl = res.url;
          } else if (imagenBase64) {
            imagenUrl = imagenBase64;
            usadoFallbackImagen = true;
          } else {
            setMensaje({
              tipo: "error",
              text: "error" in res ? res.error : "Crea el bucket 'images' en Supabase → Storage (público).",
            });
            setLoading(false);
            return;
          }
        } else if (imagenBase64) {
          imagenUrl = imagenBase64;
        }
      }

      const lista = await getPlanes();
      const nuevoPlan: Plan = {
        id: planId,
        nombre,
        precio: valDetal,
        precioMayorista: valMayorista,
        precioDetal: valDetal,
        imagen: imagenUrl,
        promo,
      };
      await setPlanes([...lista, nuevoPlan]);
      refresh();

      setMensaje({
        tipo: "ok",
        text: usadoFallbackImagen
          ? "Plataforma creada. Imagen guardada localmente. Crea el bucket 'images' en Supabase → Storage para subir a la nube."
          : "Plataforma creada correctamente",
      });
      setNombre("");
      setPrecioMayorista("");
      setPrecioDetal("");
      setPromo(false);
      setImagenBase64(null);
      setImagenPreview(null);
      setImagenFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (plan: Plan) => {
    setEditando(plan);
    setEditNombre(plan.nombre);
    const def = getPreciosDefault(plan.nombre);
    setEditPrecioMayorista((plan.precioMayorista ?? def.mayorista).toLocaleString("es-CO"));
    setEditPrecioDetal((plan.precioDetal ?? def.detal).toLocaleString("es-CO"));
    setEditPromo(plan.promo ?? false);
    setEditImagen(plan.imagen || null);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    const valMayorista = parseInt(editPrecioMayorista.replace(/\D/g, ""), 10);
    const valDetal = parseInt(editPrecioDetal.replace(/\D/g, ""), 10);
    if (!editNombre.trim()) return;
    if (isNaN(valMayorista) || valMayorista <= 0 || isNaN(valDetal) || valDetal <= 0) return;
    setLoading(true);
    try {
      let imagenUrl: string | undefined = editImagen || undefined;
      if (editImagenFile) {
        if (isSupabaseConfigured()) {
          const res = await uploadPlatformImage(editImagenFile, editando.id);
          if ("url" in res) imagenUrl = res.url;
          else {
            setMensaje({ tipo: "error", text: res.error ?? "Error al subir imagen" });
            setLoading(false);
            return;
          }
        } else {
          const reader = new FileReader();
          imagenUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(editImagenFile);
          });
        }
      }

      const planActualizado = {
        ...editando,
        nombre: editNombre.trim(),
        precio: valDetal,
        precioMayorista: valMayorista,
        precioDetal: valDetal,
        imagen: imagenUrl,
        promo: editPromo,
      };
      await updatePlan(planActualizado);
      await refresh();
      setEditando(null);
      setEditImagenFile(null);
      setMensaje({ tipo: "ok", text: "Plataforma actualizada correctamente" });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (plan: Plan) => {
    if (!confirm(`¿Eliminar la plataforma "${plan.nombre}"?`)) return;
    await deletePlan(plan.id);
    await refresh();
  };

  const formatPrecio = (v: string) => {
    const num = v.replace(/\D/g, "");
    if (!num) return "";
    return parseInt(num, 10).toLocaleString("es-CO");
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setSubTab("plataformas")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            subTab === "plataformas" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Plataformas
        </button>
        <button
          type="button"
          onClick={() => setSubTab("combos")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            subTab === "combos" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Combos (2 pantallas)
        </button>
      </div>

      {subTab === "combos" ? (
        <CombosTab />
      ) : (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
      <div className="max-w-xl shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear plataforma</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de la plataforma
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {imagenPreview ? (
                  <img
                    src={imagenPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src="/store.svg"
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 opacity-50"
                  />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Subir imagen
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plataforma
            </label>
            <select
              value={nombre}
              onChange={(e) => handlePlataformaSelect(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              required
            >
              <option value="">Seleccionar plataforma...</option>
              {PLATAFORMAS_OFICIALES.map((plat) => (
                <option key={plat} value={plat}>{plat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio mayorista (COP)
              </label>
              <input
                type="text"
                value={precioMayorista}
                onChange={(e) => setPrecioMayorista(formatPrecio(e.target.value))}
                placeholder="Ej: 10.000"
                disabled={!promo}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 ${!promo ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio detal (COP)
              </label>
              <input
                type="text"
                value={precioDetal}
                onChange={(e) => setPrecioDetal(formatPrecio(e.target.value))}
                placeholder="Ej: 12.000"
                disabled={!promo}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 ${!promo ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
          {!promo && (
            <p className="text-xs text-gray-500">Activa Promo para editar los precios.</p>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={promo}
              onChange={(e) => setPromo(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
            />
            <span className="text-sm font-medium text-gray-700">Promo</span>
          </label>
          <p className="text-xs text-gray-500 -mt-2">
            Si está activo, la plataforma aparecerá en la pestaña Promociones y podrás editar su precio.
          </p>

          {mensaje && (
            <div
              className={`py-2 px-4 rounded-xl text-sm ${
                mensaje.tipo === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
              }`}
            >
              {mensaje.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              "Crear plataforma"
            )}
          </button>
        </form>
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Plataformas creadas</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {cargandoPlanes ? (
            <ProcesandoSpinner />
          ) : planes.length === 0 ? (
            <p className="py-12 text-center text-gray-500 text-sm">
              No hay plataformas creadas. Crea una usando el formulario de la izquierda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Plataforma
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                      Disponibilidad
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {planes.map((plan) => (
                    <PlanRow
                      key={plan.id}
                      plan={plan}
                      onEditar={() => handleEditar(plan)}
                      onEliminar={() => handleEliminar(plan)}
                      contarPerfilesDisponibles={contarPerfilesDisponibles}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setEditando(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar plataforma</h3>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {editImagen ? (
                      <img src={editImagen} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/store.svg" alt="" width={24} height={24} className="opacity-50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileRef.current?.click()}
                      className="text-sm py-1.5 px-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                <select
                  value={editNombre}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                >
                  <option value={editNombre}>{editNombre}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editPromo}
                  onChange={(e) => setEditPromo(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                <span className="text-sm font-medium text-gray-700">Promo</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mayorista (COP)</label>
                  <input
                    type="text"
                    value={editPrecioMayorista}
                    onChange={(e) => setEditPrecioMayorista(formatPrecio(e.target.value))}
                    disabled={!editPromo}
                    className={`w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 ${!editPromo ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detal (COP)</label>
                  <input
                    type="text"
                    value={editPrecioDetal}
                    onChange={(e) => setEditPrecioDetal(formatPrecio(e.target.value))}
                    disabled={!editPromo}
                    className={`w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 ${!editPromo ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>
              {!editPromo && (
                <p className="text-xs text-gray-500">Activa Promo para editar los precios.</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
      )}
    </div>
  );
}
