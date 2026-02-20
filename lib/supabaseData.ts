/**
 * Capa de datos que usa Supabase.
 * Usa la clave anon para operaciones desde el cliente.
 * Si Supabase no está configurado, devuelve fallbacks vacíos.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import { normalizarPlataforma } from "./plataformas";
import type {
  Plan,
  Cliente,
  Compra,
  InventarioPlataforma,
  CuentaPlataforma,
  Perfil,
  PerfilAsignado,
} from "./types";

// ─── Planes ───

export async function getPlanesFromSupabase(): Promise<Plan[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("planes")
    .select("*")
    .order("nombre");
  if (error) {
    console.error("getPlanes error:", error);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    precio: r.precio,
    precioMayorista: r.precio_mayorista != null ? Number(r.precio_mayorista) : undefined,
    precioDetal: r.precio_detal != null ? Number(r.precio_detal) : undefined,
    imagen: r.imagen ?? undefined,
    promo: r.promo === true,
  }));
}

export async function setPlanesInSupabase(planes: Plan[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  for (const p of planes) {
    const { error } = await supabase.from("planes").upsert(
      {
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        precio_mayorista: p.precioMayorista ?? null,
        precio_detal: p.precioDetal ?? null,
        imagen: p.imagen ?? null,
        promo: p.promo ?? false,
      },
      { onConflict: "id" }
    );
    if (error) console.error("upsert plan error:", error);
    await ensureInventarioPlataformaExistsInSupabase(p.nombre);
  }
}

export async function updatePlanInSupabase(plan: Plan): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase
    .from("planes")
    .update({
      nombre: plan.nombre,
      precio: plan.precio,
      precio_mayorista: plan.precioMayorista ?? null,
      precio_detal: plan.precioDetal ?? null,
      imagen: plan.imagen ?? null,
      promo: plan.promo ?? false,
    })
    .eq("id", plan.id);
  if (error) console.error("updatePlan error:", error);
  await ensureInventarioPlataformaExistsInSupabase(plan.nombre);
}

export async function deletePlanFromSupabase(planId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from("planes").delete().eq("id", planId);
  if (error) console.error("deletePlan error:", error);
}

// ─── Clientes ───

export async function getClientesFromSupabase(): Promise<Cliente[]> {
  if (!isSupabaseConfigured()) return [];
  const { data: clientesData, error: clientesError } = await supabase
    .from("clientes")
    .select("*");
  if (clientesError) {
    console.error("getClientes error:", clientesError);
    return [];
  }
  const clientes = clientesData ?? [];

  const { data: comprasData } = await supabase
    .from("compras")
    .select("*")
    .order("fecha_compra_iso", { ascending: false });
  const comprasRaw = comprasData ?? [];

  return clientes.map((c) => {
    const historial = comprasRaw
      .filter((comp) => comp.cliente_correo?.toLowerCase() === c.correo.toLowerCase())
      .map((comp) => mapCompraFromDb(comp));
    return {
      id: c.id,
      nombre: c.nombre,
      correo: c.correo,
      contraseña: c.contraseña,
      whatsapp: c.whatsapp ?? undefined,
      avatarEmoji: c.avatar_emoji ?? undefined,
      saldo: c.saldo ?? 0,
      perfilPrecio: (c.perfil_precio as "mayorista" | "detal") ?? undefined,
      historialCompras: historial,
    };
  });
}

export async function getClienteByCorreoFromSupabase(correo: string): Promise<Cliente | undefined> {
  const clientes = await getClientesFromSupabase();
  return clientes.find((c) => c.correo.toLowerCase() === correo.toLowerCase());
}

export async function registrarClienteInSupabase(data: {
  nombre: string;
  correo: string;
  contraseña: string;
  whatsapp?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado" };
  const existente = await getClienteByCorreoFromSupabase(data.correo.trim());
  if (existente) return { ok: false, error: "Este correo ya está registrado" };
  const id = `c-${Date.now()}`;
  const { error } = await supabase.from("clientes").insert({
    id,
    nombre: data.nombre.trim(),
    correo: data.correo.trim(),
    contraseña: data.contraseña,
    whatsapp: data.whatsapp?.trim() || null,
    saldo: 0,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function actualizarClienteInSupabase(
  correo: string,
  updater: (c: Cliente) => Partial<Cliente>
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const cliente = await getClienteByCorreoFromSupabase(correo);
  if (!cliente) return;
  const updated = updater(cliente);
  const { cliente_correo, ...rest } = updated as Cliente & { cliente_correo?: string };
  await supabase
    .from("clientes")
    .update({
      nombre: updated.nombre ?? cliente.nombre,
      contraseña: updated.contraseña ?? cliente.contraseña,
      whatsapp: updated.whatsapp ?? cliente.whatsapp,
      avatar_emoji: updated.avatarEmoji ?? cliente.avatarEmoji,
      saldo: updated.saldo ?? cliente.saldo,
      perfil_precio: updated.perfilPrecio ?? cliente.perfilPrecio ?? null,
    })
    .eq("correo", correo);

  if (updated.historialCompras !== undefined) {
    // Actualizar compras: borrar las anteriores y reinsertar (simplificado)
    await supabase.from("compras").delete().eq("cliente_correo", correo);
    for (const comp of updated.historialCompras) {
      await supabase.from("compras").insert(mapCompraToDb(comp, correo));
    }
  }
}

// ─── Inventario ───

export async function getInventarioFromSupabase(): Promise<InventarioPlataforma[]> {
  if (!isSupabaseConfigured()) return [];
  const { data: invData } = await supabase.from("inventario_plataformas").select("*");
  const invPlatforms = invData ?? [];

  const result: InventarioPlataforma[] = [];
  for (const ip of invPlatforms) {
    const { data: cuentasData } = await supabase
      .from("cuentas_plataforma")
      .select("id, correo, contraseña")
      .eq("inventario_plataforma_id", ip.id);
    const cuentasRaw = (cuentasData ?? []) as unknown as Array<{ id: string; correo: string; contraseña: string }>;

    const cuentasMapped: CuentaPlataforma[] = [];
    for (const c of cuentasRaw) {
      const { data: perfilesData } = await supabase
        .from("perfiles")
        .select("numero, pin, estado, cliente_correo, fecha_asignacion, fecha_expiracion")
        .eq("cuenta_plataforma_id", String(c.id))
        .order("numero");
      const perfiles = (perfilesData ?? []).map((p) => ({
        numero: p.numero,
        pin: p.pin,
        estado: p.estado as "disponible" | "ocupado",
        clienteCorreo: p.cliente_correo ?? undefined,
        fechaAsignacion: p.fecha_asignacion ?? undefined,
        fechaExpiracion: p.fecha_expiracion ?? undefined,
      }));
      cuentasMapped.push({
        id: String(c.id),
        correo: String(c.correo),
        contraseña: String(c.contraseña),
        perfiles,
      });
    }
    result.push({ plataforma: ip.plataforma, cuentas: cuentasMapped });
  }
  return result;
}

export async function setInventarioInSupabase(inv: InventarioPlataforma[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  for (const item of inv) {
    const { data: ip } = await supabase
      .from("inventario_plataformas")
      .select("id")
      .eq("plataforma", item.plataforma)
      .maybeSingle();
    let invPlatformId = ip?.id;
    if (!invPlatformId) {
      const { data: inserted } = await supabase
        .from("inventario_plataformas")
        .insert({ plataforma: item.plataforma })
        .select("id")
        .single();
      invPlatformId = inserted?.id;
    }
    if (!invPlatformId) continue;

    for (const cuenta of item.cuentas) {
      const { data: cuentaExist } = await supabase
        .from("cuentas_plataforma")
        .select("id")
        .eq("id", cuenta.id)
        .maybeSingle();
      if (!cuentaExist) {
        await supabase.from("cuentas_plataforma").insert({
          id: cuenta.id,
          inventario_plataforma_id: invPlatformId,
          correo: cuenta.correo,
          contraseña: cuenta.contraseña,
        });
      }
      for (const perfil of cuenta.perfiles) {
        await supabase.from("perfiles").upsert(
          {
            cuenta_plataforma_id: cuenta.id,
            numero: perfil.numero,
            pin: perfil.pin,
            estado: perfil.estado,
            cliente_correo: perfil.clienteCorreo ?? null,
            fecha_asignacion: perfil.fechaAsignacion ?? null,
            fecha_expiracion: perfil.fechaExpiracion ?? null,
          },
          { onConflict: "cuenta_plataforma_id,numero" }
        );
      }
    }
  }
}

/** Crea la entrada en inventario_plataformas si no existe (para sincronizar planes con inventario) */
export async function ensureInventarioPlataformaExistsInSupabase(plataforma: string): Promise<void> {
  if (!isSupabaseConfigured() || !plataforma.trim()) return;
  const nombre = plataforma.trim();
  const { data: existente } = await supabase
    .from("inventario_plataformas")
    .select("id")
    .eq("plataforma", nombre)
    .maybeSingle();
  if (!existente) {
    const { error } = await supabase.from("inventario_plataformas").insert({ plataforma: nombre });
    if (error) console.error("ensureInventarioPlataformaExists error:", error);
  }
}

