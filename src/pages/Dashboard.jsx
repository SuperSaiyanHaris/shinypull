import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Twitch, Star, Users, Loader2, TrendingUp, TrendingDown, Scale, Radio, Clock, ChevronRight, ChevronLeft, Check, X, Filter } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
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
  bluesky: BlueskyIcon,
};

const platformColors = {
  youtube: { bg: 'bg-red-600', light: 'bg-red-950/30', text: 'text-red-400', border: 'border-red-500', ring: 'ring-red-800', bgLight: 'bg-red-900/30' },
  tiktok: { bg: 'bg-pink-600', light: 'bg-pink-950/30', text: 'text-pink-400', border: 'border-pink-800', ring: 'ring-pink-800', bgLight: 'bg-pink-950/30' },
  twitch: { bg: 'bg-purple-600', light: 'bg-purple-950/30', text: 'text-purple-600', border: 'border-purple-500', ring: 'ring-purple-800', bgLight: 'bg-purple-900/30' },
  kick: { bg: 'bg-green-600', light: 'bg-green-950/30', text: 'text-green-400', border: 'border-green-800', ring: 'ring-green-800', bgLight: 'bg-green-900/30' },
  bluesky: { bg: 'bg-sky-500', light: 'bg-sky-950/30', text: 'text-sky-400', border: 'border-sky-800', ring: 'ring-sky-800', bgLight: 'bg-sky-900/30' },
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
      setLoading(false); // Show the list immediately — stats/live load in background

      if (creators.length === 0) return;

      const twitchCreators = creators.filter(c => c.platform === 'twitch');
      const kickCreators = creators.filter(c => c.platform === 'kick');

      // Fan out: all stat queries + live checks fire in parallel
      const [statsResults, twitchLive, kickLive] = await Promise.all([
        Promise.all(
          creators.map(creator =>
            getCreatorStats(creator.id, 7)
              .then(data => ({ id: creator.id, data: data || [] }))
              .catch(() => ({ id: creator.id, data: [] }))
          )
        ),
        twitchCreators.length > 0
          ? getTwitchLiveStreams(twitchCreators.map(c => c.username)).catch(() => [])
          : Promise.resolve([]),
        kickCreators.length > 0
          ? getKickLiveStreams(kickCreators.map(c => c.username)).catch(() => [])
          : Promise.resolve([]),
      ]);

      // Process stats
      const stats = {};
      for (const { id, data } of statsResults) {
        if (data.length > 0) {
          stats[id] = { current: data[0], previous: data[1] || null };
        }
      }
      setCreatorStats(stats);

      // Process live status
      const allLive = new Set();
      twitchLive.forEach(s => allLive.add(s.username.toLowerCase()));
      kickLive.forEach(s => allLive.add(s.username.toLowerCase()));
      setLiveStreamers(allLive);

    } catch (error) {
      logger.error('Failed to load followed creators:', error);
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
      <div className="min-h-screen bg-gray-800/50 flex items-center justify-center">
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
    bluesky: followedCreators.filter(c => c.platform === 'bluesky').length,
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

      <div className="min-h-screen bg-gray-800/50">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-300">
              Track your favorite creators and see their latest updates.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 px-3">
                  Platforms
                </h3>
                <nav className="space-y-1">
                  {/* All Following */}
                  <button
                    onClick={() => togglePlatform('all')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedPlatforms.includes('all')
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedPlatforms.includes('all')
                          ? 'bg-gray-900 border-gray-800'
                          : 'border-gray-600'
                      }`}>
                        {selectedPlatforms.includes('all') && <Check className="w-3 h-3 text-indigo-600" />}
                      </div>
                      <span>All Following</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      selectedPlatforms.includes('all') ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {followedCreators.length}
                    </span>
                  </button>

                  {/* Platform Filters */}
                  {['youtube', 'tiktok', 'twitch', 'kick', 'bluesky'].map(platform => {
                    const Icon = platformIcons[platform];
                    const count = platformCounts[platform];
                    const label = platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : platform === 'twitch' ? 'Twitch' : platform === 'kick' ? 'Kick' : 'Bluesky';
                    const isActive = selectedPlatforms.includes(platform);

                    return (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isActive
                              ? 'bg-gray-900 border-gray-800'
                              : 'border-gray-600'
                          }`}>
                            {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                          </div>
                          <span>{label}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          isActive ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
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
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                    } ${liveCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center relative ${
                        selectedPlatforms.includes('live')
                          ? 'bg-gray-900 border-gray-800'
                          : 'border-gray-600'
                      }`}>
                        {selectedPlatforms.includes('live') && <Check className="w-3 h-3 text-indigo-600" />}
                        {liveCount > 0 && !selectedPlatforms.includes('live') && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span>Live Now</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      selectedPlatforms.includes('live') ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
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
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full shadow-lg transition-colors"
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
                <div className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-900 z-50 shadow-2xl animate-slide-in-left overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-100">Filter by Platform</h3>
                      <button
                        onClick={() => setMobileFiltersOpen(false)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>

                    <nav className="space-y-1">
                      {/* All Following */}
                      <button
                        onClick={() => togglePlatform('all')}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedPlatforms.includes('all')
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedPlatforms.includes('all')
                              ? 'bg-gray-900 border-gray-800'
                              : 'border-gray-600'
                          }`}>
                            {selectedPlatforms.includes('all') && <Check className="w-3 h-3 text-indigo-600" />}
                          </div>
                          <span>All Following</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          selectedPlatforms.includes('all') ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
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
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isActive
                                  ? 'bg-gray-900 border-gray-800'
                                  : 'border-gray-600'
                              }`}>
                                {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                              </div>
                              <span>{label}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              isActive ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
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
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                        } ${liveCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center relative ${
                            selectedPlatforms.includes('live')
                              ? 'bg-gray-900 border-gray-800'
                              : 'border-gray-600'
                          }`}>
                            {selectedPlatforms.includes('live') && <Check className="w-3 h-3 text-indigo-600" />}
                            {liveCount > 0 && !selectedPlatforms.includes('live') && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <span>Live Now</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          selectedPlatforms.includes('live') ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                  Compare Followed Creators
                </button>
              ) : (
                <>
                  <span className="text-sm text-gray-300">
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
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                        : 'bg-gray-700 text-gray-300 cursor-not-allowed pointer-events-none'
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {/* Following List */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
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
                <span className="text-sm text-red-400 font-medium flex items-center gap-1">
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
                <h3 className="text-lg font-medium text-gray-100 mb-2">
                  {selectedPlatforms.includes('live') ? 'No one is live right now' : 'No creators found'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {selectedPlatforms.includes('live')
                    ? 'Check back later to see when your followed streamers go live.'
                    : 'Start following creators to track their statistics here.'}
                </p>
                {!selectedPlatforms.includes('live') && (
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors"
                  >
                    Find Creators
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredCreators.map(creator => {
                  const PlatformIcon = platformIcons[creator.platform] || Users;
                  const colors = platformColors[creator.platform] || { bg: 'bg-gray-600', light: 'bg-gray-800/50', text: 'text-gray-300' };
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
                            : 'border-gray-600 hover:border-indigo-400'
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
                          <h3 className="font-semibold text-gray-100 truncate">
                            {creator.display_name}
                          </h3>
                          {isLive && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-red-900/30 text-red-400 text-xs font-medium rounded-full">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300">@{creator.username}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-gray-100">
                          {stats?.current ? formatNumber(stats.current.subscribers || stats.current.followers) : '-'}
                        </p>
                        <div className="flex items-center justify-end gap-1">
                          {growth !== null && growth !== 0 ? (
                            <span className={`flex items-center text-xs font-medium ${growth > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                              {growth > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-0.5" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-0.5" />
                              )}
                              {growth > 0 ? '+' : ''}{formatNumber(growth)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">
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
                        isSelected ? 'bg-indigo-950/50' : 'hover:bg-gray-800/50'
                      } ${selectedForCompare.length >= 3 && !isSelected ? 'opacity-50' : ''}`}
                    >
                      {CreatorRow}
                    </button>
                  ) : (
                    <Link
                      key={creator.id}
                      to={`/${creator.platform}/${creator.username}`}
                      className="block hover:bg-gray-800/50 transition-colors"
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
                  <Clock className="w-5 h-5 text-gray-300" />
                  <h2 className="text-lg font-semibold text-gray-100">Recently Viewed</h2>
                </div>
                {recentlyViewed.length > 4 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRecentlyViewedIndex(Math.max(0, recentlyViewedIndex - 4))}
                      disabled={recentlyViewedIndex === 0}
                      className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRecentlyViewedIndex(Math.min(recentlyViewed.length - 4, recentlyViewedIndex + 4))}
                      disabled={recentlyViewedIndex >= recentlyViewed.length - 4}
                      className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recentlyViewed.slice(recentlyViewedIndex, recentlyViewedIndex + 4).map((creator, idx) => {
                  const PlatformIcon = platformIcons[creator.platform] || Users;
                  const colors = platformColors[creator.platform] || { light: 'bg-gray-800/50', text: 'text-gray-300' };
                  return (
                    <Link
                      key={`${creator.platform}-${creator.username}-${idx}`}
                      to={`/${creator.platform}/${creator.username}`}
                      className="bg-gray-900 rounded-xl border border-gray-700 p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <img
                        src={creator.profileImage || '/placeholder-avatar.svg'}
                        alt={creator.displayName}
                        loading="lazy"
                        className="w-12 h-12 rounded-lg object-cover mx-auto mb-2"
                      />
                      <div className="text-center">
                        <p className="font-medium text-gray-100 text-sm truncate">{creator.displayName}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className={`p-0.5 rounded ${colors.light}`}>
                            <PlatformIcon className={`w-3 h-3 ${colors.text}`} />
                          </span>
                          <span className="text-xs text-gray-300">
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
