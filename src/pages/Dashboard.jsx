import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Youtube, Twitch, Star, Users, Loader2, TrendingUp, TrendingDown,
  Scale, Clock, ChevronRight, ChevronLeft, Check, X, Trash2,
  ExternalLink, BookmarkX, Download, Lock,
} from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getFollowedCreators } from '../services/followService';
import { getSavedCompares, deleteSavedCompare } from '../services/compareService';
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
  youtube: { bg: 'bg-red-600', light: 'bg-red-950/30', text: 'text-red-400', border: 'border-red-800' },
  tiktok:  { bg: 'bg-pink-600', light: 'bg-pink-950/30', text: 'text-pink-400', border: 'border-pink-800' },
  twitch:  { bg: 'bg-purple-600', light: 'bg-purple-950/30', text: 'text-purple-400', border: 'border-purple-800' },
  kick:    { bg: 'bg-green-600', light: 'bg-green-950/30', text: 'text-green-400', border: 'border-green-800' },
  bluesky: { bg: 'bg-sky-500', light: 'bg-sky-950/30', text: 'text-sky-400', border: 'border-sky-800' },
};

const PLATFORM_LABELS = {
  youtube: 'YouTube', tiktok: 'TikTok', twitch: 'Twitch', kick: 'Kick', bluesky: 'Bluesky',
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { tier } = useSubscription();

  // Data
  const [followedCreators, setFollowedCreators] = useState([]);
  const [creatorStats, setCreatorStats] = useState({});
  const [liveStreamers, setLiveStreamers] = useState(new Set());
  const [savedCompares, setSavedCompares] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Loading states
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [loadingCompares, setLoadingCompares] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('following');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [recentlyViewedIndex, setRecentlyViewedIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      window.dispatchEvent(new CustomEvent('openAuthPanel', {
        detail: { message: 'Sign in to access your dashboard' },
      }));
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      loadFollowedCreators();
      loadSavedCompares();
    }
    setRecentlyViewed(getRecentlyViewed());
  }, [user]);

  async function loadFollowedCreators() {
    setLoadingCreators(true);
    try {
      const creators = await getFollowedCreators(user.id);
      setFollowedCreators(creators);
      setLoadingCreators(false);

      if (creators.length === 0) return;

      const twitchCreators = creators.filter(c => c.platform === 'twitch');
      const kickCreators = creators.filter(c => c.platform === 'kick');

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

      const stats = {};
      for (const { id, data } of statsResults) {
        if (data.length > 0) stats[id] = { current: data[0], previous: data[1] || null, weekAgo: data[data.length - 1] || null };
      }
      setCreatorStats(stats);

      const allLive = new Set();
      twitchLive.forEach(s => allLive.add(s.username.toLowerCase()));
      kickLive.forEach(s => allLive.add(s.username.toLowerCase()));
      setLiveStreamers(allLive);
    } catch (error) {
      logger.error('Failed to load followed creators:', error);
      setLoadingCreators(false);
    }
  }

  async function loadSavedCompares() {
    setLoadingCompares(true);
    try {
      const data = await getSavedCompares(user.id);
      setSavedCompares(data);
    } catch (err) {
      logger.error('Failed to load saved compares:', err);
    } finally {
      setLoadingCompares(false);
    }
  }

  async function handleDeleteCompare(id) {
    try {
      await deleteSavedCompare(id);
      setSavedCompares(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      logger.error('Failed to delete compare:', err);
    }
  }

  const getGrowth = (creatorId, field) => {
    const stat = creatorStats[creatorId];
    if (!stat?.current || !stat?.previous) return null;
    return (stat.current[field] || 0) - (stat.previous[field] || 0);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] dot-grid flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleBulkExport = () => {
    if (!followedCreators.length) return;

    const exportDate = new Date().toISOString().split('T')[0];
    const fmtDelta = (n) => n == null ? '' : (n >= 0 ? `+${n}` : `${n}`);
    const esc = (v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
      ['ShinyPull Creator Report'],
      ['Exported', exportDate],
      ['Total Creators', followedCreators.length],
      [],
    ];

    const PLATFORM_ORDER = ['youtube', 'tiktok', 'twitch', 'kick', 'bluesky'];
    const PLATFORM_LABELS = { youtube: 'YouTube', tiktok: 'TikTok', twitch: 'Twitch', kick: 'Kick', bluesky: 'Bluesky' };

    for (const platform of PLATFORM_ORDER) {
      const creators = followedCreators.filter(c => c.platform === platform);
      if (!creators.length) continue;

      lines.push([`--- ${PLATFORM_LABELS[platform]} (${creators.length}) ---`]);

      if (platform === 'youtube') {
        lines.push(['Name', 'Username', 'Subscribers', '1-Day Sub Change', '7-Day Sub Change', 'Total Views', '1-Day Views', 'Videos', 'Est Monthly Revenue Low ($)', 'Est Monthly Revenue High ($)', 'Profile URL']);
        for (const c of creators) {
          const { current: curr, previous: prev, weekAgo } = creatorStats[c.id] || {};
          const oneDaySubs = curr && prev ? fmtDelta((curr.subscribers || 0) - (prev.subscribers || 0)) : '';
          const sevenDaySubs = curr && weekAgo && weekAgo !== curr ? fmtDelta((curr.subscribers || 0) - (weekAgo.subscribers || 0)) : '';
          const dailyViews = curr && prev ? (curr.total_views || 0) - (prev.total_views || 0) : null;
          const moLow = dailyViews != null && dailyViews > 0 ? (dailyViews * 30 * 2 / 1000).toFixed(0) : '';
          const moHigh = dailyViews != null && dailyViews > 0 ? (dailyViews * 30 * 7 / 1000).toFixed(0) : '';
          lines.push([
            c.display_name || c.username, c.username,
            curr?.subscribers ?? '',
            oneDaySubs, sevenDaySubs,
            curr?.total_views ?? '',
            dailyViews !== null ? fmtDelta(dailyViews) : '',
            curr?.total_posts ?? '',
            moLow, moHigh,
            `https://shinypull.com/youtube/${c.username}`,
          ]);
        }
      } else if (platform === 'tiktok') {
        lines.push(['Name', 'Username', 'Followers', '1-Day Change', '7-Day Change', 'Total Likes', '1-Day Likes', 'Videos', 'Profile URL']);
        for (const c of creators) {
          const { current: curr, previous: prev, weekAgo } = creatorStats[c.id] || {};
          const fol = (s) => s?.followers ?? s?.subscribers ?? 0;
          lines.push([
            c.display_name || c.username, c.username,
            fol(curr) || '',
            curr && prev ? fmtDelta(fol(curr) - fol(prev)) : '',
            curr && weekAgo && weekAgo !== curr ? fmtDelta(fol(curr) - fol(weekAgo)) : '',
            curr?.total_views ?? '',
            curr && prev ? fmtDelta((curr.total_views || 0) - (prev.total_views || 0)) : '',
            curr?.total_posts ?? '',
            `https://shinypull.com/tiktok/${c.username}`,
          ]);
        }
      } else if (platform === 'twitch') {
        lines.push(['Name', 'Username', 'Followers', '1-Day Change', '7-Day Change', 'Hours Watched (Daily)', 'Peak Viewers', 'Avg Viewers', 'Profile URL']);
        for (const c of creators) {
          const { current: curr, previous: prev, weekAgo } = creatorStats[c.id] || {};
          const fol = (s) => s?.followers ?? s?.subscribers ?? 0;
          lines.push([
            c.display_name || c.username, c.username,
            fol(curr) || '',
            curr && prev ? fmtDelta(fol(curr) - fol(prev)) : '',
            curr && weekAgo && weekAgo !== curr ? fmtDelta(fol(curr) - fol(weekAgo)) : '',
            curr?.hours_watched_day ?? '',
            curr?.peak_viewers_day ?? '',
            curr?.avg_viewers_day ?? '',
            `https://shinypull.com/twitch/${c.username}`,
          ]);
        }
      } else if (platform === 'kick') {
        lines.push(['Name', 'Username', 'Paid Subscribers', '1-Day Change', '7-Day Change', 'Hours Watched (Daily)', 'Peak Viewers', 'Avg Viewers', 'Profile URL']);
        for (const c of creators) {
          const { current: curr, previous: prev, weekAgo } = creatorStats[c.id] || {};
          const subs = (s) => s?.subscribers ?? 0;
          lines.push([
            c.display_name || c.username, c.username,
            subs(curr) || '',
            curr && prev ? fmtDelta(subs(curr) - subs(prev)) : '',
            curr && weekAgo && weekAgo !== curr ? fmtDelta(subs(curr) - subs(weekAgo)) : '',
            curr?.hours_watched_day ?? '',
            curr?.peak_viewers_day ?? '',
            curr?.avg_viewers_day ?? '',
            `https://shinypull.com/kick/${c.username}`,
          ]);
        }
      } else if (platform === 'bluesky') {
        lines.push(['Name', 'Username', 'Followers', '1-Day Change', '7-Day Change', 'Posts', 'Profile URL']);
        for (const c of creators) {
          const { current: curr, previous: prev, weekAgo } = creatorStats[c.id] || {};
          const fol = (s) => s?.followers ?? s?.subscribers ?? 0;
          lines.push([
            c.display_name || c.username, c.username,
            fol(curr) || '',
            curr && prev ? fmtDelta(fol(curr) - fol(prev)) : '',
            curr && weekAgo && weekAgo !== curr ? fmtDelta(fol(curr) - fol(weekAgo)) : '',
            curr?.total_posts ?? '',
            `https://shinypull.com/bluesky/${c.username}`,
          ]);
        }
      }

      lines.push([]); // blank row between platform sections
    }

    const csvStr = '\uFEFF' + lines.map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shinypull-creator-report-${exportDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const liveCount = followedCreators.filter(c =>
    (c.platform === 'twitch' || c.platform === 'kick') && liveStreamers.has(c.username.toLowerCase())
  ).length;

  const platformCounts = {
    youtube: followedCreators.filter(c => c.platform === 'youtube').length,
    tiktok:  followedCreators.filter(c => c.platform === 'tiktok').length,
    twitch:  followedCreators.filter(c => c.platform === 'twitch').length,
    kick:    followedCreators.filter(c => c.platform === 'kick').length,
    bluesky: followedCreators.filter(c => c.platform === 'bluesky').length,
  };

  const filteredCreators = selectedPlatform === 'all'
    ? followedCreators
    : selectedPlatform === 'live'
    ? followedCreators.filter(c => (c.platform === 'twitch' || c.platform === 'kick') && liveStreamers.has(c.username.toLowerCase()))
    : followedCreators.filter(c => c.platform === selectedPlatform);

  const tabs = [
    { id: 'following', label: 'Following', count: followedCreators.length },
    { id: 'compares', label: 'Saved Compares', count: savedCompares.length },
    { id: 'recent', label: 'Recently Viewed', count: recentlyViewed.length },
  ];

  return (
    <>
      <SEO
        title="My Dashboard"
        description="Track your favorite creators and see their latest statistics."
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">

        {/* Page Header */}
        <div className="relative overflow-hidden border-b border-gray-800/60">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-extrabold text-gray-100 mb-1">
              Welcome back, {displayName}
            </h1>
            <p className="text-gray-400 text-sm">Your creator tracking hub.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* Tab Bar */}
          <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── FOLLOWING TAB ── */}
          {activeTab === 'following' && (
            <div>
              {/* Platform Filter Chips + Bulk Export */}
              {followedCreators.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {tier === 'mod' ? (
                    <button
                      onClick={handleBulkExport}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/40 hover:bg-amber-950/60 text-amber-400 border border-amber-800/60 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export All CSV
                    </button>
                  ) : (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('openUpgradePanel', { detail: { feature: 'export' } }))}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-pointer hover:text-gray-500 transition-colors"
                      title="Bulk CSV export requires Mod plan"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Export All CSV
                    </button>
                  )}
                </div>
              )}
              {followedCreators.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  <FilterChip
                    active={selectedPlatform === 'all'}
                    onClick={() => setSelectedPlatform('all')}
                    label="All"
                    count={followedCreators.length}
                  />
                  {(['youtube', 'tiktok', 'twitch', 'kick', 'bluesky']).map(p => {
                    if (!platformCounts[p]) return null;
                    const Icon = platformIcons[p];
                    return (
                      <FilterChip
                        key={p}
                        active={selectedPlatform === p}
                        onClick={() => setSelectedPlatform(p)}
                        label={PLATFORM_LABELS[p]}
                        count={platformCounts[p]}
                        platform={p}
                        icon={<Icon className={`w-3.5 h-3.5 ${selectedPlatform === p ? 'text-white' : platformColors[p].text}`} />}
                      />
                    );
                  })}
                  {liveCount > 0 && (
                    <FilterChip
                      active={selectedPlatform === 'live'}
                      onClick={() => setSelectedPlatform('live')}
                      label="Live Now"
                      count={liveCount}
                      icon={<span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                      live
                    />
                  )}
                </div>
              )}

              {/* Compare mode bar */}
              {!loadingCreators && followedCreators.length >= 2 && (
                <div className="flex items-center gap-3 mb-4">
                  {!compareMode ? (
                    <button
                      onClick={() => setCompareMode(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-gray-100 text-sm font-medium rounded-xl transition-colors"
                    >
                      <Scale className="w-4 h-4" />
                      Compare
                    </button>
                  ) : (
                    <>
                      <span className="text-sm text-gray-400">
                        Select 2-3 creators ({selectedForCompare.length}/3)
                      </span>
                      <Link
                        to={`/compare?creators=${selectedForCompare.map(id => {
                          const c = followedCreators.find(fc => fc.id === id);
                          return c ? `${c.platform}:${c.username}` : '';
                        }).filter(Boolean).join(',')}`}
                        onClick={() => { setCompareMode(false); setSelectedForCompare([]); }}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                          selectedForCompare.length >= 2
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none'
                        }`}
                      >
                        <Scale className="w-4 h-4" />
                        Compare Selected
                      </Link>
                      <button
                        onClick={() => { setCompareMode(false); setSelectedForCompare([]); }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-400 hover:text-gray-200 text-sm rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Creator List */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                {loadingCreators ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                  </div>
                ) : filteredCreators.length === 0 ? (
                  <div className="text-center p-12">
                    {selectedPlatform === 'all' ? (
                      <>
                        <Star className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-100 font-semibold mb-1">No creators followed yet</p>
                        <p className="text-gray-400 text-sm mb-5">Find creators to follow and track their growth.</p>
                        <Link
                          to="/search"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors text-sm"
                        >
                          Find Creators
                        </Link>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        {selectedPlatform === 'live' ? 'No one is live right now.' : `No ${PLATFORM_LABELS[selectedPlatform]} creators followed.`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {filteredCreators.map(creator => {
                      const PlatformIcon = platformIcons[creator.platform] || Users;
                      const colors = platformColors[creator.platform] || { light: 'bg-gray-800/50', text: 'text-gray-400' };
                      const stats = creatorStats[creator.id];
                      const isLive = (creator.platform === 'twitch' || creator.platform === 'kick') && liveStreamers.has(creator.username.toLowerCase());
                      const growth = getGrowth(creator.id, creator.platform === 'youtube' ? 'subscribers' : 'followers');
                      const isSelected = selectedForCompare.includes(creator.id);

                      const rowContent = (
                        <div className="flex items-center gap-4 px-4 py-3.5">
                          {compareMode && (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600 hover:border-indigo-400'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          )}
                          <div className="relative">
                            <img
                              src={creator.profile_image || '/placeholder-avatar.svg'}
                              alt={creator.display_name}
                              loading="lazy"
                              className="w-11 h-11 rounded-xl object-cover"
                            />
                            {isLive && (
                              <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded uppercase">
                                Live
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`p-1 rounded ${colors.light}`}>
                                <PlatformIcon className={`w-3 h-3 ${colors.text}`} />
                              </span>
                              <p className="font-semibold text-gray-100 truncate text-sm">{creator.display_name}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">@{creator.username}</p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-100">
                              {stats?.current ? formatNumber(stats.current.subscribers || stats.current.followers) : '–'}
                            </p>
                            {growth !== null && growth !== 0 ? (
                              <span className={`flex items-center justify-end text-xs font-medium ${growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {growth > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                {growth > 0 ? '+' : ''}{formatNumber(growth)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">
                                {creator.platform === 'youtube' ? 'subs' : 'followers'}
                              </span>
                            )}
                          </div>
                          {!compareMode && <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                        </div>
                      );

                      return compareMode ? (
                        <button
                          key={creator.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedForCompare(prev => prev.filter(id => id !== creator.id));
                            } else if (selectedForCompare.length < 3) {
                              setSelectedForCompare(prev => [...prev, creator.id]);
                            }
                          }}
                          className={`w-full text-left transition-colors ${isSelected ? 'bg-indigo-950/30' : 'hover:bg-gray-800/40'} ${selectedForCompare.length >= 3 && !isSelected ? 'opacity-40' : ''}`}
                        >
                          {rowContent}
                        </button>
                      ) : (
                        <Link
                          key={creator.id}
                          to={`/${creator.platform}/${creator.username}`}
                          className="block hover:bg-gray-800/40 transition-colors"
                        >
                          {rowContent}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SAVED COMPARES TAB ── */}
          {activeTab === 'compares' && (
            <div>
              {loadingCompares ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                </div>
              ) : savedCompares.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
                  <Scale className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-100 font-semibold mb-1">No saved comparisons</p>
                  <p className="text-gray-400 text-sm mb-5">Head to the Compare page, set up a comparison, and hit "Save comparison".</p>
                  <Link
                    to="/compare"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors text-sm"
                  >
                    <Scale className="w-4 h-4" />
                    Go to Compare
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCompares.map(compare => {
                    const entries = compare.creators_param.split(',').map(e => {
                      const [platform, username] = e.split(':');
                      return { platform, username };
                    });
                    return (
                      <div key={compare.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-100 text-sm leading-snug">{compare.name}</p>
                          <button
                            onClick={() => handleDeleteCompare(compare.id)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950/20 transition-colors flex-shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Creator pills */}
                        <div className="flex flex-wrap gap-2">
                          {entries.map((e, i) => {
                            const Icon = platformIcons[e.platform];
                            const colors = platformColors[e.platform] || { light: 'bg-gray-800', text: 'text-gray-400' };
                            return (
                              <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${colors.light} ${colors.text}`}>
                                {Icon && <Icon className="w-3 h-3" />}
                                {e.username}
                              </span>
                            );
                          })}
                        </div>

                        <Link
                          to={`/compare?creators=${compare.creators_param}`}
                          className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Comparison
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── RECENTLY VIEWED TAB ── */}
          {activeTab === 'recent' && (
            <div>
              {recentlyViewed.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
                  <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-100 font-semibold mb-1">Nothing here yet</p>
                  <p className="text-gray-400 text-sm">Creators you visit will show up here.</p>
                </div>
              ) : (
                <>
                  {recentlyViewed.length > 4 && (
                    <div className="flex items-center gap-2 mb-4 justify-end">
                      <button
                        onClick={() => setRecentlyViewedIndex(Math.max(0, recentlyViewedIndex - 8))}
                        disabled={recentlyViewedIndex === 0}
                        className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-500">{Math.floor(recentlyViewedIndex / 8) + 1} / {Math.ceil(recentlyViewed.length / 8)}</span>
                      <button
                        onClick={() => setRecentlyViewedIndex(Math.min(recentlyViewed.length - 8, recentlyViewedIndex + 8))}
                        disabled={recentlyViewedIndex >= recentlyViewed.length - 8}
                        className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {recentlyViewed.slice(recentlyViewedIndex, recentlyViewedIndex + 8).map((creator, idx) => {
                      const PlatformIcon = platformIcons[creator.platform] || Users;
                      const colors = platformColors[creator.platform] || { light: 'bg-gray-800/50', text: 'text-gray-400' };
                      return (
                        <Link
                          key={`${creator.platform}-${creator.username}-${idx}`}
                          to={`/${creator.platform}/${creator.username}`}
                          className="bg-gray-900 rounded-2xl border border-gray-800 p-4 hover:border-indigo-700/50 hover:bg-gray-800/50 transition-all group"
                        >
                          <img
                            src={creator.profileImage || '/placeholder-avatar.svg'}
                            alt={creator.displayName}
                            loading="lazy"
                            className="w-14 h-14 rounded-xl object-cover mx-auto mb-3"
                          />
                          <div className="text-center">
                            <p className="font-semibold text-gray-100 text-sm truncate">{creator.displayName}</p>
                            <div className="flex items-center justify-center gap-1.5 mt-1.5">
                              <span className={`p-0.5 rounded ${colors.light}`}>
                                <PlatformIcon className={`w-3 h-3 ${colors.text}`} />
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatNumber(creator.subscribers || creator.followers || 0)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const CHIP_ACTIVE_STYLES = {
  youtube: 'bg-red-600 border-red-600 text-white shadow-lg',
  tiktok: 'bg-pink-600 border-pink-600 text-white shadow-lg',
  twitch: 'bg-purple-600 border-purple-600 text-white shadow-lg',
  kick: 'bg-green-600 border-green-600 text-white shadow-lg',
  bluesky: 'bg-sky-500 border-sky-500 text-white shadow-lg',
};

function FilterChip({ active, onClick, label, count, icon, live, platform }) {
  const activeClass = live
    ? 'bg-red-950/40 border-red-700 text-red-400'
    : platform && CHIP_ACTIVE_STYLES[platform]
      ? CHIP_ACTIVE_STYLES[platform]
      : 'bg-indigo-600 border-indigo-600 text-white shadow-lg';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
        active
          ? activeClass
          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
      }`}
    >
      {icon}
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
        active
          ? live ? 'bg-red-900/50 text-red-300' : 'bg-white/20 text-white'
          : 'bg-gray-700 text-gray-400'
      }`}>
        {count}
      </span>
    </button>
  );
}
