DROP POLICY IF EXISTS "avatars authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_read" ON storage.objects;

CREATE POLICY "avatars owner read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);