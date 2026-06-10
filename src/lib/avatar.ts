import { supabase } from "@/integrations/supabase/client";

/** Upload an avatar to the private avatars bucket and return its storage path. */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/**
 * Resolve a stored avatar value (path or legacy signed URL) to a fresh
 * short-lived signed URL the browser can render. Returns null on failure.
 */
export async function resolveAvatarUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  // Legacy values stored as full URLs — return as-is (will 401 once policy tightened, but harmless).
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(value, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}