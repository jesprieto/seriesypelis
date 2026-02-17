/**
 * Supabase Storage - bucket "images" para fotos de plataformas y otras imágenes.
 */

import { supabase, isSupabaseConfigured } from "./supabase";

const BUCKET = "images";

export async function ensureImagesBucket(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (error) {
    if (error.message?.includes("already exists")) return true;
    console.error("createBucket error:", error);
    return false;
  }
  return true;
}

/**
 * Sube una imagen al bucket y devuelve la URL pública.
 * Si el bucket no existe, devuelve error.
 */
export async function uploadPlatformImage(
  file: File,
  planId: string
): Promise<{ url: string } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase no configurado" };
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const sanitizedExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const filePath = `plataformas/${planId}.${sanitizedExt}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    contentType: file.type,
    upsert: true,
    cacheControl: "3600",
  });

  if (error) {
    return { error: error.message };
  }

  // Usar filePath local en vez de data.path para evitar URL doble-bucket
  // en versiones de supabase-js donde data.path incluye el nombre del bucket
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  // Agregar timestamp anti-caché para forzar recarga de la imagen
  const cacheBuster = `?t=${Date.now()}`;
  return { url: urlData.publicUrl + cacheBuster };
}

/**
 * Convierte base64 (data URL) a File para subir. Usado cuando viene de input previo.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  const arr = dataUrl.split(",");
  if (arr.length < 2) return null;
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
