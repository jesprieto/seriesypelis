import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con service_role para operaciones que requieren más permisos
// Usar solo en server components o API routes, nunca exponer en el cliente
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
  }
  return createClient(supabaseUrl, serviceKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
