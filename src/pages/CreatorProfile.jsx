import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Youtube, Twitch, Users, Eye, Video, TrendingUp, ExternalLink, AlertCircle, Calendar, Target, Clock, Radio, Star, Play, ThumbsUp, MessageCircle } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import FunErrorState from '../components/FunErrorState';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getChannelByUsername as getYouTubeChannel, getChannelById as getYouTubeChannelById, getLatestVideo as getYouTubeLatestVideo } from '../services/youtubeService';
import { getChannelByUsername as getTwitchChannel, getLiveStreams as getTwitchLiveStreams } from '../services/twitchService';
import { getChannelByUsername as getKickChannel, getLiveStreams as getKickLiveStreams } from '../services/kickService';
import { upsertCreator, saveCreatorStats, getCreatorByUsername, getCreatorStats, getHoursWatched } from '../services/creatorService';
import { followCreator, unfollowCreator, isFollowing as checkIsFollowing } from '../services/followService';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import { analytics } from '../lib/analytics';
import { formatNumber } from '../lib/utils';
import { addRecentlyViewed } from '../lib/recentlyViewed';
import logger from '../lib/logger';
import { supabase } from '../lib/supabase';

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
  kick: KickIcon,
  tiktok: TikTokIcon,
};

const platformColors = {
  youtube: { bg: 'bg-red-600', light: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  twitch: { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  kick: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  tiktok: { bg: 'bg-gray-900', light: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' },
};

const platformUrls = {
  youtube: (username) => `https://youtube.com/@${username}`,
  twitch: (username) => `https://twitch.tv/${username}`,
  kick: (username) => `https://kick.com/${username}`,
  tiktok: (username) => `https://tiktok.com/@${username}`,
};

export default function CreatorProfile() {
  const { platform, username } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [creator, setCreator] = useState(null);
  const [statsHistory, setStatsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartRange, setChartRange] = useState(30);
  // Default to views for YouTube (subscriber counts are rounded by YouTube API)
  const [chartMetric, setChartMetric] = useState(platform === 'youtube' ? 'views' : 'subscribers');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [dbCreatorId, setDbCreatorId] = useState(null); // Store database UUID
  const [isLive, setIsLive] = useState(false);
  const [liveStreamInfo, setLiveStreamInfo] = useState(null);
  const [latestVideo, setLatestVideo] = useState(null);

  useEffect(() => {
    loadCreator();
  }, [platform, username]);

  const loadCreator = async () => {
    setLoading(true);
    setError(null);

    try {
      let channelData = null;

      if (platform === 'youtube') {
        // Check database first — the stored platform_id gives an exact lookup
        const knownCreator = await getCreatorByUsername('youtube', username);
        if (knownCreator?.platform_id) {
          channelData = await getYouTubeChannelById(knownCreator.platform_id);
          // Verify the DB record points to the right channel — the stored username
          // must match what was requested (prevents stale/wrong DB mappings)
          if (channelData && channelData.username?.toLowerCase() !== username.toLowerCase()) {
            channelData = null;
          }
        }
        if (!channelData) {
          channelData = await getYouTubeChannel(username);
        }
      } else if (platform === 'twitch') {
        channelData = await getTwitchChannel(username);
      } else if (platform === 'kick') {
        channelData = await getKickChannel(username);
      } else if (platform === 'tiktok') {
        // TikTok: Load from database
        const dbCreator = await getCreatorByUsername('tiktok', username);
        if (dbCreator) {
          const { data: latestStats } = await supabase
            .from('creator_stats')
            .select('*')
            .eq('creator_id', dbCreator.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

          channelData = {
            platform: 'tiktok',
            platformId: dbCreator.platform_id,
            username: dbCreator.username,
            displayName: dbCreator.display_name || dbCreator.username,
            profileImage: dbCreator.profile_image,
            description: dbCreator.description,
            subscribers: latestStats?.followers || 0,
            followers: latestStats?.followers || 0,
            totalViews: latestStats?.total_views || 0,
            totalPosts: latestStats?.total_posts || 0,
            category: dbCreator.category,
          };

          setDbCreatorId(dbCreator.id);
        }
      } else {
        const dbCreator = await getCreatorByUsername(platform, username);
        if (dbCreator) {
          setCreator(dbCreator);
        }
        setLoading(false);
        return;
      }

      if (channelData) {
        // Track profile view
        analytics.viewProfile(platform, username, channelData.displayName);

        try {
          // Skip saving YouTube channels without a public page (e.g., topic channels)
          if (platform === 'youtube' && channelData.hasPublicPage === false) {
            logger.info('Skipping DB save for YouTube channel without public page:', username);
          } else {
            const dbCreator = await upsertCreator(channelData);
            setDbCreatorId(dbCreator.id); // Store the database UUID

            await saveCreatorStats(dbCreator.id, {
              subscribers: channelData.subscribers || channelData.followers,
              totalViews: channelData.totalViews,
              totalPosts: channelData.totalPosts,
            });

            const history = await getCreatorStats(dbCreator.id, 90);
            setStatsHistory(history || []);

            // For Twitch/Kick, fetch hours watched data
            if (platform === 'twitch' || platform === 'kick') {
              const hoursWatchedData = await getHoursWatched(dbCreator.id);
              if (hoursWatchedData) {
                channelData.hoursWatchedDay = hoursWatchedData.hours_watched_day;
                channelData.hoursWatchedWeek = hoursWatchedData.hours_watched_week;
                channelData.hoursWatchedMonth = hoursWatchedData.hours_watched_month;
                channelData.peakViewersDay = hoursWatchedData.peak_viewers_day;
                channelData.avgViewersDay = hoursWatchedData.avg_viewers_day;
              }
            }
          }
        } catch (dbErr) {
          logger.warn('Failed to save to database:', dbErr);
        }

        setCreator(channelData);

        // Track recently viewed
        addRecentlyViewed({
          platform,
          username: channelData.username || username,
          displayName: channelData.displayName,
          profileImage: channelData.profileImage,
          subscribers: channelData.subscribers,
          followers: channelData.followers,
        });

        // Check if streamer is live (Twitch or Kick)
        if (platform === 'twitch' || platform === 'kick') {
          try {
            const liveStreamFn = platform === 'twitch' ? getTwitchLiveStreams : getKickLiveStreams;
            const liveData = await liveStreamFn([channelData.username || username]);
            if (liveData && liveData.length > 0) {
              setIsLive(true);
              setLiveStreamInfo(liveData[0]);
            } else {
              setIsLive(false);
              setLiveStreamInfo(null);
            }
          } catch (liveErr) {
            logger.warn('Failed to check live status:', liveErr);
          }
        }

        // Fetch latest video for YouTube channels (non-blocking)
        if (platform === 'youtube' && channelData.platformId) {
          getYouTubeLatestVideo(channelData.platformId).then(video => {
            if (video) setLatestVideo(video);
          });
        }
      }
    } catch (err) {
      logger.error('Error loading creator:', err);
      setError(err.message || 'Failed to load creator');
    } finally {
      setLoading(false);
    }
  };

  // Check follow status when user and creator are available
  useEffect(() => {
    async function checkFollowStatus() {
      if (isAuthenticated && user && dbCreatorId) {
        const following = await checkIsFollowing(user.id, dbCreatorId);
        setIsFollowing(following);
      }
    }
    checkFollowStatus();
  }, [isAuthenticated, user, dbCreatorId]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      // Trigger auth panel with a helpful message
      window.dispatchEvent(new CustomEvent('openAuthPanel', {
        detail: { message: 'Sign in to follow creators and see their latest stats quicker!' }
      }));
      return;
    }

    if (!dbCreatorId) {
      logger.error('Creator not found in database');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowCreator(user.id, dbCreatorId);
        setIsFollowing(false);
      } else {
        await followCreator(user.id, dbCreatorId);
        setIsFollowing(true);
      }
    } catch (err) {
      logger.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const Icon = platformIcons[platform];
  const colors = platformColors[platform] || platformColors.youtube;

  const calculateGrowthMetrics = () => {
    if (statsHistory.length < 2) return null;

    const sortedStats = [...statsHistory].sort((a, b) =>
      new Date(b.recorded_at) - new Date(a.recorded_at)
    );

    const latest = sortedStats[0];
    const oldest = sortedStats[sortedStats.length - 1];

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

    // Calculate hours watched averages for Twitch
    const hoursWatchedStats = sortedStats.filter(s => s.hours_watched_day != null);
    const avgHoursWatchedDay = hoursWatchedStats.length > 0
      ? Math.round(hoursWatchedStats.reduce((sum, s) => sum + (s.hours_watched_day || 0), 0) / hoursWatchedStats.length)
      : 0;
    const avgHoursWatchedWeek = avgHoursWatchedDay * 7;
    const totalHoursWatched30Days = hoursWatchedStats.slice(0, Math.min(30, hoursWatchedStats.length))
      .reduce((sum, s) => sum + (s.hours_watched_day || 0), 0);

    const last14Days = sortedStats.slice(0, Math.min(14, sortedStats.length));
    const last14First = last14Days[last14Days.length - 1];
    const last14Subs = last14Days.length > 1 ? (latest.subscribers || latest.followers) - (last14First.subscribers || last14First.followers) : 0;
    const last14Views = last14Days.length > 1 ? latest.total_views - last14First.total_views : 0;

    // Calculate 7-day and 30-day growth percentages
    const last7Days = sortedStats.slice(0, Math.min(7, sortedStats.length));
    const last7First = last7Days[last7Days.length - 1];
    const growth7DayPercent = last7Days.length > 1 && last7First.subscribers
      ? ((latest.subscribers || latest.followers) - (last7First.subscribers || last7First.followers)) / (last7First.subscribers || last7First.followers) * 100
      : 0;

    const growth30DayPercent = oldest.subscribers || oldest.followers
      ? subsGrowth / (oldest.subscribers || oldest.followers) * 100
      : 0;

    return {
      dailyStats: dailyStats.slice(0, 14),
      last30Days: { subs: subsGrowth, views: viewsGrowth, videos: videosGrowth, hoursWatched: totalHoursWatched30Days },
      last14Days: { subs: last14Subs, views: last14Views },
      growthRates: { sevenDay: growth7DayPercent, thirtyDay: growth30DayPercent },
      dailyAverage: { subs: dailyAvgSubs, views: dailyAvgViews, hoursWatched: avgHoursWatchedDay },
      weeklyAverage: { subs: weeklyAvgSubs, views: weeklyAvgViews, hoursWatched: avgHoursWatchedWeek },
    };
  };

  const metrics = calculateGrowthMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)] bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading {platform} channel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <FunErrorState
            type={error.includes('fetch') || error.includes('Failed to load') ? 'server' : 'notfound'}
            message={error}
            onRetry={loadCreator}
            retryText="Try Again"
          />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className={`w-24 h-24 ${colors.light} rounded-2xl flex items-center justify-center`}>
                {Icon && <Icon className={`w-12 h-12 ${colors.text}`} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900">@{username}</h1>
                  <a
                    href={platformUrls[platform]?.(username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${colors.bg} text-white hover:opacity-90 transition-opacity`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {platform}
                  </a>
                </div>
                <p className="text-gray-500 mb-4">Creator not found</p>
                <a
                  href={platformUrls[platform]?.(username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Check on {platform}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${creator.displayName} - ${platform} Statistics`}
        description={`View ${creator.displayName}'s ${platform} statistics including subscribers, views, and growth analytics.`}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Banner */}
        {creator.bannerImage && (
          <div className="h-32 md:h-48 bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden">
            <img
              src={creator.bannerImage}
              alt="Channel banner"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        )}

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Profile Header */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-8 mb-6 relative z-10 ${creator.bannerImage ? '-mt-16' : ''}`}>
              {/* Follow Button - Top Right */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base shadow-lg ${
                    isFollowing
                      ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Star className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                  {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6">
                <img
                  src={creator.profileImage}
                  alt={creator.displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl object-cover bg-gray-100 border-4 border-white shadow-lg"
                />
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{creator.displayName}</h1>
                    <a
                      href={platformUrls[platform]?.(creator.username || username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${colors.bg} text-white hover:opacity-90 transition-opacity`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4" />}
                      {platform}
                    </a>
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-red-500 text-white animate-pulse">
                        <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
                        LIVE
                      </span>
                    )}
                    {creator.country && (
                      <span className="px-2 sm:px-2.5 py-1 bg-gray-100 rounded-lg text-xs sm:text-sm text-gray-600 font-medium">
                        {creator.country}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-gray-500 mb-1">@{creator.username}</p>

                  {/* Data Freshness Indicator */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Updated {(() => {
                        if (!creator.updated_at) return 'recently';
                        const updated = new Date(creator.updated_at);
                        const now = new Date();
                        const diffHours = Math.floor((now - updated) / (1000 * 60 * 60));
                        if (diffHours < 1) return 'less than an hour ago';
                        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                        const diffDays = Math.floor(diffHours / 24);
                        if (diffDays === 1) return 'yesterday';
                        return `${diffDays} days ago`;
                      })()}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">Refreshed daily at 6 AM & 6 PM EST</span>
                  </div>

                  {/* Social Links */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <a
                      href={platformUrls[platform]?.(creator.username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 sm:gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-xs sm:text-sm"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">View on {platform}</span>
                      <span className="xs:hidden">View</span>
                    </a>

                    {/* Watch Live Button for Twitch */}
                    {isLive && platform === 'twitch' && (
                      <>
                        <span className="text-gray-300">•</span>
                        <a
                          href={`https://twitch.tv/${creator.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-medium text-xs sm:text-sm rounded-full transition-colors"
                        >
                          <Radio className="w-3 h-3" />
                          Watch Live
                          {liveStreamInfo?.viewer_count && (
                            <span className="ml-1 text-red-200">
                              ({formatNumber(liveStreamInfo.viewer_count)} viewers)
                            </span>
                          )}
                        </a>
                      </>
                    )}

                    {/* Additional social links for YouTube channels */}
                    {platform === 'youtube' && creator.platformId && (
                      <>
                        <span className="text-gray-300">•</span>
                        <a
                          href={`https://www.youtube.com/channel/${creator.platformId}/about`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          About
                        </a>
                        <span className="text-gray-300">•</span>
                        <a
                          href={`https://www.youtube.com/channel/${creator.platformId}/videos`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Videos
                        </a>
                        <span className="text-gray-300">•</span>
                        <a
                          href={`https://www.youtube.com/channel/${creator.platformId}/community`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Community
                        </a>
                      </>
                    )}
                    
                    {/* Twitch-specific links */}
                    {platform === 'twitch' && (
                      <>
                        <span className="text-gray-300">•</span>
                        <a
                          href={`https://twitch.tv/${creator.username}/videos`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Videos
                        </a>
                        <span className="text-gray-300">•</span>
                        <a
                          href={`https://twitch.tv/${creator.username}/schedule`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          Schedule
                        </a>
                        <span className="text-gray-300">•</span>
                        <a
                          href={`https://twitch.tv/${creator.username}/about`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          About
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {creator.description && (
                <p className="text-gray-600 text-sm mt-6 line-clamp-3 leading-relaxed">
                  {creator.description}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className={`grid gap-4 mb-6 ${platform === 'tiktok' ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {/* Subscribers/Followers Card */}
              <StatCard
                icon={Users}
                label={platform === 'tiktok' ? 'Followers' : platform === 'twitch' ? 'Followers' : platform === 'kick' ? 'Paid Subscribers' : 'Subscribers'}
                value={formatNumber(creator.subscribers || creator.followers)}
                sublabel={creator.hiddenSubscribers ? '(hidden)' : platform === 'youtube' ? '(rounded by YouTube)' : creator.broadcasterType ? `(${creator.broadcasterType})` : null}
              />

              {/* TikTok: Show Likes and Videos */}
              {platform === 'tiktok' && (
                <>
                  <StatCard
                    icon={Eye}
                    label="Total Likes"
                    value={formatNumber(creator.totalViews || 0)}
                  />
                  <StatCard
                    icon={Video}
                    label="Videos"
                    value={formatNumber(creator.totalPosts || 0)}
                  />
                </>
              )}

              {/* Followers Card for Kick (not available) */}
              {platform === 'kick' && (
                <StatCard
                  icon={Users}
                  label="Followers"
                  value="—"
                  sublabel="Not available via Kick API"
                />
              )}

              {/* Hours Watched / Total Views */}
              {platform === 'twitch' ? (
                <StatCard
                  icon={Eye}
                  label="Hours Watched"
                  value={creator.hoursWatchedMonth ? formatHoursWatched(creator.hoursWatchedMonth) : 'Tracking...'}
                  sublabel="Last 30 days"
                />
              ) : platform === 'kick' ? (
                <StatCard
                  icon={Eye}
                  label="Total Views"
                  value="—"
                  sublabel="Not available via Kick API"
                />
              ) : platform === 'youtube' ? (
                <StatCard
                  icon={Eye}
                  label="Total Views"
                  value={formatNumber(creator.totalViews)}
                />
              ) : null}

              {/* Videos / Category */}
              {platform === 'twitch' && creator.category && (
                <StatCard
                  icon={Video}
                  label="Category"
                  value={creator.category}
                />
              )}
              {platform === 'kick' && creator.category && (
                <StatCard
                  icon={Video}
                  label="Category"
                  value={creator.category}
                />
              )}
              {platform === 'youtube' && (
                <StatCard
                  icon={Video}
                  label="Videos"
                  value={formatNumber(creator.totalPosts)}
                />
              )}

              {/* Avg Views/Video - Only for YouTube */}
              {platform === 'youtube' && (
                <StatCard
                  icon={TrendingUp}
                  label="Avg Views/Video"
                  value={creator.totalPosts > 0 ? formatNumber(Math.round(creator.totalViews / creator.totalPosts)) : '-'}
                />
              )}
            </div>

            {/* Growth Rate Cards */}
            {metrics && metrics.growthRates && statsHistory.length >= 7 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <GrowthRateCard
                  label="7-Day Growth"
                  value={metrics.growthRates.sevenDay}
                  platform={platform}
                />
                <GrowthRateCard
                  label="30-Day Growth"
                  value={metrics.growthRates.thirtyDay}
                  platform={platform}
                />
              </div>
            )}

            {/* Growth Summary */}
            {(creator.subscribers || creator.followers) && (
              <div className={`grid gap-4 mb-6 ${platform === 'tiktok' ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {platform === 'youtube' ? (
                  <>
                    {/* For YouTube, lead with Views (accurate) instead of Subscribers (rounded) */}
                    <SummaryCard
                      label="Views"
                      sublabel="Last 30 days"
                      value={metrics ? formatNumber(metrics.last30Days.views) : '--'}
                      change={metrics?.last30Days.views}
                    />
                    <SummaryCard
                      label="Videos"
                      sublabel="Last 30 days"
                      value={metrics ? `${metrics.last30Days.videos >= 0 ? '+' : ''}${metrics.last30Days.videos}` : '--'}
                    />
                    <SummaryCard
                      label="Monthly Est."
                      sublabel="Based on avg CPM"
                      value={metrics && metrics.last30Days.views > 0
                        ? formatEarnings(metrics.last30Days.views / 1000 * 2, metrics.last30Days.views / 1000 * 7)
                        : '--'
                      }
                    />
                    <SummaryCard
                      label="Yearly Est."
                      sublabel="Based on avg CPM"
                      value={metrics && metrics.last30Days.views > 0
                        ? formatEarnings(metrics.last30Days.views / 1000 * 2 * 12, metrics.last30Days.views / 1000 * 7 * 12)
                        : '--'
                      }
                    />
                  </>
                ) : platform === 'tiktok' ? (
                  <>
                    <SummaryCard
                      label="Followers"
                      sublabel="Last 30 days"
                      value={metrics ? formatNumber(metrics.last30Days.subs) : '--'}
                      change={metrics?.last30Days.subs}
                    />
                    <SummaryCard
                      label="Likes"
                      sublabel="Last 30 days"
                      value={metrics ? formatNumber(metrics.last30Days.views) : '--'}
                      change={metrics?.last30Days.views}
                    />
                  </>
                ) : platform === 'twitch' ? (
                  <>
                    <SummaryCard
                      label="Followers"
                      sublabel="Last 30 days"
                      value={metrics ? formatNumber(metrics.last30Days.subs) : '--'}
                      change={metrics?.last30Days.subs}
                    />
                  </>
                ) : platform === 'kick' ? (
                  <>
                    <SummaryCard
                      label="Paid Subscribers"
                      sublabel="Last 30 days"
                      value={metrics ? formatNumber(metrics.last30Days.subs) : '--'}
                      change={metrics?.last30Days.subs}
                    />
                  </>
                ) : (
                  <>
                    <SummaryCard
                      label="Subscribers"
                      sublabel="Last 30 days"
                      value={metrics ? formatNumber(metrics.last30Days.subs) : '--'}
                      change={metrics?.last30Days.subs}
                    />
                    <SummaryCard
                      label="Views"
                      sublabel="Last 30 days"
                      value={metrics ? formatNumber(metrics.last30Days.views) : '--'}
                      change={metrics?.last30Days.views}
                    />
                  </>
                )}
              </div>
            )}

            {/* Latest Video Card - YouTube only */}
            {platform === 'youtube' && latestVideo && (
              <a
                href={`https://youtube.com/watch?v=${latestVideo.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative sm:w-72 flex-shrink-0">
                    <img
                      src={latestVideo.thumbnail}
                      alt={latestVideo.title}
                      loading="lazy"
                      className="w-full h-44 sm:h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <p className="text-xs font-medium text-indigo-600 mb-1.5">Latest Video</p>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {latestVideo.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {(() => {
                          const published = new Date(latestVideo.publishedAt);
                          const now = new Date();
                          const diffDays = Math.floor((now - published) / (1000 * 60 * 60 * 24));
                          if (diffDays === 0) return 'today';
                          if (diffDays === 1) return 'yesterday';
                          if (diffDays < 7) return `${diffDays} days ago`;
                          if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
                          if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
                          return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center gap-5 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {formatNumber(latestVideo.views)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-gray-400" />
                        {formatNumber(latestVideo.likes)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        {formatNumber(latestVideo.comments)}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* Live Counter Link - Hidden for TikTok (no real-time updates) */}
            {platform !== 'tiktok' && (
              <Link
                to={`/live/${platform}/${creator.username}`}
                className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 sm:p-5 mb-6 text-white hover:from-indigo-700 hover:to-purple-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      Live {platform === 'twitch' ? 'Follower' : platform === 'kick' ? 'Paid Subscriber' : 'Subscriber'} Count
                    </p>
                    <p className="text-xs sm:text-sm text-indigo-200 truncate">Watch the count update in real-time</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </Link>
            )}

            {/* Milestone Predictions */}
            {metrics && (
              platform === 'youtube'
                ? creator.totalViews && metrics.dailyAverage.views > 0
                : creator.subscribers || creator.followers
            ) && (
              <MilestonePredictions
                currentCount={platform === 'youtube' ? creator.totalViews : (creator.subscribers || creator.followers)}
                dailyGrowth={platform === 'youtube' ? metrics.dailyAverage.views : metrics.dailyAverage.subs}
                platform={platform}
              />
            )}

            {/* Growth Chart */}
            {statsHistory.length >= 2 && (
              <GrowthChart
                data={statsHistory}
                range={chartRange}
                onRangeChange={setChartRange}
                metric={chartMetric}
                onMetricChange={(metric) => {
                  setChartMetric(metric);
                  analytics.changeChartMetric(metric);
                }}
                platform={platform}
              />
            )}

            {/* Daily Metrics Table */}
            {metrics ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Daily Channel Metrics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left">
                        <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                        <th className="px-6 py-4 font-semibold text-gray-600 text-right">
                          {platform === 'tiktok' ? 'Followers' : platform === 'twitch' ? 'Followers' : platform === 'kick' ? 'Paid Subs' : 'Subscribers'}
                        </th>
                        {platform === 'tiktok' && <th className="px-6 py-4 font-semibold text-gray-600 text-right">Likes</th>}
                        {platform === 'tiktok' && <th className="px-6 py-4 font-semibold text-gray-600 text-right">Videos</th>}
                        {platform === 'twitch' && <th className="px-6 py-4 font-semibold text-gray-600 text-right">Watch Hours</th>}
                        {platform === 'youtube' && <th className="px-6 py-4 font-semibold text-gray-600 text-right">Views</th>}
                        {platform === 'youtube' && <th className="px-6 py-4 font-semibold text-gray-600 text-right">Videos</th>}
                        {platform === 'youtube' && <th className="px-6 py-4 font-semibold text-gray-600 text-right">Est. Earnings</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.dailyStats.map((stat) => (
                        <tr key={stat.recorded_at} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(stat.recorded_at + 'T12:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-gray-900">{formatNumber(stat.subscribers || stat.followers)}</span>
                              {(platform === 'tiktok' || platform === 'twitch' || platform === 'kick') && stat.subsChange !== 0 && (
                                <span className={`text-xs ${stat.subsChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {stat.subsChange > 0 ? '+' : ''}{formatNumber(stat.subsChange)}
                                </span>
                              )}
                            </div>
                          </td>
                          {platform === 'tiktok' && (
                            <>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-medium text-gray-900">{formatNumber(stat.total_views || 0)}</span>
                                  {stat.viewsChange !== 0 && (
                                    <span className={`text-xs ${stat.viewsChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {stat.viewsChange > 0 ? '+' : ''}{formatNumber(stat.viewsChange)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-medium text-gray-900">{formatNumber(stat.total_posts || 0)}</span>
                                  {stat.videosChange !== 0 && (
                                    <span className={`text-xs ${stat.videosChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {stat.videosChange > 0 ? '+' : ''}{stat.videosChange}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                          {platform === 'twitch' && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-medium text-gray-900">
                                  {stat.hours_watched_day ? `${(stat.hours_watched_day / 1000).toFixed(1)}K` : '-'}
                                </span>
                              </div>
                            </td>
                          )}
                          {platform === 'youtube' && (
                            <>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-medium text-gray-900">{formatNumber(stat.total_views)}</span>
                                  {stat.viewsChange !== 0 && (
                                    <span className={`text-xs ${stat.viewsChange > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                      {stat.viewsChange > 0 ? '+' : ''}{formatNumber(stat.viewsChange)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-medium text-gray-900">{formatNumber(stat.total_posts || 0)}</span>
                                  {stat.videosChange !== 0 && (
                                    <span className={`text-xs ${stat.videosChange > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {stat.videosChange > 0 ? '+' : ''}{stat.videosChange}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-600">
                                {stat.viewsChange > 0
                                  ? formatEarnings(stat.viewsChange / 1000 * 2, stat.viewsChange / 1000 * 7)
                                  : '—'
                                }
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {/* Summary Rows */}
                      <tr className="bg-indigo-50 font-semibold">
                        <td className="px-6 py-4 text-indigo-900">Daily Average</td>
                        <td className="px-6 py-4 text-right">
                          {/* For YouTube, show dash since subscriber counts are rounded */}
                          {platform === 'youtube' ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span className={metrics.dailyAverage.subs >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                              {metrics.dailyAverage.subs >= 0 ? '+' : ''}{formatNumber(metrics.dailyAverage.subs)}
                            </span>
                          )}
                        </td>
                        {platform === 'tiktok' && (
                          <>
                            <td className="px-6 py-4 text-right">
                              <span className={metrics.dailyAverage.views >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                {metrics.dailyAverage.views > 0 ? `+${formatNumber(metrics.dailyAverage.views)}` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right"></td>
                          </>
                        )}
                        {platform === 'twitch' && (
                          <td className="px-6 py-4 text-right text-indigo-900">
                            {metrics.dailyAverage?.hoursWatched > 0
                              ? `${(metrics.dailyAverage.hoursWatched / 1000).toFixed(1)}K`
                              : '—'
                            }
                          </td>
                        )}
                        {platform === 'youtube' && (
                          <>
                            <td className={`px-6 py-4 text-right ${metrics.dailyAverage.views > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {metrics.dailyAverage.views > 0
                                ? `+${formatNumber(metrics.dailyAverage.views)}`
                                : '—'
                              }
                            </td>
                            <td className="px-6 py-4 text-right"></td>
                            <td className="px-6 py-4 text-right text-indigo-900">
                              {metrics.dailyAverage.views > 0
                                ? formatEarnings(metrics.dailyAverage.views / 1000 * 2, metrics.dailyAverage.views / 1000 * 7)
                                : '—'
                              }
                            </td>
                          </>
                        )}
                      </tr>

                      <tr className="bg-indigo-50 font-semibold">
                        <td className="px-6 py-4 text-indigo-900">Weekly Average</td>
                        <td className="px-6 py-4 text-right">
                          {platform === 'youtube' ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span className={metrics.weeklyAverage.subs >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                              {metrics.weeklyAverage.subs >= 0 ? '+' : ''}{formatNumber(metrics.weeklyAverage.subs)}
                            </span>
                          )}
                        </td>
                        {platform === 'tiktok' && (
                          <>
                            <td className="px-6 py-4 text-right">
                              <span className={metrics.weeklyAverage.views >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                {metrics.weeklyAverage.views > 0 ? `+${formatNumber(metrics.weeklyAverage.views)}` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right"></td>
                          </>
                        )}
                        {platform === 'twitch' && (
                          <td className="px-6 py-4 text-right text-indigo-900">
                            {metrics.weeklyAverage?.hoursWatched > 0
                              ? `${(metrics.weeklyAverage.hoursWatched / 1000).toFixed(1)}K`
                              : '—'
                            }
                          </td>
                        )}
                        {platform === 'youtube' && (
                          <>
                            <td className={`px-6 py-4 text-right ${metrics.weeklyAverage.views > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {metrics.weeklyAverage.views > 0
                                ? `+${formatNumber(metrics.weeklyAverage.views)}`
                                : '—'
                              }
                            </td>
                            <td className="px-6 py-4 text-right"></td>
                            <td className="px-6 py-4 text-right text-indigo-900">
                              {metrics.weeklyAverage.views > 0
                                ? formatEarnings(metrics.weeklyAverage.views / 1000 * 2, metrics.weeklyAverage.views / 1000 * 7)
                                : '—'
                              }
                            </td>
                          </>
                        )}
                      </tr>

                      <tr className="bg-indigo-50 font-semibold">
                        <td className="px-6 py-4 text-indigo-900">Last 30 Days</td>
                        <td className="px-6 py-4 text-right">
                          {platform === 'youtube' ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span className={metrics.last30Days.subs >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                              {metrics.last30Days.subs >= 0 ? '+' : ''}{formatNumber(metrics.last30Days.subs)}
                            </span>
                          )}
                        </td>
                        {platform === 'tiktok' && (
                          <>
                            <td className={`px-6 py-4 text-right ${metrics.last30Days.views >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {metrics.last30Days.views >= 0 ? '+' : ''}{formatNumber(metrics.last30Days.views)}
                            </td>
                            <td className={`px-6 py-4 text-right ${metrics.last30Days.videos >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {metrics.last30Days.videos >= 0 ? '+' : ''}{metrics.last30Days.videos}
                            </td>
                          </>
                        )}
                        {platform === 'twitch' && (
                          <td className="px-6 py-4 text-right text-indigo-900">
                            {metrics.last30Days?.hoursWatched > 0
                              ? `${(metrics.last30Days.hoursWatched / 1000).toFixed(1)}K`
                              : '—'
                            }
                          </td>
                        )}
                        {platform === 'youtube' && (
                          <>
                            <td className="px-6 py-4 text-right text-emerald-600">
                              {metrics.last30Days.views > 0
                                ? `+${formatNumber(metrics.last30Days.views)}`
                                : '—'
                              }
                            </td>
                            <td className={`px-6 py-4 text-right ${metrics.last30Days.videos >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {metrics.last30Days.videos >= 0 ? '+' : ''}{metrics.last30Days.videos}
                            </td>
                            <td className="px-6 py-4 text-right text-indigo-900">
                              {metrics.last30Days.views > 0
                                ? formatEarnings(metrics.last30Days.views / 1000 * 2, metrics.last30Days.views / 1000 * 7)
                                : '—'
                              }
                            </td>
                          </>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Building Historical Data</h3>
                <p className="text-gray-500 text-sm mb-2">
                  This creator is being tracked! We collect daily snapshots to show growth trends and metrics.
                </p>
                <p className="text-xs text-gray-400">
                  {statsHistory.length} day(s) of data collected • Check back soon for trends!
                </p>
              </div>
            )}

            {/* Channel Creation Date */}
            {creator.createdAt && (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Channel created: {new Date(creator.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />}
        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{label}</p>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1 truncate">{sublabel}</p>}
    </div>
  );
}

function SummaryCard({ label, sublabel, value, change }) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  // Use smaller text for longer values (like earnings ranges)
  const isLongValue = value && value.length > 12;

  const bgClass = isNegative
    ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100'
    : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100';

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border ${bgClass}`}>
      <p className={`font-bold text-gray-900 mb-1 ${isLongValue ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>{value}</p>
      <p className="text-xs sm:text-sm font-medium text-gray-700">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
      {change !== undefined && change !== null && (
        <p className={`text-xs mt-2 font-medium ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
          {isPositive ? '+' : ''}{formatNumber(change)}
        </p>
      )}
    </div>
  );
}

function GrowthRateCard({ label, value, platform }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const bgClass = isNegative
    ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
    : isPositive
    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
    : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200';

  const iconColor = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-400';
  const valueColor = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-500';

  const followerLabel = platform === 'tiktok' || platform === 'twitch' || platform === 'kick' ? 'Followers' : 'Subscribers';

  return (
    <div className={`rounded-2xl border p-5 ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <TrendingUp className={`w-5 h-5 ${iconColor} ${isNegative ? 'rotate-180' : ''}`} />
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>
        {isPositive ? '+' : ''}{value.toFixed(2)}%
      </div>
      <p className="text-xs text-gray-500 mt-1">{followerLabel} growth rate</p>
    </div>
  );
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

function formatHoursWatched(hours) {
  if (!hours || hours === 0) return '0';
  if (hours >= 1000000) return `${(hours / 1000000).toFixed(1)}M`;
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}K`;
  return Math.round(hours).toLocaleString();
}

function MilestonePredictions({ currentCount, dailyGrowth, platform }) {
  const followerMilestones = [
    100000, 250000, 500000, 750000,
    1000000, 2000000, 5000000, 10000000,
    25000000, 50000000, 75000000, 100000000,
    150000000, 200000000, 250000000, 300000000
  ];

  const viewMilestones = [
    1000000, 5000000, 10000000, 25000000,
    50000000, 100000000, 250000000, 500000000,
    1000000000, 2500000000, 5000000000, 10000000000,
    25000000000, 50000000000, 100000000000, 250000000000,
    500000000000, 1000000000000
  ];

  const milestones = platform === 'youtube' ? viewMilestones : followerMilestones;
  const metricLabel = platform === 'youtube' ? 'views' : 'followers';

  // Find next milestones (up to 3)
  const nextMilestones = milestones
    .filter(m => m > currentCount)
    .slice(0, 3);

  if (nextMilestones.length === 0 || dailyGrowth <= 0) {
    return null;
  }

  const predictions = nextMilestones.map(milestone => {
    const needed = milestone - currentCount;
    const daysNeeded = Math.ceil(needed / dailyGrowth);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);

    return {
      milestone,
      needed,
      daysNeeded,
      estimatedDate,
    };
  });

  const formatMilestone = (num) => {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(0) + 'T';
    if (num >= 1000000000) return (num / 1000000000).toFixed(0) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toLocaleString();
  };

  const formatDays = (days) => {
    if (days > 365) {
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      return `~${years}y ${months}m`;
    }
    if (days > 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `~${months}mo ${remainingDays}d`;
    }
    return `~${days} days`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Milestone Predictions</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Based on current {metricLabel} growth of <span className="font-semibold text-indigo-600">+{formatNumber(dailyGrowth)}/day</span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.map((pred, index) => (
          <div
            key={pred.milestone}
            className={`rounded-xl p-4 ${
              index === 0
                ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                index === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <span className={`text-2xl font-bold ${
                index === 0 ? 'text-indigo-600' : 'text-gray-900'
              }`}>
                {formatMilestone(pred.milestone)}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDays(pred.daysNeeded)}
              </p>
              <p className="text-xs text-gray-500">
                Est. {pred.estimatedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: pred.estimatedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        * Predictions assume consistent growth. Actual results may vary based on content, algorithm changes, and other factors.
      </p>
    </div>
  );
}

function GrowthChart({ data, range, onRangeChange, metric, onMetricChange, platform }) {
  const ranges = [
    { label: '30D', value: 30 },
    { label: '60D', value: 60 },
    { label: '90D', value: 90 },
    { label: 'All', value: 9999 },
  ];

  // Build metrics array based on platform
  // For YouTube: Views first (accurate), then Subscribers (rounded), then Videos
  // For Twitch: Followers only (views deprecated)
  const metrics = [];

  if (platform === 'youtube') {
    // Views are accurate for YouTube, show first
    metrics.push({
      value: 'views',
      label: 'View Growth',
      dataKey: 'views',
      color: '#10b981'
    });
    metrics.push({
      value: 'subscribers',
      label: 'Subscriber Growth',
      dataKey: 'subscribers',
      color: '#6366f1',
      note: '(rounded by YouTube)'
    });
    metrics.push({
      value: 'videos',
      label: 'Video Count',
      dataKey: 'videos',
      color: '#f59e0b'
    });
  } else if (platform === 'tiktok') {
    // TikTok: Follower Growth + Likes Growth
    metrics.push({
      value: 'subscribers',
      label: 'Follower Growth',
      dataKey: 'subscribers',
      color: '#6366f1'
    });
    metrics.push({
      value: 'views',
      label: 'Likes Growth',
      dataKey: 'views',
      color: '#ec4899'
    });
  } else if (platform === 'twitch') {
    // Twitch: only follower growth (views deprecated)
    metrics.push({
      value: 'subscribers',
      label: 'Follower Growth',
      dataKey: 'subscribers',
      color: '#6366f1'
    });
  } else {
    // Other platforms
    metrics.push({
      value: 'subscribers',
      label: 'Subscriber Growth',
      dataKey: 'subscribers',
      color: '#6366f1'
    });
    metrics.push({
      value: 'views',
      label: 'View Growth',
      dataKey: 'views',
      color: '#10b981'
    });
    metrics.push({
      value: 'videos',
      label: 'Video Count',
      dataKey: 'videos',
      color: '#f59e0b'
    });
  }

  const currentMetric = metrics.find(m => m.value === metric) || metrics[0];

  const filteredData = data
    .filter((stat) => {
      if (range === 9999) return true;
      const statDate = new Date(stat.recorded_at);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - range);
      return statDate >= cutoffDate;
    })
    .map((stat) => ({
      date: stat.recorded_at,
      subscribers: stat.subscribers || stat.followers || 0,
      views: stat.total_views || 0,
      videos: stat.total_posts || 0,
      label: new Date(stat.recorded_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

  if (filteredData.length < 2) {
    return null;
  }

  const values = filteredData.map(d => d[currentMetric.dataKey]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Calculate padding - ensure minimum 1% range for zero-variance data
  const valueRange = maxValue - minValue;
  const minPaddingRange = maxValue * 0.01 || 1000; // At least 1% of max value or 1000
  const padding = valueRange > 0
    ? Math.max(valueRange * 0.1, metric === 'views' ? 1000 : 100)
    : minPaddingRange;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {new Date(payload[0].payload.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold" style={{ color: currentMetric.color }}>
              {formatNumber(payload[0].value)}
            </span>
            {' '}{currentMetric.label.toLowerCase().replace(' growth', '').replace(' count', '')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
          {metrics.map((m) => (
            <button
              key={m.value}
              onClick={() => onMetricChange(m.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                metric === m.value
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                range === r.value
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`${metric}Gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              domain={[minValue - padding, maxValue + padding]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={currentMetric.dataKey}
              stroke={currentMetric.color}
              strokeWidth={2}
              fill={`url(#${metric}Gradient)`}
              dot={false}
              activeDot={{ r: 6, fill: currentMetric.color, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
        <span>{filteredData.length} data points</span>
        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
        <span>
          {formatNumber(filteredData[filteredData.length - 1]?.[currentMetric.dataKey] - filteredData[0]?.[currentMetric.dataKey])} net growth
        </span>
      </div>
    </div>
  );
}