export async function correoYaExisteEnPlataformaEnSupabase(
  plataforma: string,
  correo: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const inv = await getInventarioFromSupabase();
  const nombreBuscado = normalizarPlataforma(plataforma);
  const plat = inv.find((i) => normalizarPlataforma(i.plataforma) === nombreBuscado);
  if (!plat) return false;
  const correoLower = correo.trim().toLowerCase();
  return plat.cuentas.some(
    (c) => c.correo.trim().toLowerCase() === correoLower
  );
}

export async function agregarCuentaAlInventarioInSupabase(
  plataforma: string,
  cuenta: CuentaPlataforma
): Promise<void> {
  const inv = await getInventarioFromSupabase();
  const nombreBuscado = normalizarPlataforma(plataforma);
  let plat = inv.find((i) => normalizarPlataforma(i.plataforma) === nombreBuscado);
  if (!plat) {
    plat = { plataforma: nombreBuscado, cuentas: [] };
    inv.push(plat);
  }
  plat.cuentas.push(cuenta);
  await setInventarioInSupabase(inv);
}

export async function liberarPerfilInSupabase(
  plataforma: string,
  cuentaId: string,
  cuentaCorreo: string,
  numeroPerfil: number,
  clienteCorreo: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const nombrePlat = normalizarPlataforma(plataforma);

  const { error: errPerfil } = await supabase
    .from("perfiles")
    .update({
      estado: "disponible",
      cliente_correo: null,
      fecha_asignacion: null,
      fecha_expiracion: null,
    })
    .eq("cuenta_plataforma_id", cuentaId)
    .eq("numero", numeroPerfil);

  if (errPerfil) {
    console.error("liberarPerfil update perfiles:", errPerfil);
    return false;
  }

  // Buscar la compra por cliente + plataforma + perfil (correo en DB puede diferir en mayúsculas)
  const { data: comprasMatch } = await supabase
    .from("compras")
    .select("id, correo")
    .eq("cliente_correo", clienteCorreo)
    .eq("plataforma", nombrePlat)
    .eq("perfil", numeroPerfil);

  const cuentaCorreoLower = (cuentaCorreo ?? "").trim().toLowerCase();
  const compraId = comprasMatch?.find(
    (c) => (c.correo ?? "").trim().toLowerCase() === cuentaCorreoLower
  )?.id;

  if (compraId) {
    const { error: errCompra } = await supabase
      .from("compras")
      .update({
        estado: "Suspendido",
        correo: null,
        contraseña: null,
        perfil: null,
        pin: null,
      })
      .eq("id", compraId);

    if (errCompra) {
      console.error("liberarPerfil update compras:", errCompra);
    }
  }
  return true;
}

