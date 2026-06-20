
-- Public access policies for team-images and player-images buckets
-- (matches the project's existing public-access pattern on app tables)

CREATE POLICY "Public read team-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-images');

CREATE POLICY "Public upload team-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-images');

CREATE POLICY "Public update team-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-images')
WITH CHECK (bucket_id = 'team-images');

CREATE POLICY "Public delete team-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-images');

CREATE POLICY "Public read player-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-images');

CREATE POLICY "Public upload player-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-images');

CREATE POLICY "Public update player-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-images')
WITH CHECK (bucket_id = 'player-images');

CREATE POLICY "Public delete player-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-images');
