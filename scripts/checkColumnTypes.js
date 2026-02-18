import dotenv from 'dotenv';
dotenv.config();

const token = process.argv[2];
const PROJECT_REF = 'ziiqqbfcncjdewjkbvyq';

async function runSQL(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  return res.json();
}

const cols = await runSQL(`
  SELECT column_name, data_type, character_maximum_length 
  FROM information_schema.columns 
  WHERE table_name = 'creators' AND table_schema = 'public'
  ORDER BY ordinal_position
`);
console.log('creators columns:');
console.table(cols);

const statCols = await runSQL(`
  SELECT column_name, data_type, character_maximum_length 
  FROM information_schema.columns 
  WHERE table_name = 'creator_stats' AND table_schema = 'public'
  AND column_name IN ('subscribers', 'followers', 'total_views', 'total_posts', 'followers_gained_month', 'views_gained_month', 'hours_watched_day', 'hours_watched_week', 'hours_watched_month')
  ORDER BY ordinal_position
`);
console.log('\ncreator_stats columns:');
console.table(statCols);
