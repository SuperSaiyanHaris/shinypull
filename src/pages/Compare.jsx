import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Plus, Youtube, Twitch, Users, Eye, Video, TrendingUp, ArrowRight, Scale, Loader2, DollarSign, TrendingDown, Minus, Info } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import { CompareCardSkeleton } from '../components/Skeleton';
import { searchChannels as searchYouTube, getChannelByUsername as getYouTubeChannel } from '../services/youtubeService';
import { searchChannels as searchTwitch, getChannelByUsername as getTwitchChannel } from '../services/twitchService';
import { searchChannels as searchKick, getChannelByUsername as getKickChannel } from '../services/kickService';
import { searchCreators, getCreatorByUsername, getCreatorStats } from '../services/creatorService';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { analytics } from '../lib/analytics';
import { formatNumber } from '../lib/utils';
import logger from '../lib/logger';

const platformConfig = {
  youtube: { icon: Youtube, color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-800' },
  tiktok: { icon: TikTokIcon, color: 'text-pink-400', bg: 'bg-pink-950/30', border: 'border-pink-800' },
  twitch: { icon: Twitch, color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-800' },
  kick: { icon: KickIcon, color: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-800' },
};

export default function Compare() {
  const [creators, setCreators] = useState([null, null]);
  const [loadingFromUrl, setLoadingFromUrl] = useState(false);
  const [growthData, setGrowthData] = useState({});
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const skipNextUrlLoad = useRef(false);

  const updateUrl = (newCreators) => {
    skipNextUrlLoad.current = true;
    const filled = newCreators.filter(Boolean);
    if (filled.length === 0) {
      navigate('/compare', { replace: true });
    } else {
      const param = filled.map(c => `${c.platform}:${c.username}`).join(',');
      navigate(`/compare?creators=${param}`, { replace: true });
    }
  };

  // Parse ?creators=platform:username,platform:username from URL
  useEffect(() => {
    // Skip if we just set the URL ourselves (no need to re-fetch)
    if (skipNextUrlLoad.current) {
      skipNextUrlLoad.current = false;
      return;
    }

    const params = new URLSearchParams(location.search);
    const creatorsParam = params.get('creators');

    if (!creatorsParam) return;

    const creatorList = creatorsParam.split(',').filter(Boolean);
    if (creatorList.length === 0) return;

    setLoadingFromUrl(true);

    const loadCreators = async () => {
      const loadedCreators = await Promise.all(
        creatorList.slice(0, 3).map(async (entry) => {
          const [platform, username] = entry.split(':');
          if (!platform || !username) return null;

          try {
            if (platform === 'youtube') {
              return await getYouTubeChannel(username);
            } else if (platform === 'tiktok') {
              const result = await getCreatorByUsername('tiktok', username);
              if (!result) return null;
              const { data: stats } = await supabase
                .from('creator_stats')
                .select('followers, total_views, total_posts')
                .eq('creator_id', result.id)
                .order('recorded_at', { ascending: false })
                .limit(1)
                .single();
              return {
                platform: 'tiktok',
                platformId: result.platform_id,
                username: result.username,
                displayName: result.display_name || result.username,
                profileImage: result.profile_image,
                description: result.description,
                subscribers: stats?.followers || 0,
                totalViews: stats?.total_views || 0,
                totalPosts: stats?.total_posts || 0,
              };
            } else if (platform === 'twitch') {
              return await getTwitchChannel(username);
            } else if (platform === 'kick') {
              return await getKickChannel(username);
            }
          } catch (err) {
            // Skip creators that fail to load
            return null;
          }
          return null;
        })
      );

      const validCreators = loadedCreators.filter(Boolean);

      // Ensure we always have at least 2 slots
      while (validCreators.length < 2) {
        validCreators.push(null);
      }

      setCreators(validCreators);
      setLoadingFromUrl(false);

      // Track comparison if we have multiple creators
      if (validCreators.filter(Boolean).length >= 2) {
        const first = validCreators[0];
        const second = validCreators[1];
        if (first && second) {
          analytics.compare(first.platform, first.username, second.platform, second.username);
        }
      }
    };

    loadCreators();
  }, [location.search]);

  const selectCreator = (index, creator) => {
    const newCreators = [...creators];
    newCreators[index] = creator;
    setCreators(newCreators);
    updateUrl(newCreators);

    // Track comparison when both slots are filled
    if (newCreators[0] && newCreators[1]) {
      analytics.compare(
        newCreators[0].platform,
        newCreators[0].username,
        newCreators[1].platform,
        newCreators[1].username
      );
    }
  };

  const removeCreator = (index) => {
    const newCreators = [...creators];
    newCreators[index] = null;
    setCreators(newCreators);
    updateUrl(newCreators);
  };

  const addSlot = () => {
    if (creators.length < 3) {
      setCreators([...creators, null]);
    }
  };

  const removeSlot = (index) => {
    if (creators.length > 2) {
      const newCreators = [...creators];
      newCreators.splice(index, 1);
      setCreators(newCreators);
      updateUrl(newCreators);
    }
  };

  // Fetch growth data for creators
  useEffect(() => {
    const fetchGrowthData = async () => {
      const filled = creators.filter(Boolean);
      if (filled.length === 0) return;

      setLoadingGrowth(true);
      const growth = {};

      for (const creator of filled) {
        try {
          // Get creator from database to get UUID
          const dbCreator = await getCreatorByUsername(creator.platform, creator.username);
          if (!dbCreator) continue;

          // Fetch last 30 days of stats
          const stats = await getCreatorStats(dbCreator.id, 30);
          if (!stats || stats.length < 2) continue;

          // getCreatorStats returns ascending order (oldest first), so:
          // stats[0] = oldest (~30 days ago), stats[last] = newest (today)
          const latest = stats[stats.length - 1];
          const sevenDaysBack = stats[Math.max(0, stats.length - 1 - 7)];
          const thirtyDaysBack = stats[0];

          // Calculate growth percentages
          const calc7Day = sevenDaysBack?.subscribers
            ? ((latest.subscribers - sevenDaysBack.subscribers) / sevenDaysBack.subscribers * 100) : 0;
          const calc30Day = thirtyDaysBack?.subscribers
            ? ((latest.subscribers - thirtyDaysBack.subscribers) / thirtyDaysBack.subscribers * 100) : 0;

          // Calculate actual 30-day view growth for YouTube earnings estimate
          let monthlyViews = 0;
          if (creator.platform === 'youtube') {
            if (latest?.total_views != null && thirtyDaysBack?.total_views != null) {
              monthlyViews = Math.max(0, latest.total_views - thirtyDaysBack.total_views);
            }
          }

          growth[creator.platformId] = {
            growth7Day: calc7Day,
            growth30Day: calc30Day,
            diff7Day: sevenDaysBack?.subscribers != null ? latest.subscribers - sevenDaysBack.subscribers : 0,
            diff30Day: thirtyDaysBack?.subscribers != null ? latest.subscribers - thirtyDaysBack.subscribers : 0,
            monthlyViews: monthlyViews,
          };
        } catch (err) {
          logger.warn(`Failed to fetch growth data for ${creator.username}:`, err);
        }
      }

      setGrowthData(growth);
      setLoadingGrowth(false);
    };

    fetchGrowthData();
  }, [creators]);

  const filledCreators = creators.filter(Boolean);

  // Helper: Format growth percentage
  const formatGrowth = (percentage) => {
    if (!percentage || isNaN(percentage)) return '—';
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  // Helper: Get growth icon
  const getGrowthIcon = (percentage) => {
    if (!percentage || isNaN(percentage)) return Minus;
    return percentage > 0 ? TrendingUp : TrendingDown;
  };

  // Helper: Get growth color
  const getGrowthColor = (percentage) => {
    if (!percentage || isNaN(percentage)) return 'text-gray-300';
    return percentage > 0 ? 'text-emerald-400' : 'text-red-500';
  };

  // Helper: Format earnings estimate (YouTube only, based on actual 30-day views)
  const formatEarnings = (monthlyViews) => {
    if (!monthlyViews || monthlyViews === 0) return '—';
    const monthlyLow = (monthlyViews / 1000) * 2;
    const monthlyHigh = (monthlyViews / 1000) * 7;

    const formatCurrency = (amount) => {
      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
      return `$${amount.toFixed(0)}`;
    };

    return `${formatCurrency(monthlyLow)} - ${formatCurrency(monthlyHigh)}`;
  };

  return (
    <>
      <SEO
        title="Compare Creators"
        description="Compare social media creators side-by-side. See subscriber counts, follower counts, views, and growth metrics."
      />

      <div className="min-h-screen bg-gray-800/50">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-100">Compare Creators</h1>
              </div>
              <p className="text-base sm:text-lg text-gray-300">
                Side-by-side comparison across all platforms
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Loading State */}
          {loadingFromUrl && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <CompareCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Clear All */}
          {!loadingFromUrl && filledCreators.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => {
                  setCreators([null, null]);
                  navigate('/compare', { replace: true });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          )}

          {/* Hint - shown above slots when comparison not yet active */}
          {!loadingFromUrl && filledCreators.length < 2 && (
            <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl">
              <Users className="w-5 h-5 text-indigo-500 shrink-0" />
              <p className="text-sm text-gray-300">Search for at least 2 creators below to start comparing.</p>
            </div>
          )}

          {/* Creator Slots */}
          {!loadingFromUrl && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {creators.map((creator, index) => (
              <div key={index}>
                {creator ? (
                  <CreatorCard
                    creator={creator}
                    onRemove={() => removeCreator(index)}
                  />
                ) : (
                  <SearchableSlot
                    onSelect={(creator) => selectCreator(index, creator)}
                    onRemove={creators.length > 2 ? () => removeSlot(index) : null}
                  />
                )}
              </div>
            ))}
            {creators.length < 3 && (
              <button
                onClick={addSlot}
                className="min-h-[280px] border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center text-gray-300 hover:text-gray-300 hover:border-gray-600 transition-colors"
              >
                <Plus className="w-8 h-8" />
              </button>
            )}
          </div>
          )}

          {/* Comparison Section */}
          {!loadingFromUrl && filledCreators.length >= 2 && (
            <>
              {/* Radar Chart */}
              <div className="mb-6">
                <ComparisonRadarChart creators={filledCreators} growthData={growthData} />
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-100">Comparison</h3>
                  <InfoTooltip text="Some fields show dashes for newer creators. Growth and earnings need a few days of tracked data before they populate." />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-800/50">
                        <th className="px-6 py-4 text-left font-semibold text-gray-300">Metric</th>
                        {filledCreators.map((creator) => (
                          <th key={creator.platformId} className="px-6 py-4 text-center font-semibold text-gray-100">
                            <div className="flex items-center justify-center gap-2">
                              <img src={creator.profileImage} alt="" loading="lazy" className="w-6 h-6 rounded-lg" />
                              <span className="truncate max-w-[120px]">{creator.displayName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <ComparisonRow
                        label="Platform"
                        values={filledCreators.map(c => (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${platformConfig[c.platform]?.bg} ${platformConfig[c.platform]?.color}`}>
                            {c.platform === 'youtube' ? <Youtube className="w-4 h-4" /> : <Twitch className="w-4 h-4" />}
                            {c.platform}
                          </span>
                        ))}
                      />
                      <ComparisonRow
                        label="Subscribers / Followers"
                        icon={Users}
                        tooltip="YouTube = subscribers, Twitch and TikTok = followers. Kick shows paid subscribers only, not total followers."
                        values={filledCreators.map(c => formatNumber(c.subscribers || c.followers))}
                        highlight={getWinner(filledCreators.map(c => c.subscribers || c.followers))}
                      />
                      <ComparisonRow
                        label="Total Views"
                        icon={Eye}
                        tooltip="For TikTok, this shows total likes. TikTok doesn't make per-profile view counts public."
                        values={filledCreators.map(c => formatNumber(c.totalViews))}
                        highlight={getWinner(filledCreators.map(c => c.totalViews))}
                      />
                      <ComparisonRow
                        label="Videos / Content"
                        icon={Video}
                        tooltip="For Twitch, this shows the current stream category. Twitch doesn't make video counts public."
                        values={filledCreators.map(c => c.platform === 'twitch' ? (c.category || '-') : formatNumber(c.totalPosts))}
                        highlight={filledCreators.every(c => c.platform !== 'twitch') ? getWinner(filledCreators.map(c => c.totalPosts)) : null}
                      />
                      <ComparisonRow
                        label="Avg Views per Video"
                        icon={TrendingUp}
                        tooltip="Not available for Twitch. For TikTok, calculated as total likes ÷ videos."
                        values={filledCreators.map(c =>
                          c.platform === 'twitch' ? '-' :
                          c.totalPosts > 0 ? formatNumber(Math.round(c.totalViews / c.totalPosts)) : '-'
                        )}
                        highlight={filledCreators.every(c => c.platform !== 'twitch') ?
                          getWinner(filledCreators.map(c => c.totalPosts > 0 ? c.totalViews / c.totalPosts : 0)) : null}
                      />
                      {/* Growth Rates */}
                      <ComparisonRow
                        label="7-Day Growth"
                        tooltip="YouTube and Kick track subscribers. Twitch and TikTok track followers."
                        values={filledCreators.map(c => {
                          const data = growthData[c.platformId];
                          const percentage = data?.growth7Day || 0;
                          const diff = data?.diff7Day || 0;
                          const GrowthIcon = getGrowthIcon(percentage);
                          return (
                            <span className={`inline-flex flex-col items-center gap-0.5 ${getGrowthColor(percentage)}`}>
                              <span className="inline-flex items-center gap-1">
                                <GrowthIcon className="w-3.5 h-3.5" />
                                {diff !== 0 ? `${diff > 0 ? '+' : ''}${formatNumber(Math.abs(diff))}` : formatGrowth(percentage)}
                              </span>
                              {diff !== 0 && <span className="text-xs opacity-60">{formatGrowth(percentage)}</span>}
                            </span>
                          );
                        })}
                        highlight={getWinner(filledCreators.map(c => growthData[c.platformId]?.growth7Day || 0))}
                      />
                      <ComparisonRow
                        label="30-Day Growth"
                        tooltip="YouTube and Kick track subscribers. Twitch and TikTok track followers."
                        values={filledCreators.map(c => {
                          const data = growthData[c.platformId];
                          const percentage = data?.growth30Day || 0;
                          const diff = data?.diff30Day || 0;
                          const GrowthIcon = getGrowthIcon(percentage);
                          return (
                            <span className={`inline-flex flex-col items-center gap-0.5 ${getGrowthColor(percentage)}`}>
                              <span className="inline-flex items-center gap-1">
                                <GrowthIcon className="w-3.5 h-3.5" />
                                {diff !== 0 ? `${diff > 0 ? '+' : ''}${formatNumber(Math.abs(diff))}` : formatGrowth(percentage)}
                              </span>
                              {diff !== 0 && <span className="text-xs opacity-60">{formatGrowth(percentage)}</span>}
                            </span>
                          );
                        })}
                        highlight={getWinner(filledCreators.map(c => growthData[c.platformId]?.growth30Day || 0))}
                      />
                      {/* Earnings Estimate (YouTube only) */}
                      {filledCreators.some(c => c.platform === 'youtube') && (
                        <ComparisonRow
                          label="Est. Monthly Earnings"
                          icon={DollarSign}
                          tooltip="YouTube only. Estimated from 30-day view growth at $2-$7 CPM. Actual earnings vary."
                          values={filledCreators.map(c => {
                            if (c.platform !== 'youtube') return '—';
                            const data = growthData[c.platformId];
                            return formatEarnings(data?.monthlyViews || 0);
                          })}
                        />
                      )}
                    </tbody>
                  </table>
                </div>

                {/* View Full Profiles - Desktop */}
                <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/50">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {filledCreators.map((creator) => (
                      <Link
                        key={creator.platformId}
                        to={`/${creator.platform}/${creator.username}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 hover:text-indigo-400 hover:border-indigo-700 transition-colors"
                      >
                        View {creator.displayName}'s profile
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Compact Table View */}
              <div className="md:hidden space-y-4">
                <MobileComparisonTable
                  creators={filledCreators}
                  growthData={growthData}
                  getGrowthColor={getGrowthColor}
                  formatEarnings={formatEarnings}
                />

                {/* View Full Profiles - Mobile */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-4">
                  <p className="text-sm font-medium text-gray-300 mb-3">View Profiles</p>
                  <div className="space-y-2">
                    {filledCreators.map((creator) => (
                      <Link
                        key={creator.platformId}
                        to={`/${creator.platform}/${creator.username}`}
                        className="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        <img src={creator.profileImage} alt="" loading="lazy" className="w-8 h-8 rounded-lg" />
                        <span className="flex-1 font-medium text-gray-100 truncate">{creator.displayName}</span>
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

function CreatorCard({ creator, onRemove }) {
  const config = platformConfig[creator.platform] || platformConfig.youtube;
  const Icon = config.icon;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-5 relative group">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 p-1.5 bg-gray-800 hover:bg-red-900/30 rounded-lg text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-4 mb-4">
        <img
          src={creator.profileImage}
          alt={creator.displayName}
          className="w-16 h-16 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-100 truncate">{creator.displayName}</p>
          <p className="text-sm text-gray-300 truncate">@{creator.username}</p>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-xs ${config.bg} ${config.color}`}>
            <Icon className="w-3 h-3" />
            {creator.platform}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-xl p-3">
          <p className="text-xs text-gray-300 mb-1">{creator.platform === 'twitch' || creator.platform === 'tiktok' ? 'Followers' : 'Subs'}</p>
          <p className="font-bold text-gray-100">{formatNumber(creator.subscribers || creator.followers)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3">
          <p className="text-xs text-gray-300 mb-1">{creator.platform === 'tiktok' ? 'Likes' : 'Views'}</p>
          <p className="font-bold text-gray-100">{formatNumber(creator.totalViews)}</p>
        </div>
      </div>
    </div>
  );
}

function SearchableSlot({ onSelect, onRemove }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPlatform, setSearchPlatform] = useState('youtube');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      let results = [];
      if (searchPlatform === 'youtube') {
        results = await searchYouTube(searchQuery, 5);
      } else if (searchPlatform === 'tiktok') {
        // Search TikTok from database
        const dbResults = await searchCreators(searchQuery, 'tiktok');
        const withStats = await Promise.all(
          dbResults.map(async (creator) => {
            const { data: stats } = await supabase
              .from('creator_stats')
              .select('followers, total_views, total_posts')
              .eq('creator_id', creator.id)
              .order('recorded_at', { ascending: false })
              .limit(1)
              .single();
            return {
              platform: 'tiktok',
              platformId: creator.platform_id,
              username: creator.username,
              displayName: creator.display_name || creator.username,
              profileImage: creator.profile_image,
              description: creator.description,
              subscribers: stats?.followers || 0,
              totalViews: stats?.total_views || 0,
              totalPosts: stats?.total_posts || 0,
            };
          })
        );
        results = withStats.slice(0, 5);
      } else if (searchPlatform === 'twitch') {
        results = await searchTwitch(searchQuery, 5);
      } else if (searchPlatform === 'kick') {
        results = await searchKick(searchQuery, 5);
      }
      setSearchResults(results);
    } catch (err) {
      logger.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (creator) => {
    onSelect(creator);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-sm p-4 min-h-[280px] flex flex-col relative">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-red-900/30 rounded-lg text-gray-300 hover:text-red-500 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <select
            value={searchPlatform}
            onChange={(e) => setSearchPlatform(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-[16px] sm:text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="twitch">Twitch</option>
            <option value="kick">Kick</option>
          </select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creator..."
              className="w-full pl-9 pr-9 py-2 bg-gray-900 border border-gray-700 rounded-lg text-[16px] sm:text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
      </form>

      <div className="flex-1 mt-3 overflow-y-auto">
        {searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((result) => (
              <button
                key={result.platformId}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left"
              >
                <img
                  src={result.profileImage}
                  alt={result.displayName}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-100 truncate">{result.displayName}</p>
                  <p className="text-xs text-gray-300 truncate">
                    {formatNumber(result.subscribers || result.followers)} {result.platform === 'twitch' ? 'followers' : 'subs'}
                  </p>
                </div>
                <div className={`p-1 rounded ${platformConfig[result.platform]?.bg}`}>
                  {(() => {
                    const PlatformIcon = platformConfig[result.platform]?.icon;
                    return PlatformIcon ? <PlatformIcon className={`w-4 h-4 ${platformConfig[result.platform]?.color}`} /> : null;
                  })()}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <Search className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Search for a creator</span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const btnRef = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tipWidth = 224; // 14rem
      const rawLeft = rect.left + window.scrollX;
      const left = (rect.left + tipWidth > window.innerWidth - 8)
        ? Math.max(8, window.innerWidth - tipWidth - 8)
        : rawLeft;
      setStyle({ top: rect.bottom + window.scrollY + 6, left });
    }
    setOpen(o => !o);
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />}
      <button
        ref={btnRef}
        type="button"
        className="focus:outline-none -m-1 p-1 flex-shrink-0"
        onClick={handleToggle}
      >
        <Info className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 transition-colors" />
      </button>
      {open && createPortal(
        <div
          className="fixed w-56 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 z-[999] whitespace-normal shadow-xl"
          style={style}
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
}

function ComparisonRow({ label, icon: Icon, values, highlight, tooltip }) {
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-4 text-gray-300 font-medium">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-300" />}
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
      </td>
      {values.map((value, index) => (
        <td
          key={index}
          className={`px-6 py-4 text-center font-semibold ${
            highlight === index ? 'text-emerald-400 bg-emerald-950/30' : 'text-gray-100'
          }`}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

function MobileComparisonTable({ creators, growthData, getGrowthColor, formatEarnings }) {
  const gridStyle = { gridTemplateColumns: `minmax(68px, 0.85fr) repeat(${creators.length}, 1fr)` };

  const winnerOf = (nums) => {
    const valid = nums.filter(n => n != null && !isNaN(n) && n > 0);
    if (valid.length < 2) return null;
    const max = Math.max(...valid);
    const idx = nums.findIndex(n => n === max);
    return nums.filter(n => n === max).length === 1 ? idx : null;
  };

  const rows = [
    {
      label: 'Followers',
      tooltip: 'YouTube = subscribers, Twitch and TikTok = followers. Kick shows paid subscribers only.',
      nums: creators.map(c => c.subscribers || c.followers || 0),
      display: creators.map(c => [formatNumber(c.subscribers || c.followers || 0), null]),
    },
    {
      label: 'Views',
      tooltip: 'For TikTok, this shows total likes. TikTok does not make per-profile view counts public.',
      nums: creators.map(c => c.totalViews || 0),
      display: creators.map(c => [formatNumber(c.totalViews || 0), null]),
    },
    {
      label: 'Videos',
      tooltip: 'For Twitch, this shows the current stream category. Video counts are not public on Twitch.',
      nums: creators.map(c => c.platform !== 'twitch' ? (c.totalPosts || 0) : null),
      display: creators.map(c => [c.platform !== 'twitch' ? formatNumber(c.totalPosts || 0) : '—', null]),
    },
    {
      label: 'Avg/Video',
      tooltip: 'Not available for Twitch. For TikTok, calculated as total likes divided by videos.',
      nums: creators.map(c => (c.platform !== 'twitch' && c.totalPosts > 0) ? Math.round(c.totalViews / c.totalPosts) : null),
      display: creators.map(c => [(c.platform !== 'twitch' && c.totalPosts > 0) ? formatNumber(Math.round(c.totalViews / c.totalPosts)) : '—', null]),
    },
    {
      label: '7-Day',
      tooltip: 'YouTube and Kick track subscribers. Twitch and TikTok track followers.',
      isGrowth: true,
      nums: creators.map(c => growthData[c.platformId]?.growth7Day || 0),
      display: creators.map(c => {
        const data = growthData[c.platformId];
        const pct = data?.growth7Day;
        const diff = data?.diff7Day;
        if (!pct || isNaN(pct)) return ['—', null];
        const pctStr = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
        if (diff && diff !== 0) {
          return [`${diff > 0 ? '+' : ''}${formatNumber(Math.abs(diff))}`, pctStr];
        }
        return [pctStr, null];
      }),
      colors: creators.map(c => getGrowthColor(growthData[c.platformId]?.growth7Day)),
    },
    {
      label: '30-Day',
      tooltip: 'YouTube and Kick track subscribers. Twitch and TikTok track followers.',
      isGrowth: true,
      nums: creators.map(c => growthData[c.platformId]?.growth30Day || 0),
      display: creators.map(c => {
        const data = growthData[c.platformId];
        const pct = data?.growth30Day;
        const diff = data?.diff30Day;
        if (!pct || isNaN(pct)) return ['—', null];
        const pctStr = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
        if (diff && diff !== 0) {
          return [`${diff > 0 ? '+' : ''}${formatNumber(Math.abs(diff))}`, pctStr];
        }
        return [pctStr, null];
      }),
      colors: creators.map(c => getGrowthColor(growthData[c.platformId]?.growth30Day)),
    },
  ];

  if (creators.some(c => c.platform === 'youtube')) {
    rows.push({
      label: 'Mo. Est.',
      tooltip: 'YouTube only. Estimated from 30-day view growth at $2-$7 CPM. Actual earnings vary.',
      isEarnings: true,
      nums: creators.map(c => growthData[c.platformId]?.monthlyViews || 0),
      display: creators.map(c => [c.platform === 'youtube' ? formatEarnings(growthData[c.platformId]?.monthlyViews || 0) : '—', null]),
      colors: creators.map(() => 'text-gray-100'),
    });
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Creator header row */}
      <div className="grid bg-gray-800/50 border-b border-gray-800" style={gridStyle}>
        <div className="px-3 py-2 text-xs text-gray-300 flex items-end pb-3">Metric</div>
        {creators.map(c => {
          const config = platformConfig[c.platform] || platformConfig.youtube;
          const PlatformIcon = config.icon;
          return (
            <div key={c.platformId} className="px-2 py-2 flex flex-col items-center gap-1.5 border-l border-gray-800">
              <img src={c.profileImage} alt="" loading="lazy" className="w-10 h-10 rounded-xl object-cover" />
              <p className="text-[11px] font-semibold text-gray-100 text-center leading-tight truncate w-full px-1">{c.displayName}</p>
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${config.bg} ${config.color}`}>
                <PlatformIcon className="w-2.5 h-2.5" />
                {c.platform}
              </span>
            </div>
          );
        })}
      </div>

      {/* Metric rows */}
      {rows.map((row, i) => {
        const winnerIdx = !row.isGrowth && !row.isEarnings ? winnerOf(row.nums.map(n => n ?? 0)) : null;
        return (
          <div
            key={row.label}
            className={`grid border-b border-gray-800 last:border-0 ${i % 2 !== 0 ? 'bg-gray-800/20' : ''}`}
            style={gridStyle}
          >
            <div className="px-3 py-3 text-xs font-medium text-gray-300 flex items-center gap-1">
              <span>{row.label}</span>
              {row.tooltip && <InfoTooltip text={row.tooltip} />}
            </div>
            {creators.map((c, idx) => {
              const isWinner = winnerIdx === idx;
              const [primary, secondary] = row.display[idx];
              const color = (row.isGrowth || row.isEarnings) ? row.colors[idx] : (isWinner ? 'text-emerald-400' : 'text-gray-100');
              return (
                <div
                  key={c.platformId}
                  className={`px-2 py-3 flex flex-col items-center justify-center border-l border-gray-800 ${isWinner ? 'bg-emerald-950/30' : ''}`}
                >
                  <span className={`text-xs font-bold text-center leading-tight ${color}`}>{primary}</span>
                  {secondary && (
                    <span className={`text-[10px] text-center leading-tight mt-0.5 opacity-70 ${color}`}>{secondary}</span>
                  )}
                  {isWinner && <span className="text-[10px] text-emerald-400 mt-0.5">✓</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ComparisonRadarChart({ creators, growthData }) {
  const CREATOR_COLORS = ['#818cf8', '#34d399', '#f59e0b'];

  const metrics = [
    { label: 'Followers',    getValue: (c) => c.subscribers || c.followers || 0 },
    { label: 'Views',        getValue: (c) => c.totalViews || 0 },
    { label: 'Avg/Video',    getValue: (c) => (c.platform !== 'twitch' && c.totalPosts > 0) ? c.totalViews / c.totalPosts : 0 },
    { label: '7-Day Growth', getValue: (c) => Math.max(0, growthData[c.platformId]?.growth7Day || 0) },
    { label: '30-Day Growth',getValue: (c) => Math.max(0, growthData[c.platformId]?.growth30Day || 0) },
  ];

  const radarData = metrics.map(({ label, getValue }) => {
    const values = creators.map(getValue);
    const max = Math.max(...values, 0.001);
    const entry = { metric: label };
    creators.forEach((c, i) => {
      entry[c.displayName] = Math.round((values[i] / max) * 100);
    });
    return entry;
  });

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-100">Performance Overview</h3>
        <span className="text-xs text-gray-300">100 = top among compared</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {creators.map((c, i) => (
            <Radar
              key={c.platformId}
              name={c.displayName}
              dataKey={c.displayName}
              stroke={CREATOR_COLORS[i % CREATOR_COLORS.length]}
              fill={CREATOR_COLORS[i % CREATOR_COLORS.length]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend
            formatter={(value) => <span style={{ color: '#d1d5db', fontSize: '12px' }}>{value}</span>}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '8px 12px' }}
            formatter={(value, name) => [`${value}/100`, name]}
            labelStyle={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}
            itemStyle={{ color: '#d1d5db', fontSize: '12px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function getWinner(values) {
  const max = Math.max(...values.filter(v => v != null && !isNaN(v)));
  const winnerIndex = values.findIndex(v => v === max);
  // Only highlight if there's a clear winner (not a tie)
  const winners = values.filter(v => v === max);
  return winners.length === 1 ? winnerIndex : null;
}

