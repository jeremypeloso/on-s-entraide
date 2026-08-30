import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

/**
 * Upload une image dans le bucket public "photos".
 * Retourne l'URL publique, ou null en cas d'échec.
 */
export async function uploadPhoto(file: File, prefix: string): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > MAX_SIZE) return null;

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("photos").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return null;

  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}