/** Suspende en compras la fila que coincida (por id). */
async function suspenderCompraById(compraId: string): Promise<void> {
  await supabase
    .from("compras")
    .update({
      estado: "Suspendido",
      correo: null,
      contraseña: null,
      perfil: null,
      pin: null,
    })
    .eq("id", compraId);
}

export async function eliminarCuentaDelInventarioInSupabase(
  plataforma: string,
  cuentaId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const nombrePlat = normalizarPlataforma(plataforma);
  const inv = await getInventarioFromSupabase();
  const plat = inv.find((i) => normalizarPlataforma(i.plataforma) === nombrePlat);
  if (!plat) return false;
  const cuenta = plat.cuentas.find((c) => c.id === cuentaId);
  if (!cuenta) return false;

  const cuentaCorreoLower = (cuenta.correo ?? "").trim().toLowerCase();
  for (const perfil of cuenta.perfiles) {
    if (perfil.estado === "ocupado" && perfil.clienteCorreo) {
      const { data: comprasMatch } = await supabase
        .from("compras")
        .select("id, correo")
        .eq("cliente_correo", perfil.clienteCorreo)
        .eq("plataforma", nombrePlat)
        .eq("perfil", perfil.numero);
      const compraId = (comprasMatch ?? []).find(
        (c: { id: string; correo?: string | null }) =>
          (c.correo ?? "").trim().toLowerCase() === cuentaCorreoLower
      )?.id ?? (comprasMatch?.[0] as { id: string } | undefined)?.id;
      if (compraId) await suspenderCompraById(compraId);
    }
  }

  await supabase.from("perfiles").delete().eq("cuenta_plataforma_id", cuentaId);
  const { error: errCuenta } = await supabase
    .from("cuentas_plataforma")
    .delete()
    .eq("id", cuentaId);
  if (errCuenta) {
    console.error("eliminarCuentaDelInventario delete cuenta:", errCuenta);
    return false;
  }
  return true;
}

