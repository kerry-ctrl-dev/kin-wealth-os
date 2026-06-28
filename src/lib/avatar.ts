import { supabase } from "@/integrations/supabase/client";

function sanitizeImageExtension(fileName: string): string {
  const ext = (fileName.split(".").pop() || "png").toLowerCase();
  const allowed = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
  return allowed.has(ext) ? ext : "png";
}

function isSafeAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Upload an avatar to the private avatars bucket and return its storage path. */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = sanitizeImageExtension(file.name);
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
  // Legacy values stored as full URLs — only allow safe http(s) URLs.
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return isSafeAvatarUrl(value) ? value : null;
  }
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(value, 60 * 60);
  if (error || !data) return null;
  return isSafeAvatarUrl(data.signedUrl) ? data.signedUrl : null;
}