import { createServerFn } from '@tanstack/react-start/server';
import { supabase } from '~/lib/supabase';
import type { Database } from '~/types/supabase';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];

export const getDocuments = createServerFn({ method: 'GET' })(
  async (
    userId: string,
    filters?: {
      category?: string;
    }
  ): Promise<Document[]> => {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
);

export const createDocument = createServerFn({ method: 'POST' })(
  async (userId: string, document: DocumentInsert): Promise<Document> => {
    const { data, error } = await supabase
      .from('documents')
      .insert({ ...document, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const updateDocument = createServerFn({ method: 'POST' })(
  async (userId: string, documentId: string, updates: Partial<DocumentInsert>): Promise<Document> => {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const deleteDocument = createServerFn({ method: 'POST' })(
  async (userId: string, documentId: string): Promise<void> => {
    // Get document to find file path
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (doc?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (dbError) throw dbError;
  }
);

export const getDocumentSignedUrl = createServerFn({ method: 'GET' })(
  async (userId: string, documentId: string, expirySeconds = 3600): Promise<string> => {
    // Verify document belongs to user
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!doc?.file_path) throw new Error('Document not found');

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, expirySeconds);

    if (error) throw error;
    return data.signedUrl;
  }
);

export const getDocumentCategories = createServerFn({ method: 'GET' })(
  async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('documents')
      .select('category')
      .eq('user_id', userId)
      .not('category', 'is', null);

    if (error) throw error;

    // Get unique categories
    const categories = Array.from(new Set((data || []).map((d) => d.category).filter(Boolean)));
    return categories.sort();
  }
);

export const getVaultStats = createServerFn({ method: 'GET' })(
  async (userId: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    categoryCounts: Record<string, number>;
  }> => {
    const { data, error } = await supabase
      .from('documents')
      .select('category, size')
      .eq('user_id', userId);

    if (error) throw error;

    const documents = data || [];
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const categoryCounts = documents.reduce(
      (acc, doc) => {
        const category = doc.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalDocuments: documents.length,
      totalSize,
      categoryCounts,
    };
  }
);

export const searchDocuments = createServerFn({ method: 'GET' })(
  async (userId: string, query: string): Promise<Document[]> => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
);
