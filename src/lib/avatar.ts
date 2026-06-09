import { supabase } from "@/integrations/supabase/client";

/** Upload an avatar to the private avatars bucket and return a long-lived signed URL. */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr || !data) throw signErr ?? new Error("Could not sign URL");
  return data.signedUrl;
}