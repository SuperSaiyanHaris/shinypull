/**
 * Updates the search_creators_fuzzy RPC function with improved ranking.
 * Run: node scripts/updateFuzzySearch.js <access_token>
 */
const ACCESS_TOKEN = process.argv[2];
const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';

if (!ACCESS_TOKEN) {
  console.error('Usage: node scripts/updateFuzzySearch.js <access_token>');
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

const sql = `
CREATE OR REPLACE FUNCTION search_creators_fuzzy(
  p_query   TEXT,
  p_platform TEXT DEFAULT NULL,
  p_limit   INT  DEFAULT 20
)
RETURNS SETOF creators
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  stripped  TEXT;
  sanitized TEXT;
BEGIN
  sanitized := lower(trim(p_query));
  stripped  := regexp_replace(sanitized, '[._\\-\\s]', '', 'g');

  -- Guard: if the stripped term is empty or single char, skip (would match too broadly)
  IF length(stripped) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT *
  FROM creators c
  WHERE
    (
      lower(c.username)      LIKE '%' || sanitized || '%'
      OR lower(c.display_name) LIKE '%' || sanitized || '%'
      OR regexp_replace(lower(c.username),      '[._\\-\\s]', '', 'g') LIKE '%' || stripped || '%'
      OR regexp_replace(lower(c.display_name),  '[._\\-\\s]', '', 'g') LIKE '%' || stripped || '%'
    )
    AND (p_platform IS NULL OR c.platform = p_platform)
  ORDER BY
    -- 1. Exact username match (raw or stripped) — highest priority
    CASE
      WHEN lower(c.username) = sanitized
        OR regexp_replace(lower(c.username), '[._\\-\\s]', '', 'g') = stripped
      THEN 0 ELSE 1
    END,
    -- 2. Username starts with the query (raw or stripped)
    CASE
      WHEN lower(c.username) LIKE sanitized || '%'
        OR regexp_replace(lower(c.username), '[._\\-\\s]', '', 'g') LIKE stripped || '%'
      THEN 0 ELSE 1
    END,
    -- 3. Username contains the query (raw or stripped)
    CASE
      WHEN lower(c.username) LIKE '%' || sanitized || '%'
        OR regexp_replace(lower(c.username), '[._\\-\\s]', '', 'g') LIKE '%' || stripped || '%'
      THEN 0 ELSE 1
    END,
    -- 4. Display name match (raw or stripped) — lower priority than username
    CASE
      WHEN lower(c.display_name) LIKE '%' || sanitized || '%'
        OR regexp_replace(lower(c.display_name), '[._\\-\\s]', '', 'g') LIKE '%' || stripped || '%'
      THEN 0 ELSE 1
    END
  LIMIT p_limit;
END;
$$;
`;

runSQL(sql)
  .then((result) => {
    console.log('Function updated successfully:', JSON.stringify(result));
  })
  .catch((err) => {
    console.error('Failed to update function:', err.message);
    process.exit(1);
  });
