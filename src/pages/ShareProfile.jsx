import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Youtube, Twitch } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import SEO from '../components/SEO';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getCreatorByUsername, getCreatorStats } from '../services/creatorService';
import { formatNumber } from '../lib/utils';

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
  kick: KickIcon,
  tiktok: TikTokIcon,
  bluesky: BlueskyIcon,
};

const platformColors = {
  youtube: { bg: 'bg-red-600',    chart: '#ef4444' },
  twitch:  { bg: 'bg-purple-600', chart: '#a855f7' },
  kick:    { bg: 'bg-green-600',  chart: '#22c55e' },
  tiktok:  { bg: 'bg-pink-600',   chart: '#ec4899' },
  bluesky: { bg: 'bg-sky-500',    chart: '#0ea5e9' },
};

const platformLabels = {
  youtube: 'Subscribers',
  twitch:  'Followers',
  kick:    'Paid Subs',
  tiktok:  'Followers',
  bluesky: 'Followers',
};

export default function ShareProfile() {
  const { platform, username } = useParams();
  const [creator, setCreator] = useState(null);
  const [statsHistory, setStatsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [platform, username]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dbCreator = await getCreatorByUsername(platform, username);
      if (!dbCreator) { setError('not found'); return; }
      const stats = await getCreatorStats(dbCreator.id, 30);
      setCreator(dbCreator);
      setStatsHistory(stats || []);
    } catch {
      setError('failed');
    } finally {
      setLoading(false);
    }
  };

  const Icon = platformIcons[platform];
  const colors = platformColors[platform] || platformColors.youtube;
  const label = platformLabels[platform] || 'Followers';

  const sorted = [...statsHistory].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  const chartData = sorted.map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: s.subscribers || s.followers || 0,
  }));
  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];
  const latestCount = latest ? (latest.subscribers || latest.followers || 0) : 0;
  const growth30d = latest && earliest && sorted.length > 1
    ? latestCount - (earliest.subscribers || earliest.followers || 0)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-gray-400">Creator not found.</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${creator.display_name} - ${platform} Stats`}
        description={`${creator.display_name}'s ${platform} stats powered by ShinyPull.`}
      />

      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Platform accent bar */}
            <div className={`h-1 ${colors.bg}`} />

            <div className="p-6 sm:p-8">
              {/* Profile header */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={creator.profile_image || '/placeholder-avatar.svg'}
                  alt={creator.display_name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-gray-800 border-2 border-gray-700 flex-shrink-0"
                  onError={(e) => { e.target.src = '/placeholder-avatar.svg'; }}
                />
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-100 truncate">{creator.display_name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-gray-400">@{creator.username}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} text-white`}>
                      {Icon && <Icon className="w-3 h-3" />}
                      {platform}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-2xl sm:text-3xl font-black text-gray-100">{formatNumber(latestCount)}</p>
                </div>
                {growth30d !== null && (
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Last 30 Days</p>
                    <p className={`text-2xl sm:text-3xl font-black ${growth30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {growth30d >= 0 ? '+' : ''}{formatNumber(growth30d)}
                    </p>
                  </div>
                )}
              </div>

              {/* Chart */}
              {chartData.length > 1 && (
                <div className="h-40 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="shareChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.chart} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={colors.chart} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' }}
                        formatter={(value) => [formatNumber(value), label]}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={colors.chart}
                        strokeWidth={2}
                        fill="url(#shareChartGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-600">Powered by ShinyPull</p>
                <Link
                  to={`/${platform}/${username}`}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  shinypull.com →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
