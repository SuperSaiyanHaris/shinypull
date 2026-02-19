import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Twitch, Star, Users, Loader2, TrendingUp, TrendingDown, Scale, Radio, Clock, ChevronRight, ChevronLeft, Check, X, Filter } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { getFollowedCreators } from '../services/followService';
import { getCreatorStats } from '../services/creatorService';
import { getLiveStreams as getTwitchLiveStreams } from '../services/twitchService';
import { getLiveStreams as getKickLiveStreams } from '../services/kickService';
import { getRecentlyViewed } from '../lib/recentlyViewed';
import { formatNumber } from '../lib/utils';
import logger from '../lib/logger';

const platformIcons = {
  youtube: Youtube,
  tiktok: TikTokIcon,
  twitch: Twitch,
  kick: KickIcon,
};

const platformColors = {
  youtube: { bg: 'bg-red-600', light: 'bg-red-50', text: 'text-red-600', border: 'border-red-500', ring: 'ring-red-200', bgLight: 'bg-red-100' },
  tiktok: { bg: 'bg-gray-900', light: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-700', ring: 'ring-gray-300', bgLight: 'bg-gray-100' },
  twitch: { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', ring: 'ring-purple-200', bgLight: 'bg-purple-100' },
  kick: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-500', ring: 'ring-green-200', bgLight: 'bg-green-100' },
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [followedCreators, setFollowedCreators] = useState([]);
  const [creatorStats, setCreatorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['all']);
  const [liveStreamers, setLiveStreamers] = useState(new Set());
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recentlyViewedIndex, setRecentlyViewedIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      window.dispatchEvent(new CustomEvent('openAuthPanel', {
        detail: { message: 'Sign in to access your dashboard' }
      }));
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      loadFollowedCreators();
    }
    // Load recently viewed regardless of auth
    setRecentlyViewed(getRecentlyViewed());
  }, [user]);

  async function loadFollowedCreators() {
    setLoading(true);
    try {
      const creators = await getFollowedCreators(user.id);
      setFollowedCreators(creators);

      // Load stats for each creator (get 2 data points for growth comparison)
      const stats = {};
      for (const creator of creators) {
        const creatorStatsData = await getCreatorStats(creator.id, 7);
        if (creatorStatsData?.length > 0) {
          stats[creator.id] = {
            current: creatorStatsData[0],
            previous: creatorStatsData[1] || null,
          };
        }
      }
      setCreatorStats(stats);

      // Check live status for Twitch and Kick streamers
      const allLive = new Set();
      const twitchCreators = creators.filter(c => c.platform === 'twitch');
      const kickCreators = creators.filter(c => c.platform === 'kick');

      if (twitchCreators.length > 0) {
        try {
          const liveData = await getTwitchLiveStreams(twitchCreators.map(c => c.username));
          liveData.forEach(s => allLive.add(s.username.toLowerCase()));
        } catch (e) {
          logger.warn('Failed to check Twitch live status:', e);
        }
      }
      if (kickCreators.length > 0) {
        try {
          const liveData = await getKickLiveStreams(kickCreators.map(c => c.username));
          liveData.forEach(s => allLive.add(s.username.toLowerCase()));
        } catch (e) {
          logger.warn('Failed to check Kick live status:', e);
        }
      }
      setLiveStreamers(allLive);
    } catch (error) {
      logger.error('Failed to load followed creators:', error);
    } finally {
      setLoading(false);
    }
  }

  // Toggle platform selection
  const togglePlatform = (platform) => {
    if (platform === 'all') {
      // If "All" is clicked, clear all other selections
      setSelectedPlatforms(['all']);
    } else {
      setSelectedPlatforms(prev => {
        // Remove "all" if it's currently selected
        const withoutAll = prev.filter(p => p !== 'all');

        // Toggle the clicked platform
        if (prev.includes(platform)) {
          const updated = withoutAll.filter(p => p !== platform);
          // If no platforms left, default to "all"
          return updated.length === 0 ? ['all'] : updated;
        } else {
          return [...withoutAll, platform];
        }
      });
    }
  };

  // Calculate growth (difference between current and previous stats)
  const getGrowth = (creatorId, field) => {
    const stat = creatorStats[creatorId];
    if (!stat?.current || !stat?.previous) return null;
    const current = stat.current[field] || 0;
    const previous = stat.previous[field] || 0;
    return current - previous;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const liveCount = followedCreators.filter(c => (c.platform === 'twitch' || c.platform === 'kick') && liveStreamers.has(c.username.toLowerCase())).length;

  // Platform counts
  const platformCounts = {
    youtube: followedCreators.filter(c => c.platform === 'youtube').length,
    tiktok: followedCreators.filter(c => c.platform === 'tiktok').length,
    twitch: followedCreators.filter(c => c.platform === 'twitch').length,
    kick: followedCreators.filter(c => c.platform === 'kick').length,
  };

  // Filter creators by selected platforms (OR logic - match ANY selected platform)
  const filteredCreators = selectedPlatforms.includes('all')
    ? followedCreators
    : followedCreators.filter(c => {
        if (selectedPlatforms.includes('live')) {
          return (c.platform === 'twitch' || c.platform === 'kick') && liveStreamers.has(c.username.toLowerCase());
        }
        return selectedPlatforms.includes(c.platform);
      });

  return (
    <>
      <SEO
        title="My Dashboard"
        description="Track your favorite creators and see their latest statistics."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-500">
              Track your favorite creators and see their latest updates.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
                  Platforms
                </h3>
                <nav className="space-y-1">
                  {/* All Following */}
                  <button
                    onClick={() => togglePlatform('all')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedPlatforms.includes('all')
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedPlatforms.includes('all')
                          ? 'bg-white border-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedPlatforms.includes('all') && <Check className="w-3 h-3 text-indigo-600" />}
                      </div>
                      <span>All Following</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      selectedPlatforms.includes('all') ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {followedCreators.length}
                    </span>
                  </button>

                  {/* Platform Filters */}
                  {['youtube', 'tiktok', 'twitch', 'kick'].map(platform => {
                    const Icon = platformIcons[platform];
                    const count = platformCounts[platform];
                    const label = platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : platform === 'twitch' ? 'Twitch' : 'Kick';
                    const isActive = selectedPlatforms.includes(platform);

                    return (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isActive
                              ? 'bg-white border-white'
                              : 'border-gray-300'
                          }`}>
                            {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                          </div>
                          <span>{label}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Live Now Filter */}
                  <button
                    onClick={() => togglePlatform('live')}
                    disabled={liveCount === 0}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedPlatforms.includes('live')
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } ${liveCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center relative ${
                        selectedPlatforms.includes('live')
                          ? 'bg-white border-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedPlatforms.includes('live') && <Check className="w-3 h-3 text-indigo-600" />}
                        {liveCount > 0 && !selectedPlatforms.includes('live') && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span>Live Now</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      selectedPlatforms.includes('live') ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {liveCount}
                    </span>
                  </button>
                </nav>
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden fixed bottom-6 left-6 z-40">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-full shadow-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Mobile Slide Panel */}
            {mobileFiltersOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
                  onClick={() => setMobileFiltersOpen(false)}
                />

                {/* Slide Panel */}
                <div className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl animate-slide-in-left overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Filter by Platform</h3>
                      <button
                        onClick={() => setMobileFiltersOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <nav className="space-y-1">
                      {/* All Following */}
                      <button
                        onClick={() => togglePlatform('all')}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedPlatforms.includes('all')
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedPlatforms.includes('all')
                              ? 'bg-white border-white'
                              : 'border-gray-300'
                          }`}>
                            {selectedPlatforms.includes('all') && <Check className="w-3 h-3 text-indigo-600" />}
                          </div>
                          <span>All Following</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          selectedPlatforms.includes('all') ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {followedCreators.length}
                        </span>
                      </button>

                      {/* Platform Filters */}
                      {['youtube', 'tiktok', 'twitch', 'kick'].map(platform => {
                        const Icon = platformIcons[platform];
                        const count = platformCounts[platform];
                        const label = platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : platform === 'twitch' ? 'Twitch' : 'Kick';
                        const isActive = selectedPlatforms.includes(platform);

                        return (
                          <button
                            key={platform}
                            onClick={() => togglePlatform(platform)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isActive
                                  ? 'bg-white border-white'
                                  : 'border-gray-300'
                              }`}>
                                {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                              </div>
                              <span>{label}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}

                      {/* Live Now Filter */}
                      <button
                        onClick={() => togglePlatform('live')}
                        disabled={liveCount === 0}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedPlatforms.includes('live')
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        } ${liveCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center relative ${
                            selectedPlatforms.includes('live')
                              ? 'bg-white border-white'
                              : 'border-gray-300'
                          }`}>
                            {selectedPlatforms.includes('live') && <Check className="w-3 h-3 text-indigo-600" />}
                            {liveCount > 0 && !selectedPlatforms.includes('live') && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <span>Live Now</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          selectedPlatforms.includes('live') ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {liveCount}
                        </span>
                      </button>
                    </nav>
                  </div>
                </div>
              </>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">

          {/* Quick Actions */}
          {followedCreators.length >= 2 && (
            <div className="mb-8 flex flex-wrap items-center gap-3">
              {!compareMode ? (
                <button
                  onClick={() => setCompareMode(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                  Compare Followed Creators
                </button>
              ) : (
                <>
                  <span className="text-sm text-gray-600">
                    Select 2-3 creators to compare ({selectedForCompare.length}/3)
                  </span>
                  <Link
                    to={`/compare?creators=${selectedForCompare.map(id => {
                      const c = followedCreators.find(fc => fc.id === id);
                      return c ? `${c.platform}:${c.username}` : '';
                    }).filter(Boolean).join(',')}`}
                    onClick={() => {
                      setCompareMode(false);
                      setSelectedForCompare([]);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-colors ${
                      selectedForCompare.length >= 2
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    Compare Selected
                  </Link>
                  <button
                    onClick={() => {
                      setCompareMode(false);
                      setSelectedForCompare([]);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {/* Following List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {selectedPlatforms.includes('all') ? 'Creators You Follow' :
                 selectedPlatforms.includes('live') ? 'Live Now' :
                 selectedPlatforms.length === 1 ? (
                   selectedPlatforms[0] === 'youtube' ? 'YouTube Creators' :
                   selectedPlatforms[0] === 'tiktok' ? 'TikTok Creators' :
                   selectedPlatforms[0] === 'twitch' ? 'Twitch Streamers' :
                   selectedPlatforms[0] === 'kick' ? 'Kick Streamers' :
                   'Creators You Follow'
                 ) : 'Selected Creators'}
              </h2>
              {liveCount > 0 && selectedPlatforms.includes('all') && (
                <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {liveCount} live
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="text-center p-12">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedPlatforms.includes('live') ? 'No one is live right now' : 'No creators found'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedPlatforms.includes('live')
                    ? 'Check back later to see when your followed streamers go live.'
                    : 'Start following creators to track their statistics here.'}
                </p>
                {!selectedPlatforms.includes('live') && (
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Find Creators
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCreators.map(creator => {
                  const PlatformIcon = platformIcons[creator.platform] || Users;
                  const colors = platformColors[creator.platform] || { bg: 'bg-gray-600', light: 'bg-gray-50', text: 'text-gray-600' };
                  const stats = creatorStats[creator.id];
                  const isLive = (creator.platform === 'twitch' || creator.platform === 'kick') && liveStreamers.has(creator.username.toLowerCase());
                  const growth = getGrowth(creator.id, creator.platform === 'youtube' ? 'subscribers' : 'followers');

                  const isSelected = selectedForCompare.includes(creator.id);
                  const toggleSelection = () => {
                    if (isSelected) {
                      setSelectedForCompare(prev => prev.filter(id => id !== creator.id));
                    } else if (selectedForCompare.length < 3) {
                      setSelectedForCompare(prev => [...prev, creator.id]);
                    }
                  };

                  const CreatorRow = (
                    <div className="flex items-center gap-4 p-4">
                      {compareMode && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-gray-900 border-gray-900'
                            : 'border-gray-300 hover:border-indigo-400'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      )}
                      <div className="relative">
                        <img
                          src={creator.profile_image || '/placeholder-avatar.svg'}
                          alt={creator.display_name}
                          loading="lazy"
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        {isLive && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`p-1 rounded ${colors.light}`}>
                            <PlatformIcon className={`w-3 h-3 ${colors.text}`} />
                          </span>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {creator.display_name}
                          </h3>
                          {isLive && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">@{creator.username}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-gray-900">
                          {stats?.current ? formatNumber(stats.current.subscribers || stats.current.followers) : '-'}
                        </p>
                        <div className="flex items-center justify-end gap-1">
                          {growth !== null && growth !== 0 ? (
                            <span className={`flex items-center text-xs font-medium ${growth > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {growth > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-0.5" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-0.5" />
                              )}
                              {growth > 0 ? '+' : ''}{formatNumber(growth)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {creator.platform === 'youtube' ? 'subs' : 'followers'}
                            </span>
                          )}
                        </div>
                      </div>
                      {!compareMode && <ChevronRight className="w-5 h-5 text-gray-300" />}
                    </div>
                  );

                  return compareMode ? (
                    <button
                      key={creator.id}
                      onClick={toggleSelection}
                      className={`w-full text-left transition-colors ${
                        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      } ${selectedForCompare.length >= 3 && !isSelected ? 'opacity-50' : ''}`}
                    >
                      {CreatorRow}
                    </button>
                  ) : (
                    <Link
                      key={creator.id}
                      to={`/${creator.platform}/${creator.username}`}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      {CreatorRow}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Recently Viewed</h2>
                </div>
                {recentlyViewed.length > 4 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRecentlyViewedIndex(Math.max(0, recentlyViewedIndex - 4))}
                      disabled={recentlyViewedIndex === 0}
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRecentlyViewedIndex(Math.min(recentlyViewed.length - 4, recentlyViewedIndex + 4))}
                      disabled={recentlyViewedIndex >= recentlyViewed.length - 4}
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recentlyViewed.slice(recentlyViewedIndex, recentlyViewedIndex + 4).map((creator, idx) => {
                  const PlatformIcon = platformIcons[creator.platform] || Users;
                  const colors = platformColors[creator.platform] || { light: 'bg-gray-50', text: 'text-gray-600' };
                  return (
                    <Link
                      key={`${creator.platform}-${creator.username}-${idx}`}
                      to={`/${creator.platform}/${creator.username}`}
                      className="bg-white rounded-xl border border-gray-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <img
                        src={creator.profileImage || '/placeholder-avatar.svg'}
                        alt={creator.displayName}
                        loading="lazy"
                        className="w-12 h-12 rounded-lg object-cover mx-auto mb-2"
                      />
                      <div className="text-center">
                        <p className="font-medium text-gray-900 text-sm truncate">{creator.displayName}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className={`p-0.5 rounded ${colors.light}`}>
                            <PlatformIcon className={`w-3 h-3 ${colors.text}`} />
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatNumber(creator.subscribers || creator.followers || 0)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
