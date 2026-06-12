-- Storage Bucket RLS Policies for Avatars (Private)
CREATE POLICY "users_own_avatars" ON storage.objects
  FOR ALL
  USING (bucket_id = 'avatars' AND auth.uid()::text = owner);

CREATE POLICY "avatars_authenticated_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = owner);

-- Storage Bucket RLS Policies for Documents (Private)
CREATE POLICY "users_own_documents" ON storage.objects
  FOR ALL
  USING (bucket_id = 'documents' AND auth.uid()::text = owner);

CREATE POLICY "documents_authenticated_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = owner);
