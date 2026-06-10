DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars authenticated read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');