export async function asignarPerfilDisponibleInSupabase(
  plataforma: string,
  clienteCorreo: string
): Promise<PerfilAsignado | null> {
  if (!isSupabaseConfigured()) return null;
  const inv = await getInventarioFromSupabase();
  const nombreBuscado = normalizarPlataforma(plataforma);
  const platsCoincidentes = inv.filter((i) => normalizarPlataforma(i.plataforma) === nombreBuscado);

  for (const plat of platsCoincidentes) {
    for (const cuenta of plat.cuentas) {
      for (const perfil of cuenta.perfiles) {
        if (perfil.estado === "disponible") {
          const now = new Date();
          const exp = new Date(now);
          exp.setDate(exp.getDate() + 30);
          const fechaExp = exp.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });

          await supabase
            .from("perfiles")
            .update({
              estado: "ocupado",
              cliente_correo: clienteCorreo,
              fecha_asignacion: now.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }),
              fecha_expiracion: fechaExp,
            })
            .eq("cuenta_plataforma_id", cuenta.id)
            .eq("numero", perfil.numero);

          return {
            correo: cuenta.correo,
            contraseña: cuenta.contraseña,
            perfil: perfil.numero,
            pin: perfil.pin,
            fechaExpiracion: fechaExp,
            fechaExpiracionISO: exp.toISOString(),
          };
        }
      }
    }
  }
  return null;
}

export async function insertarCompraInSupabase(clienteCorreo: string, compra: Compra): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from("compras").insert(mapCompraToDb(compra, clienteCorreo));
}

export async function contarPerfilesDisponiblesInSupabase(plataforma: string): Promise<number> {
  const inv = await getInventarioFromSupabase();
  const nombreBuscado = normalizarPlataforma(plataforma);
  const platsCoincidentes = inv.filter((i) => normalizarPlataforma(i.plataforma) === nombreBuscado);
  return platsCoincidentes.reduce(
    (acc, plat) => acc + plat.cuentas.reduce((s, c) => s + c.perfiles.filter((p) => p.estado === "disponible").length, 0),
    0
  );
}

/** Obtiene disponibilidad de todas las plataformas en una sola llamada (optimizado) */
export async function getDisponibilidadTodasPlataformasInSupabase(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};
  const inv = await getInventarioFromSupabase();
  const result: Record<string, number> = {};
  for (const plat of inv) {
    const nombre = normalizarPlataforma(plat.plataforma);
    const count = plat.cuentas.reduce(
      (s, c) => s + c.perfiles.filter((p) => p.estado === "disponible").length,
      0
    );
    result[nombre] = (result[nombre] ?? 0) + count;
  }
  return result;
}

// ─── Helpers ───

function mapCompraFromDb(r: Record<string, unknown>): Compra {
  const codigoHexRaw = r.codigo_hex;
  return {
    codigo: String(r.codigo),
    codigoHex: typeof codigoHexRaw === "string" && codigoHexRaw ? codigoHexRaw : String(r.id || r.codigo).slice(0, 12).toUpperCase(),
    estado: (r.estado as Compra["estado"]) ?? "Disponible",
    fechaCompra: String(r.fecha_compra ?? ""),
    fechaCompraISO: r.fecha_compra_iso as string | undefined,
    plataforma: String(r.plataforma),
    informacion: String(r.informacion ?? ""),
    valorCompra: Number(r.valor_compra),
    correo: r.correo as string | undefined,
    contraseña: r.contraseña as string | undefined,
    perfil: r.perfil as number | undefined,
    pin: r.pin as string | undefined,
    fechaExpiracion: r.fecha_expiracion as string | undefined,
    fechaExpiracionISO: r.fecha_expiracion_iso as string | undefined,
  };
}

function mapCompraToDb(c: Compra, clienteCorreo: string): Record<string, unknown> {
  return {
    codigo: c.codigo,
    codigo_hex: c.codigoHex ?? null,
    cliente_correo: clienteCorreo,
    plataforma: c.plataforma,
    estado: c.estado,
    valor_compra: c.valorCompra,
    informacion: c.informacion,
    correo: c.correo ?? null,
    contraseña: c.contraseña ?? null,
    perfil: c.perfil ?? null,
    pin: c.pin ?? null,
    fecha_compra: c.fechaCompra,
    fecha_compra_iso: c.fechaCompraISO ?? null,
    fecha_expiracion: c.fechaExpiracion ?? null,
    fecha_expiracion_iso: c.fechaExpiracionISO ?? null,
  };
}

// ─── Admin (login) ───

export async function validarAdminEnSupabase(usuario: string, clave: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await supabase
    .from("admin_usuarios")
    .select("id")
    .eq("usuario", usuario.trim())
    .eq("clave", clave.trim())
    .maybeSingle();
  if (error) {
    console.error("validarAdmin error:", error);
    return false;
  }
  return data != null;
}
