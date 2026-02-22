"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { getCombos, insertCombo, updateCombo, deleteCombo } from "@/lib/data";
import ProcesandoSpinner from "@/components/ui/ProcesandoSpinner";
import { uploadComboImage } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Combo } from "@/lib/types";

function formatPrecio(v: string) {
  const num = v.replace(/\D/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString("es-CO");
}

export default function CombosTab() {
  const [combos, setCombosState] = useState<Combo[]>([]);
  const [cargandoCombos, setCargandoCombos] = useState(true);
  const [comboDescripcion, setComboDescripcion] = useState("");
  const [comboPrecio, setComboPrecio] = useState("");
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const [editandoCombo, setEditandoCombo] = useState<Combo | null>(null);
  const [editComboDescripcion, setEditComboDescripcion] = useState("");
  const [editComboPrecio, setEditComboPrecio] = useState("");
  const [editImagen, setEditImagen] = useState<string | null>(null);
  const [editImagenFile, setEditImagenFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const refreshCombos = async () => {
    setCargandoCombos(true);
    try {
      const data = await getCombos();
      setCombosState(data);
    } finally {
      setCargandoCombos(false);
    }
  };

  useEffect(() => {
    refreshCombos();
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

  const handleCrearCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    const precio = parseInt(comboPrecio.replace(/\D/g, ""), 10);
    if (!comboDescripcion.trim()) {
      setMensaje({ tipo: "error", text: "Ingresa la descripción del combo" });
      return;
    }
    if (isNaN(precio) || precio <= 0) {
      setMensaje({ tipo: "error", text: "El precio debe ser mayor a 0" });
      return;
    }
    setLoading(true);
    setMensaje(null);
    let imagenUrl: string | undefined;
    try {
      const comboId = `combo-${Date.now()}`;
      if (imagenFile || imagenBase64) {
        if (isSupabaseConfigured() && imagenFile) {
          const res = await uploadComboImage(imagenFile, comboId);
          if ("url" in res) imagenUrl = res.url;
          else if (imagenBase64) imagenUrl = imagenBase64;
          else {
            setMensaje({ tipo: "error", text: res.error ?? "Error al subir imagen" });
            setLoading(false);
            return;
          }
        } else if (imagenBase64) {
          imagenUrl = imagenBase64;
        }
      }
      await insertCombo({ id: comboId, descripcion: comboDescripcion.trim(), precio, imagen: imagenUrl });
      await refreshCombos();
      setMensaje({ tipo: "ok", text: "Combo creado correctamente" });
      setComboDescripcion("");
      setComboPrecio("");
      setImagenPreview(null);
      setImagenFile(null);
      setImagenBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setMensaje({ tipo: "error", text: "Error al crear combo" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditarCombo = (combo: Combo) => {
    setEditandoCombo(combo);
    setEditComboDescripcion(combo.descripcion);
    setEditComboPrecio(combo.precio.toLocaleString("es-CO"));
    setEditImagen(combo.imagen || null);
  };

  const handleGuardarEdicionCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoCombo) return;
    const precio = parseInt(editComboPrecio.replace(/\D/g, ""), 10);
    if (!editComboDescripcion.trim() || isNaN(precio) || precio <= 0) return;
    setLoading(true);
    try {
      let imagenUrl: string | undefined = editImagen || undefined;
      if (editImagenFile) {
        if (isSupabaseConfigured()) {
          const res = await uploadComboImage(editImagenFile, editandoCombo.id);
          imagenUrl = "url" in res ? res.url : editImagen || undefined;
        } else {
          const reader = new FileReader();
          imagenUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(editImagenFile!);
          });
        }
      }
      await updateCombo({
        ...editandoCombo,
        descripcion: editComboDescripcion.trim(),
        precio,
        imagen: imagenUrl,
      });
      await refreshCombos();
      setEditandoCombo(null);
      setEditImagenFile(null);
      setMensaje({ tipo: "ok", text: "Combo actualizado correctamente" });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCombo = async (combo: Combo) => {
    if (!confirm("¿Eliminar el combo " + combo.descripcion + "?")) return;
    await deleteCombo(combo.id);
    await refreshCombos();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
      <div className="max-w-xl shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Crear combo</h2>
        <p className="text-sm text-gray-500 mb-4">Combos: un solo valor para dos pantallas.</p>
        <form
          onSubmit={handleCrearCombo}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del combo</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {imagenPreview ? (
                  <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Image src="/store.svg" alt="" width={32} height={32} className="w-8 h-8 opacity-50" />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción combo</label>
            <input
              type="text"
              value={comboDescripcion}
              onChange={(e) => setComboDescripcion(e.target.value)}
              placeholder="Ej: Netflix + Disney+ 2 pantallas"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Precio combo (COP)</label>
            <input
              type="text"
              value={comboPrecio}
              onChange={(e) => setComboPrecio(formatPrecio(e.target.value))}
              placeholder="Ej: 15.000"
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
              "Crear combo"
            )}
          </button>
        </form>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Combos creados</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {cargandoCombos ? (
            <ProcesandoSpinner />
          ) : combos.length === 0 ? (
            <p className="py-12 text-center text-gray-500 text-sm">
              No hay combos creados. Crea uno usando el formulario.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Imagen</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Descripción</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Precio</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map((combo) => (
                    <tr key={combo.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {combo.imagen ? (
                            <img src={combo.imagen} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image src="/store.svg" alt="" width={20} height={20} className="opacity-50" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{combo.descripcion}</td>
                      <td className="py-3 px-4 text-right">{combo.precio.toLocaleString("es-CO")} COP</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditarCombo(combo)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarCombo(combo)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editandoCombo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setEditandoCombo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar combo</h3>
            <form onSubmit={handleGuardarEdicionCombo} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editComboDescripcion}
                  onChange={(e) => setEditComboDescripcion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (COP)</label>
                <input
                  type="text"
                  value={editComboPrecio}
                  onChange={(e) => setEditComboPrecio(formatPrecio(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditandoCombo(null)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
