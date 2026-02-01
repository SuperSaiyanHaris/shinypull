import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Youtube, Twitch, Instagram, Users, Eye, Video, TrendingUp, TrendingDown, Minus, ExternalLink, AlertCircle } from 'lucide-react';
import { getChannelByUsername as getYouTubeChannel } from '../services/youtubeService';
import { getChannelByUsername as getTwitchChannel } from '../services/twitchService';
import { upsertCreator, saveCreatorStats, getCreatorByUsername, getCreatorStats } from '../services/creatorService';

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
  instagram: Instagram,
};

const platformColors = {
  youtube: 'bg-red-600',
  twitch: 'bg-purple-600',
  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
  tiktok: 'bg-pink-500',
};

const platformUrls = {
  youtube: (username) => `https://youtube.com/@${username}`,
  twitch: (username) => `https://twitch.tv/${username}`,
  instagram: (username) => `https://instagram.com/${username}`,
  tiktok: (username) => `https://tiktok.com/@${username}`,
};

export default function CreatorProfile() {
  const { platform, username } = useParams();
  const [creator, setCreator] = useState(null);
  const [statsHistory, setStatsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCreator();
  }, [platform, username]);

  const loadCreator = async () => {
    setLoading(true);
    setError(null);

    try {
      let channelData = null;

      if (platform === 'youtube') {
        channelData = await getYouTubeChannel(username);
      } else if (platform === 'twitch') {
        channelData = await getTwitchChannel(username);
      } else {
        // Other platforms - check database only
        const dbCreator = await getCreatorByUsername(platform, username);
        if (dbCreator) {
          setCreator(dbCreator);
        }
        setLoading(false);
        return;
      }

      if (channelData) {
        setCreator(channelData);

        // Save to database (fire and forget)
        try {
          const dbCreator = await upsertCreator(channelData);
          await saveCreatorStats(dbCreator.id, {
            subscribers: channelData.subscribers || channelData.followers,
            totalViews: channelData.totalViews,
            totalPosts: channelData.totalPosts,
          });

          // Fetch stats history
          const history = await getCreatorStats(dbCreator.id, 30);
          setStatsHistory(history || []);
        } catch (dbErr) {
          console.warn('Failed to save to database:', dbErr);
        }
      }
    } catch (err) {
      console.error('Error loading creator:', err);
      setError(err.message || 'Failed to load creator');
    } finally {
      setLoading(false);
    }
  };

  const Icon = platformIcons[platform];

  // Calculate growth metrics from history
  const calculateGrowthMetrics = () => {
    if (statsHistory.length < 2) return null;

    const sortedStats = [...statsHistory].sort((a, b) => 
      new Date(b.recorded_at) - new Date(a.recorded_at)
    );

    const latest = sortedStats[0];
    const oldest = sortedStats[sortedStats.length - 1];

    // Calculate daily changes
    const dailyStats = sortedStats.map((stat, index) => {
      const prevStat = sortedStats[index + 1];
      return {
        ...stat,
        subsChange: prevStat ? (stat.subscribers || stat.followers) - (prevStat.subscribers || prevStat.followers) : 0,
        viewsChange: prevStat ? stat.total_views - prevStat.total_views : 0,
        videosChange: prevStat ? (stat.total_posts || 0) - (prevStat.total_posts || 0) : 0,
      };
    });

    const subsGrowth = (latest.subscribers || latest.followers) - (oldest.subscribers || oldest.followers);
    const viewsGrowth = latest.total_views - oldest.total_views;
    const videosGrowth = (latest.total_posts || 0) - (oldest.total_posts || 0);

    const days = sortedStats.length;
    const dailyAvgSubs = Math.round(subsGrowth / days);
    const dailyAvgViews = Math.round(viewsGrowth / days);
    const weeklyAvgSubs = Math.round(subsGrowth / (days / 7));
    const weeklyAvgViews = Math.round(viewsGrowth / (days / 7));

    // Last 14 days metrics
    const last14Days = sortedStats.slice(0, Math.min(14, sortedStats.length));
    const last14First = last14Days[last14Days.length - 1];
    const last14Subs = last14Days.length > 1 ? (latest.subscribers || latest.followers) - (last14First.subscribers || last14First.followers) : 0;
    const last14Views = last14Days.length > 1 ? latest.total_views - last14First.total_views : 0;

    return {
      dailyStats: dailyStats.slice(0, 14), // Show last 14 days
      last30Days: { subs: subsGrowth, views: viewsGrowth, videos: videosGrowth },
      last14Days: { subs: last14Subs, views: last14Views },
      dailyAverage: { subs: dailyAvgSubs, views: dailyAvgViews },
      weeklyAverage: { subs: weeklyAvgSubs, views: weeklyAvgViews },
    };
  };

  const metrics = calculateGrowthMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading {platform} channel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Creator</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadCreator}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Creator not found
  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
              {Icon && <Icon className="w-12 h-12 text-gray-500" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">@{username}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${platformColors[platform]} text-white`}>
                  {platform}
                </span>
              </div>
              <p className="text-gray-400 mb-4">Creator not found</p>
              <a
                href={platformUrls[platform]?.(username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                Check on {platform}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Creator found - show profile
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Banner */}
        {creator.bannerImage && (
          <div className="h-32 md:h-48 bg-gray-700 overflow-hidden">
            <img
              src={creator.bannerImage}
              alt="Channel banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
            <img
              src={creator.profileImage}
              alt={creator.displayName}
              className="w-24 h-24 rounded-full object-cover bg-gray-700 border-4 border-gray-800 -mt-16 md:-mt-20"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{creator.displayName}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${platformColors[platform]} text-white flex items-center gap-1`}>
                  {Icon && <Icon className="w-4 h-4" />}
                  {platform}
                </span>
                {creator.country && (
                  <span className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
                    {creator.country}
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-3">@{creator.username}</p>
              <a
                href={platformUrls[platform]?.(creator.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on {platform}
              </a>
            </div>
          </div>

          {/* Description */}
          {creator.description && (
            <p className="text-gray-400 text-sm mb-8 line-clamp-3">
              {creator.description}
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label={platform === 'twitch' ? 'Followers' : 'Subscribers'}
              value={formatNumber(creator.subscribers || creator.followers)}
              sublabel={creator.hiddenSubscribers ? '(hidden)' : creator.broadcasterType ? `(${creator.broadcasterType})` : null}
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={formatNumber(creator.totalViews)}
            />
            {platform !== 'twitch' && (
              <StatCard
                icon={Video}
                label="Videos"
                value={formatNumber(creator.totalPosts)}
              />
            )}
            {platform === 'twitch' && creator.category && (
              <StatCard
                icon={Video}
                label="Category"
                value={creator.category}
              />
            )}
            {platform !== 'twitch' && (
              <StatCard
                icon={TrendingUp}
                label="Avg Views/Video"
                value={creator.totalPosts > 0 ? formatNumber(Math.round(creator.totalViews / creator.totalPosts)) : '-'}
              />
            )}
          </div>

          {/* Stats Summary Cards */}
          {creator.subscribers || creator.followers ? (
            <div className="border-t border-gray-700 pt-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <SummaryCard
                  label={platform === 'twitch' ? 'Followers' : 'Subscribers'}
                  sublabel="For the last 30 days"
                  value={metrics ? formatNumber(metrics.last30Days.subs) : '--'}
                  change={metrics?.last30Days.subs}
                />
                <SummaryCard
                  label="Views"
                  sublabel="For the last 30 days"
                  value={metrics ? formatNumber(metrics.last30Days.views) : '--'}
                  change={metrics?.last30Days.views}
                />
                {platform !== 'twitch' && (
                  <>
                    <SummaryCard
                      label="Monthly Est. Earnings"
                      sublabel="Based on avg CPM"
                      value={metrics ? formatEarnings(metrics.last30Days.views / 1000 * 2, metrics.last30Days.views / 1000 * 7) : '--'}
                    />
                    <SummaryCard
                      label="Yearly Est. Earnings"
                      sublabel="Based on avg CPM"
                      value={metrics ? formatEarnings(metrics.last30Days.views / 1000 * 2 * 12, metrics.last30Days.views / 1000 * 7 * 12) : '--'}
                    />
                  </>
                )}
              </div>

              {metrics ? (
                <>
                  <h3 className="text-lg font-semibold mb-4">Daily Channel Metrics</h3>
                  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-left text-gray-400">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">{platform === 'twitch' ? 'Followers' : 'Subscribers'}</th>
                      <th className="px-4 py-3 text-right">Views</th>
                      {platform !== 'twitch' && <th className="px-4 py-3 text-right">Videos</th>}
                      {platform !== 'twitch' && <th className="px-4 py-3 text-right">Est. Earnings</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.dailyStats.map((stat) => (
                      <tr key={stat.recorded_at} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          {new Date(stat.recorded_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-gray-300">{formatNumber(stat.subscribers || stat.followers)}</span>
                            {stat.subsChange !== 0 && (
                              <span className={`text-xs ${stat.subsChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stat.subsChange > 0 ? '+' : ''}{formatNumber(stat.subsChange)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-gray-300">{formatNumber(stat.total_views)}</span>
                            {stat.viewsChange !== 0 && (
                              <span className={`text-xs ${stat.viewsChange > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                {stat.viewsChange > 0 ? '+' : ''}{formatNumber(stat.viewsChange)}
                              </span>
                            )}
                          </div>
                        </td>
                        {platform !== 'twitch' && (
                          <>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-gray-300">{formatNumber(stat.total_posts || 0)}</span>
                                {stat.videosChange !== 0 && (
                                  <span className="text-xs text-green-400">
                                    +{stat.videosChange}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-300">
                              {stat.viewsChange > 0 ? formatEarnings(stat.viewsChange / 1000 * 2, stat.viewsChange / 1000 * 7) : '$0'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}

                    {/* Summary Rows */}
                    <tr className="border-t-2 border-gray-600 bg-gray-700/30 font-semibold">
                      <td className="px-4 py-3">Daily Average</td>
                      <td className="px-4 py-3 text-right">
                        <span className={metrics.dailyAverage.subs >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {metrics.dailyAverage.subs >= 0 ? '+' : ''}{formatNumber(metrics.dailyAverage.subs)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        +{formatNumber(metrics.dailyAverage.views)}
                      </td>
                      {platform !== 'twitch' && (
                        <>
                          <td className="px-4 py-3 text-right"></td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {formatEarnings(metrics.dailyAverage.views / 1000 * 2, metrics.dailyAverage.views / 1000 * 7)}
                          </td>
                        </>
                      )}
                    </tr>

                    <tr className="bg-gray-700/30 font-semibold">
                      <td className="px-4 py-3">Weekly Average</td>
                      <td className="px-4 py-3 text-right">
                        <span className={metrics.weeklyAverage.subs >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {metrics.weeklyAverage.subs >= 0 ? '+' : ''}{formatNumber(metrics.weeklyAverage.subs)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        +{formatNumber(metrics.weeklyAverage.views)}
                      </td>
                      {platform !== 'twitch' && (
                        <>
                          <td className="px-4 py-3 text-right"></td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {formatEarnings(metrics.weeklyAverage.views / 1000 * 2, metrics.weeklyAverage.views / 1000 * 7)}
                          </td>
                        </>
                      )}
                    </tr>

                    <tr className="bg-gray-700/30 font-semibold">
                      <td className="px-4 py-3">Last 30 Days</td>
                      <td className="px-4 py-3 text-right">
                        <span className={metrics.last30Days.subs >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {metrics.last30Days.subs >= 0 ? '+' : ''}{formatNumber(metrics.last30Days.subs)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        +{formatNumber(metrics.last30Days.views)}
                      </td>
                      {platform !== 'twitch' && (
                        <>
                          <td className="px-4 py-3 text-right text-green-400">
                            +{metrics.last30Days.videos}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {formatEarnings(metrics.last30Days.views / 1000 * 2, metrics.last30Days.views / 1000 * 7)}
                          </td>
                        </>
                      )}
                    </tr>

                    <tr className="bg-gray-700/30 font-semibold">
                      <td className="px-4 py-3">Last 14 Days</td>
                      <td className="px-4 py-3 text-right">
                        <span className={metrics.last14Days.subs >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {metrics.last14Days.subs >= 0 ? '+' : ''}{formatNumber(metrics.last14Days.subs)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        +{formatNumber(metrics.last14Days.views)}
                      </td>
                      {platform !== 'twitch' && (
                        <>
                          <td className="px-4 py-3 text-right"></td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {formatEarnings(metrics.last14Days.views / 1000 * 2, metrics.last14Days.views / 1000 * 7)}
                          </td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
                </>
              ) : (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Collecting Historical Data</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    We're tracking this creator's stats. Check back tomorrow to see daily growth metrics!
                  </p>
                  <p className="text-xs text-gray-500">
                    {statsHistory.length} data point(s) collected so far
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Channel Creation Date */}
          {creator.createdAt && (
            <div className="border-t border-gray-700 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Channel created: {new Date(creator.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sublabel, change }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeColor = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <p className="text-sm text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
      {change !== undefined && change !== null && (
        <div className={`flex items-center gap-1 mt-1 text-sm ${changeColor}`}>
          <ChangeIcon className="w-4 h-4" />
          <span>{isPositive ? '+' : ''}{formatNumber(change)}</span>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, sublabel, value, change }) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const changeColor = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
      <p className="text-2xl md:text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-300">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
      {change !== undefined && change !== null && (
        <p className={`text-xs mt-1 ${changeColor}`}>
          {isPositive ? '+' : ''}{formatNumber(change)}
        </p>
      )}
    </div>
  );
}

function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatEarnings(low, high) {
  if (!low || !high) return '$0';
  const formatCurrency = (num) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${Math.round(num)}`;
  };
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}
