import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Helper function to get authenticated user
export const getUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// Helper function to upload avatar (private)
export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (error) throw error;
  return data;
};

// Helper function to get avatar URL (private, signed)
export const getAvatarUrl = async (userId: string, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(fileName, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};

// Helper function to upload document (private)
export const uploadDocument = async (userId: string, file: File, category?: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (error) throw error;

  // Record in documents table
  const { error: dbError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      name: file.name,
      file_path: data.path,
      category: category || null,
      size: file.size,
    });

  if (dbError) throw dbError;
  return data;
};

// Helper function to get document URL (private, signed)
export const getDocumentUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};

// Helper function to delete document
export const deleteDocument = async (userId: string, documentId: string, filePath: string) => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (dbError) throw dbError;
};
