"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { getPlanes, setPlanes, updatePlan, deletePlan, contarPerfilesDisponibles } from "@/lib/data";
import { PLATAFORMAS_OFICIALES } from "@/lib/plataformas";
import ProcesandoSpinner from "@/components/ui/ProcesandoSpinner";
import { uploadPlatformImage } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Plan } from "@/lib/mockData";

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

export default function CrearPlataformaTab() {
  const [planes, setPlanesState] = useState<Plan[]>([]);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const [editando, setEditando] = useState<Plan | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    const valor = parseInt(precio.replace(/\D/g, ""), 10);
    if (!nombre) {
      setMensaje({ tipo: "error", text: "Selecciona una plataforma" });
      return;
    }
    if (isNaN(valor) || valor <= 0) {
      setMensaje({ tipo: "error", text: "El valor debe ser un número mayor a 0" });
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
        precio: valor,
        imagen: imagenUrl,
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
      setPrecio("");
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
    setEditPrecio(plan.precio.toLocaleString("es-CO"));
    setEditImagen(plan.imagen || null);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    const valor = parseInt(editPrecio.replace(/\D/g, ""), 10);
    if (!editNombre.trim()) return;
    if (isNaN(valor) || valor <= 0) return;
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
        precio: valor,
        imagen: imagenUrl,
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
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
              required
            >
              <option value="">Seleccionar plataforma...</option>
              {PLATAFORMAS_OFICIALES.filter((p) => !planes.some((plan) => plan.nombre === p)).map((plat) => (
                <option key={plat} value={plat}>{plat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (COP)
            </label>
            <input
              type="text"
              value={precio}
              onChange={(e) => setPrecio(formatPrecio(e.target.value))}
              placeholder="Ej: 12.000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (COP)</label>
                <input
                  type="text"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(formatPrecio(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  required
                />
              </div>
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
  );
}
