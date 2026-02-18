import dotenv from 'dotenv';
dotenv.config();

const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error('Usage: node scripts/createRankingsFunction.js <access_token>');
  process.exit(1);
}

const sql = `
DROP FUNCTION IF EXISTS get_ranked_creators(VARCHAR, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS get_ranked_creators(TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION get_ranked_creators(
  p_platform VARCHAR,
  p_rank_type VARCHAR DEFAULT 'subscribers',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  platform VARCHAR(20),
  platform_id VARCHAR(100),
  username VARCHAR(100),
  display_name VARCHAR(200),
  profile_image TEXT,
  subscribers BIGINT,
  total_views BIGINT,
  total_posts BIGINT,
  growth_30d BIGINT,
  hours_watched_day NUMERIC,
  hours_watched_week NUMERIC,
  hours_watched_month NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_stats AS (
    SELECT DISTINCT ON (cs.creator_id)
      cs.creator_id,
      COALESCE(cs.subscribers, cs.followers, 0) AS stat_subs,
      COALESCE(cs.total_views, 0) AS stat_views,
      COALESCE(cs.total_posts, 0) AS stat_posts,
      cs.followers AS stat_followers,
      COALESCE(cs.hours_watched_day, 0) AS stat_hwd,
      COALESCE(cs.hours_watched_week, 0) AS stat_hww,
      COALESCE(cs.hours_watched_month, 0) AS stat_hwm
    FROM creator_stats cs
    JOIN creators c ON c.id = cs.creator_id
    WHERE c.platform = p_platform
    ORDER BY cs.creator_id, cs.recorded_at DESC
  ),
  oldest_stats AS (
    SELECT DISTINCT ON (cs.creator_id)
      cs.creator_id,
      COALESCE(cs.subscribers, cs.followers, 0) AS old_subs,
      COALESCE(cs.total_views, 0) AS old_views,
      cs.followers AS old_followers,
      COALESCE(cs.hours_watched_month, 0) AS old_hwm
    FROM creator_stats cs
    JOIN creators c ON c.id = cs.creator_id
    WHERE c.platform = p_platform
    ORDER BY cs.creator_id, cs.recorded_at ASC
  ),
  stat_counts AS (
    SELECT cs.creator_id, COUNT(DISTINCT cs.recorded_at::date) AS num_days
    FROM creator_stats cs
    JOIN creators c ON c.id = cs.creator_id
    WHERE c.platform = p_platform
    GROUP BY cs.creator_id
  )
  SELECT
    c.id,
    c.platform,
    c.platform_id,
    c.username,
    c.display_name,
    c.profile_image,
    ls.stat_subs AS subscribers,
    ls.stat_views AS total_views,
    ls.stat_posts AS total_posts,
    CASE
      WHEN sc.num_days < (CASE WHEN p_platform = 'youtube' THEN 7 ELSE 2 END) THEN 0::BIGINT
      WHEN p_platform = 'youtube' THEN ls.stat_views - os.old_views
      WHEN p_platform = 'kick' THEN ls.stat_subs - os.old_subs
      WHEN p_platform = 'tiktok' THEN (COALESCE(ls.stat_followers, ls.stat_subs) - COALESCE(os.old_followers, os.old_subs))
      ELSE (ls.stat_hwm - os.old_hwm)::BIGINT
    END AS growth_30d,
    ls.stat_hwd AS hours_watched_day,
    ls.stat_hww AS hours_watched_week,
    ls.stat_hwm AS hours_watched_month
  FROM creators c
  JOIN latest_stats ls ON ls.creator_id = c.id
  LEFT JOIN oldest_stats os ON os.creator_id = c.id
  LEFT JOIN stat_counts sc ON sc.creator_id = c.id
  ORDER BY
    CASE p_rank_type
      WHEN 'views' THEN ls.stat_views
      WHEN 'growth' THEN
        CASE
          WHEN sc.num_days < (CASE WHEN p_platform = 'youtube' THEN 7 ELSE 2 END) THEN 0
          WHEN p_platform = 'youtube' THEN ls.stat_views - COALESCE(os.old_views, 0)
          WHEN p_platform = 'kick' THEN ls.stat_subs - COALESCE(os.old_subs, 0)
          WHEN p_platform = 'tiktok' THEN COALESCE(ls.stat_followers, ls.stat_subs) - COALESCE(os.old_followers, os.old_subs, 0)
          ELSE (ls.stat_hwm - COALESCE(os.old_hwm, 0))::BIGINT
        END
      ELSE ls.stat_subs
    END DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
`;

const grantSql = `GRANT EXECUTE ON FUNCTION get_ranked_creators(VARCHAR, VARCHAR, INTEGER) TO anon, authenticated;`;
const reloadSql = `NOTIFY pgrst, 'reload schema';`;

async function runSQL(query, label) {
  console.log(`Running: ${label}...`);
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  const text = await res.text();
  console.log(`  Status: ${res.status}`);
  console.log(`  Response: ${text}`);
  if (!res.ok) {
    throw new Error(`Failed: ${label} - ${res.status} ${text}`);
  }
  return text;
}

try {
  await runSQL(sql, 'Create function');
  await runSQL(grantSql, 'Grant execute');
  await runSQL(reloadSql, 'Reload PostgREST schema cache');
  
  const verifyResult = await runSQL(
    `SELECT routine_name, data_type FROM information_schema.routines WHERE routine_name = 'get_ranked_creators' AND routine_schema = 'public';`,
    'Verify function exists'
  );
  
  console.log('\nDone! Function created and verified.');
} catch (err) {
  console.error('\nError:', err.message);
  process.exit(1);
}
