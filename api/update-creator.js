// Server-side API endpoint to handle creator and stats updates
// Uses service role key (bypasses RLS) with proper validation

export default async function handler(req, res) {
  // Enable CORS
  const allowedOrigins = [
    'https://shinypull.com',
    'https://www.shinypull.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { creatorData, creatorId, statsData } = req.body;

    // Import Supabase client with service role key
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side only
    );

    let creator = null;

    // If creatorData provided, upsert the creator
    if (creatorData) {
      // Validate required fields for creator upsert
      if (!creatorData.platform || !creatorData.platformId) {
        return res.status(400).json({ error: 'Invalid creator data' });
      }

      const { data: upsertedCreator, error: creatorError } = await supabase
        .from('creators')
        .upsert({
          platform: creatorData.platform,
          platform_id: creatorData.platformId,
          username: creatorData.username,
          display_name: creatorData.displayName,
          profile_image: creatorData.profileImage,
          description: creatorData.description,
          country: creatorData.country,
          category: creatorData.category,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'platform,platform_id',
        })
        .select()
        .single();

      if (creatorError) {
        console.error('Creator upsert error:', creatorError);
        return res.status(500).json({ error: 'Failed to save creator' });
      }

      creator = upsertedCreator;
    }

    // If stats data provided, save it
    // Use creatorId from request if provided, otherwise use creator.id from upsert above
    if (statsData && (creatorId || creator)) {
      const targetCreatorId = creatorId || creator.id;

      // Get today's date in America/New_York timezone
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      const { error: statsError } = await supabase
        .from('creator_stats')
        .upsert({
          creator_id: targetCreatorId,
          recorded_at: today,
          subscribers: statsData.subscribers,
          total_views: statsData.totalViews,
          total_posts: statsData.totalPosts,
          followers: statsData.subscribers,
        }, {
          onConflict: 'creator_id,recorded_at',
        });

      if (statsError) {
        console.error('Stats upsert error:', statsError);
        return res.status(500).json({ error: 'Failed to save stats' });
      }
    }

    return res.status(200).json({
      success: true,
      creator: creator
    });

  } catch (error) {
    console.error('Update creator API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
