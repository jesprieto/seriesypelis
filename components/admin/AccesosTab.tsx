"use client";

import { useState, useEffect, useRef } from "react";
import {
  getInventario,
  agregarCuentaAlInventario,
  setInventario,
} from "@/lib/data";
import { PLATAFORMAS_OFICIALES, normalizarPlataforma } from "@/lib/plataformas";
import type { InventarioPlataforma, CuentaPlataforma, Perfil } from "@/lib/mockData";
import { ChevronDown, ChevronRight, Plus, Upload, Pencil, Search } from "lucide-react";
import ProcesandoSpinner from "@/components/ui/ProcesandoSpinner";

function crearPerfilesVacios(pins: string[]): Perfil[] {
  const perfiles: Perfil[] = [];
  for (let i = 0; i < 6; i++) {
    perfiles.push({
      numero: i + 1,
      pin: pins[i] || "",
      estado: "disponible",
    });
  }
  return perfiles.filter((p) => p.pin.trim() !== "");
}

export default function AccesosTab() {
  const [inventario, setInventarioState] = useState<InventarioPlataforma[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formPlataforma, setFormPlataforma] = useState("");
  const [formCorreo, setFormCorreo] = useState("");
  const [formContraseña, setFormContraseña] = useState("");
  const [formPins, setFormPins] = useState<string[]>(["", "", "", "", "", ""]);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; text: string } | null>(null);
  const [editandoCuenta, setEditandoCuenta] = useState<{
    plataforma: string;
    cuenta: CuentaPlataforma;
  } | null>(null);
  const [editCorreo, setEditCorreo] = useState("");
  const [editContraseña, setEditContraseña] = useState("");
  const [editPins, setEditPins] = useState<string[]>([]);
  const [busquedaCorreo, setBusquedaCorreo] = useState("");
  const csvRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setCargando(true);
    try {
      const data = await getInventario();
      setInventarioState(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggle = (plataforma: string) => {
    setExpandido((prev) => (prev === plataforma ? null : plataforma));
  };

  const handleAgregarCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    if (!formPlataforma.trim()) {
      setMensaje({ tipo: "error", text: "Selecciona o escribe una plataforma" });
      return;
    }
    if (!formCorreo.trim() || !formContraseña.trim()) {
      setMensaje({ tipo: "error", text: "Correo y contraseña son obligatorios" });
      return;
    }
    const pinsValidos = formPins.filter((p) => p.trim() !== "");
    if (pinsValidos.length === 0) {
      setMensaje({ tipo: "error", text: "Agrega al menos un pin de perfil" });
      return;
    }

    const cuenta: CuentaPlataforma = {
      id: `inv-${Date.now()}`,
      correo: formCorreo.trim(),
      contraseña: formContraseña.trim(),
      perfiles: crearPerfilesVacios(formPins),
    };
    await agregarCuentaAlInventario(formPlataforma.trim(), cuenta);

    setFormCorreo("");
    setFormContraseña("");
    setFormPins(["", "", "", "", "", ""]);
    setMensaje({ tipo: "ok", text: "Cuenta agregada correctamente" });
    await refresh();
  };

  const handleEditarCuenta = (plataforma: string, cuenta: CuentaPlataforma) => {
    setEditandoCuenta({ plataforma, cuenta });
    setEditCorreo(cuenta.correo);
    setEditContraseña(cuenta.contraseña);
    const pins: string[] = Array(6).fill("");
    cuenta.perfiles.forEach((p) => {
      if (p.numero >= 1 && p.numero <= 6) pins[p.numero - 1] = p.pin;
    });
    setEditPins(pins);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoCuenta) return;
    if (!editCorreo.trim() || !editContraseña.trim()) {
      setMensaje({ tipo: "error", text: "Correo y contraseña son obligatorios" });
      return;
    }
    const pinsValidos = editPins.filter((p) => p.trim() !== "");
    if (pinsValidos.length === 0) {
      setMensaje({ tipo: "error", text: "Debe haber al menos un perfil con pin" });
      return;
    }

    const inv = await getInventario();
    const platIdx = inv.findIndex(
      (p) => p.plataforma.toLowerCase() === editandoCuenta.plataforma.toLowerCase()
    );
    if (platIdx < 0) return;
    const cuentaIdx = inv[platIdx].cuentas.findIndex((c) => c.id === editandoCuenta.cuenta.id);
    if (cuentaIdx < 0) return;

    const perfilesActualizados: Perfil[] = [];
    for (let i = 0; i < 6; i++) {
      const pinVal = editPins[i]?.replace(/\D/g, "").slice(0, 6) ?? "";
      if (pinVal.trim() === "") continue;
      const perfilExistente = editandoCuenta.cuenta.perfiles.find((p) => p.numero === i + 1);
      perfilesActualizados.push({
        numero: i + 1,
        pin: pinVal,
        estado: perfilExistente?.estado ?? "disponible",
        clienteCorreo: perfilExistente?.clienteCorreo,
        fechaAsignacion: perfilExistente?.fechaAsignacion,
        fechaExpiracion: perfilExistente?.fechaExpiracion,
      });
    }
    const cuentaActualizada: CuentaPlataforma = {
      ...editandoCuenta.cuenta,
      correo: editCorreo.trim(),
      contraseña: editContraseña.trim(),
      perfiles: perfilesActualizados,
    };
    const invActualizado = [...inv];
    invActualizado[platIdx] = {
      ...invActualizado[platIdx],
      cuentas: invActualizado[platIdx].cuentas.map((c, i) =>
        i === cuentaIdx ? cuentaActualizada : c
      ),
    };
    await setInventario(invActualizado);
    setMensaje({ tipo: "ok", text: "Cuenta actualizada correctamente" });
    setEditandoCuenta(null);
    await refresh();
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setMensaje({ tipo: "error", text: "El CSV debe tener al menos una fila de datos" });
        return;
      }
      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 4) continue;
        const [plataformaRaw, correo, contraseña, ...pins] = cols;
        if (!plataformaRaw || !correo || !contraseña) continue;
        const plataforma = normalizarPlataforma(plataformaRaw);
        if (!PLATAFORMAS_OFICIALES.includes(plataforma as (typeof PLATAFORMAS_OFICIALES)[number])) continue;
        const pinsArr = pins.slice(0, 6);
        if (pinsArr.filter((p) => p).length === 0) continue;
        const cuenta: CuentaPlataforma = {
          id: `inv-csv-${Date.now()}-${i}`,
          correo,
          contraseña,
          perfiles: crearPerfilesVacios(pinsArr),
        };
        await agregarCuentaAlInventario(plataforma, cuenta);
        added++;
      }
      setMensaje({ tipo: "ok", text: `${added} cuenta(s) importada(s) desde CSV` });
      await refresh();
    };
    reader.readAsText(file);
    if (csvRef.current) csvRef.current.value = "";
  };

  const busquedaLower = busquedaCorreo.trim().toLowerCase();
  const inventarioFiltrado = busquedaLower
    ? inventario
        .map((plat) => ({
          ...plat,
          cuentas: plat.cuentas.filter(
            (c) => c.correo.toLowerCase().includes(busquedaLower)
          ),
        }))
        .filter((plat) => plat.cuentas.length > 0)
    : inventario;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Accesos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar cuenta
          </button>
          <input
            ref={csvRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSV}
          />
          <button
            onClick={() => csvRef.current?.click()}
            className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Subir CSV
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busquedaCorreo}
            onChange={(e) => setBusquedaCorreo(e.target.value)}
            placeholder="Buscar por correo electrónico..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
          />
          {busquedaCorreo && (
            <button
              onClick={() => setBusquedaCorreo("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
        {busquedaCorreo.trim() && (
          <p className="mt-1.5 text-xs text-gray-500">
            {inventarioFiltrado.reduce((s, p) => s + p.cuentas.length, 0)} cuenta(s) encontrada(s)
          </p>
        )}
      </div>

      {mensaje && (
        <div
          className={`mb-4 py-2 px-4 rounded-xl text-sm ${
            mensaje.tipo === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
          }`}
        >
          {mensaje.text}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAgregarCuenta}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-900">Nueva cuenta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
              <select
                value={formPlataforma}
                onChange={(e) => setFormPlataforma(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              >
                <option value="">Seleccionar...</option>
                {PLATAFORMAS_OFICIALES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input
                type="email"
                value={formCorreo}
                onChange={(e) => setFormCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="text"
                value={formContraseña}
                onChange={(e) => setFormContraseña(e.target.value)}
                placeholder="contraseña"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pines de perfiles (hasta 6)</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {formPins.map((pin, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    const next = [...formPins];
                    next[i] = val;
                    setFormPins(next);
                  }}
                  placeholder={`Pin ${i + 1}`}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="py-2.5 px-6 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            Guardar cuenta
          </button>
        </form>
      )}

      {cargando ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ProcesandoSpinner />
        </div>
      ) : inventario.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay inventario registrado</p>
      ) : inventarioFiltrado.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">
          {`No se encontraron cuentas con el correo "${busquedaCorreo}"`}
        </p>
      ) : (
        <div className="space-y-3">
          {inventarioFiltrado.map((plat) => {
            const totalPerfiles = plat.cuentas.reduce((s, c) => s + c.perfiles.length, 0);
            const disponibles = plat.cuentas.reduce(
              (s, c) => s + c.perfiles.filter((p) => p.estado === "disponible").length,
              0
            );
            const ocupados = totalPerfiles - disponibles;
            const isOpen = busquedaLower ? true : expandido === plat.plataforma;

            return (
              <div
                key={plat.plataforma}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggle(plat.plataforma)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="font-semibold text-gray-900">{plat.plataforma}</h3>
                    <span className="text-sm text-gray-500">
                      {plat.cuentas.length} cuenta{plat.cuentas.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {disponibles} disponible{disponibles !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {ocupados} ocupado{ocupados !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200">
                    {plat.cuentas.map((cuenta) => (
                      <div key={cuenta.id} className="border-b border-gray-100 last:border-0">
                        <div className="px-5 py-3 bg-gray-50 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-800">{cuenta.correo}</span>
                            <span className="text-xs text-gray-500 font-mono">{cuenta.contraseña}</span>
                          </div>
                          <button
                            onClick={() => handleEditarCuenta(plat.plataforma, cuenta)}
                            className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[500px]">
                            <thead>
                              <tr className="bg-gray-50/50">
                                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500"># Perfil</th>
                                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Pin</th>
                                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Estado</th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Cliente asignado</th>
                                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Expira</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cuenta.perfiles.map((perfil) => (
                                <tr
                                  key={`${cuenta.id}-${perfil.numero}`}
                                  className="border-t border-gray-100"
                                >
                                  <td className="py-2 px-3 text-sm text-gray-700 text-center">{perfil.numero}</td>
                                  <td className="py-2 px-3 text-sm font-mono text-gray-900 text-center">{perfil.pin}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span
                                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                        perfil.estado === "disponible"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {perfil.estado === "disponible" ? "Disponible" : "Ocupado"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-600">
                                    {perfil.clienteCorreo ?? "-"}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-600 text-center">
                                    {perfil.fechaExpiracion ?? "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editandoCuenta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setEditandoCuenta(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar cuenta - {editandoCuenta.plataforma}
            </h3>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input
                  type="email"
                  value={editCorreo}
                  onChange={(e) => setEditCorreo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="text"
                  value={editContraseña}
                  onChange={(e) => setEditContraseña(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pines de perfiles (hasta 6)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {editPins.map((pin, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        const next = [...editPins];
                        next[i] = val;
                        setEditPins(next);
                      }}
                      placeholder={`Pin ${i + 1}`}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditandoCuenta(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
