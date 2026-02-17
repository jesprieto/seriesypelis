/**
 * Capa de datos que usa Supabase.
 * Usa la clave anon para operaciones desde el cliente.
 * Si Supabase no está configurado, devuelve fallbacks vacíos.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Plan,
  Cliente,
  Compra,
  InventarioPlataforma,
  CuentaPlataforma,
  Perfil,
  PerfilAsignado,
} from "./mockData";

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
    imagen: r.imagen ?? undefined,
  }));
}

export async function setPlanesInSupabase(planes: Plan[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  for (const p of planes) {
    await supabase.from("planes").upsert(
      { id: p.id, nombre: p.nombre, precio: p.precio, imagen: p.imagen ?? null },
      { onConflict: "id" }
    );
  }
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

export async function agregarCuentaAlInventarioInSupabase(
  plataforma: string,
  cuenta: CuentaPlataforma
): Promise<void> {
  const inv = await getInventarioFromSupabase();
  let plat = inv.find((i) => i.plataforma.toLowerCase() === plataforma.toLowerCase());
  if (!plat) {
    plat = { plataforma, cuentas: [] };
    inv.push(plat);
  }
  plat.cuentas.push(cuenta);
  await setInventarioInSupabase(inv);
}

export async function asignarPerfilDisponibleInSupabase(
  plataforma: string,
  clienteCorreo: string
): Promise<PerfilAsignado | null> {
  if (!isSupabaseConfigured()) return null;
  const inv = await getInventarioFromSupabase();
  const plat = inv.find((i) => i.plataforma.toLowerCase() === plataforma.toLowerCase());
  if (!plat) return null;

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
  return null;
}

export async function insertarCompraInSupabase(clienteCorreo: string, compra: Compra): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from("compras").insert(mapCompraToDb(compra, clienteCorreo));
}

export async function contarPerfilesDisponiblesInSupabase(plataforma: string): Promise<number> {
  const inv = await getInventarioFromSupabase();
  const plat = inv.find((i) => i.plataforma.toLowerCase() === plataforma.toLowerCase());
  if (!plat) return 0;
  return plat.cuentas.reduce((acc, c) => acc + c.perfiles.filter((p) => p.estado === "disponible").length, 0);
}

// ─── Helpers ───

function mapCompraFromDb(r: Record<string, unknown>): Compra {
  return {
    codigo: String(r.codigo),
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
