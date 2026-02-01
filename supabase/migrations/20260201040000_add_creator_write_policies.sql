-- Allow public insert/update for creators (needed for upsert when viewing profiles)
CREATE POLICY "Public insert access" ON creators FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON creators FOR UPDATE USING (true);

-- Allow public insert for creator_stats (needed for tracking stats)
CREATE POLICY "Public insert access" ON creator_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON creator_stats FOR UPDATE USING (true);
