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
 */
export async function uploadPlatformImage(
  file: File,
  planId: string
): Promise<{ url: string } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase no configurado" };
  const ext = file.name.split(".").pop() || "jpg";
  const path = `plataformas/${planId}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) return { error: error.message };
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl };
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
