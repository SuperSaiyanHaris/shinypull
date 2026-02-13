import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, X, Plus, Youtube, Twitch, Users, Eye, Video, TrendingUp, ArrowRight, Scale, Loader2 } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import InstagramIcon from '../components/InstagramIcon';
import TikTokIcon from '../components/TikTokIcon';
import { CompareCardSkeleton } from '../components/Skeleton';
import { searchChannels as searchYouTube, getChannelByUsername as getYouTubeChannel } from '../services/youtubeService';
import { searchChannels as searchTwitch, getChannelByUsername as getTwitchChannel } from '../services/twitchService';
import { searchChannels as searchKick, getChannelByUsername as getKickChannel } from '../services/kickService';
import { searchCreators, getCreatorByUsername } from '../services/creatorService';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { analytics } from '../lib/analytics';
import { formatNumber } from '../lib/utils';
import logger from '../lib/logger';

const platformConfig = {
  youtube: { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  instagram: { icon: InstagramIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  tiktok: { icon: TikTokIcon, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  twitch: { icon: Twitch, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  kick: { icon: KickIcon, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
};

export default function Compare() {
  const [creators, setCreators] = useState([null, null]);
  const [loadingFromUrl, setLoadingFromUrl] = useState(false);
  const location = useLocation();

  // Parse ?creators=platform:username,platform:username from URL
  useEffect(() => {
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
            } else if (platform === 'instagram') {
              const result = await getCreatorByUsername('instagram', username);
              if (!result) return null;
              // Transform to expected format
              return {
                platform: 'instagram',
                platformId: result.platform_id,
                username: result.username,
                displayName: result.display_name || result.username,
                profileImage: result.profile_image,
                description: result.description,
                subscribers: result.latest_stats?.followers || 0,
                totalPosts: result.latest_stats?.total_posts || 0,
              };
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
    }
  };

  const filledCreators = creators.filter(Boolean);

  return (
    <>
      <SEO
        title="Compare Creators"
        description="Compare YouTube, Instagram, TikTok, Twitch, and Kick creators side-by-side. See subscriber counts, follower counts, views, and growth metrics."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header - Dark */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            <div className="absolute top-0 left-1/3 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Compare Creators</h1>
              </div>
              <p className="text-base sm:text-lg text-slate-400">
                Side-by-side comparison of YouTube, Instagram, TikTok, Twitch, and Kick channels
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
                className="min-h-[280px] border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
              >
                <Plus className="w-8 h-8" />
              </button>
            )}
          </div>
          )}

          {/* Comparison Section */}
          {!loadingFromUrl && filledCreators.length >= 2 && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-6 py-4 text-left font-semibold text-gray-600">Metric</th>
                        {filledCreators.map((creator) => (
                          <th key={creator.platformId} className="px-6 py-4 text-center font-semibold text-gray-900">
                            <div className="flex items-center justify-center gap-2">
                              <img src={creator.profileImage} alt="" className="w-6 h-6 rounded-lg" />
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
                        values={filledCreators.map(c => formatNumber(c.subscribers || c.followers))}
                        highlight={getWinner(filledCreators.map(c => c.subscribers || c.followers))}
                      />
                      <ComparisonRow
                        label="Total Views"
                        icon={Eye}
                        values={filledCreators.map(c => formatNumber(c.totalViews))}
                        highlight={getWinner(filledCreators.map(c => c.totalViews))}
                      />
                      <ComparisonRow
                        label="Videos / Content"
                        icon={Video}
                        values={filledCreators.map(c => c.platform === 'twitch' ? (c.category || '-') : formatNumber(c.totalPosts))}
                        highlight={filledCreators.every(c => c.platform !== 'twitch') ? getWinner(filledCreators.map(c => c.totalPosts)) : null}
                      />
                      <ComparisonRow
                        label="Avg Views per Video"
                        icon={TrendingUp}
                        values={filledCreators.map(c =>
                          c.platform === 'twitch' ? '-' :
                          c.totalPosts > 0 ? formatNumber(Math.round(c.totalViews / c.totalPosts)) : '-'
                        )}
                        highlight={filledCreators.every(c => c.platform !== 'twitch') ?
                          getWinner(filledCreators.map(c => c.totalPosts > 0 ? c.totalViews / c.totalPosts : 0)) : null}
                      />
                    </tbody>
                  </table>
                </div>

                {/* View Full Profiles - Desktop */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {filledCreators.map((creator) => (
                      <Link
                        key={creator.platformId}
                        to={`/${creator.platform}/${creator.username}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      >
                        View {creator.displayName}'s profile
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Stat-by-Stat View */}
              <div className="md:hidden space-y-3">
                <MobileComparisonCard
                  label="Subscribers / Followers"
                  icon={Users}
                  creators={filledCreators}
                  getValue={(c) => c.subscribers || c.followers}
                  formatValue={(v) => formatNumber(v)}
                />
                <MobileComparisonCard
                  label="Total Views"
                  icon={Eye}
                  creators={filledCreators}
                  getValue={(c) => c.totalViews}
                  formatValue={(v) => formatNumber(v)}
                />
                <MobileComparisonCard
                  label="Videos"
                  icon={Video}
                  creators={filledCreators.filter(c => c.platform !== 'twitch')}
                  getValue={(c) => c.totalPosts}
                  formatValue={(v) => formatNumber(v)}
                  hideIfEmpty
                />
                <MobileComparisonCard
                  label="Avg Views per Video"
                  icon={TrendingUp}
                  creators={filledCreators.filter(c => c.platform !== 'twitch')}
                  getValue={(c) => c.totalPosts > 0 ? c.totalViews / c.totalPosts : 0}
                  formatValue={(v) => formatNumber(Math.round(v))}
                  hideIfEmpty
                />

                {/* View Full Profiles - Mobile */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-sm font-medium text-gray-500 mb-3">View Profiles</p>
                  <div className="space-y-2">
                    {filledCreators.map((creator) => (
                      <Link
                        key={creator.platformId}
                        to={`/${creator.platform}/${creator.username}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <img src={creator.profileImage} alt="" className="w-8 h-8 rounded-lg" />
                        <span className="flex-1 font-medium text-gray-900 truncate">{creator.displayName}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {!loadingFromUrl && filledCreators.length < 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select at least 2 creators</h3>
              <p className="text-gray-500">Search for creators in the slots above to start comparing</p>
            </div>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative group">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
          <p className="font-bold text-gray-900 truncate">{creator.displayName}</p>
          <p className="text-sm text-gray-500 truncate">@{creator.username}</p>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-xs ${config.bg} ${config.color}`}>
            <Icon className="w-3 h-3" />
            {creator.platform}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">{creator.platform === 'twitch' || creator.platform === 'instagram' || creator.platform === 'tiktok' ? 'Followers' : 'Subs'}</p>
          <p className="font-bold text-gray-900">{formatNumber(creator.subscribers || creator.followers)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">{creator.platform === 'tiktok' ? 'Likes' : creator.platform === 'instagram' ? 'Posts' : 'Views'}</p>
          <p className="font-bold text-gray-900">{formatNumber(creator.platform === 'instagram' ? creator.totalPosts : creator.totalViews)}</p>
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
      } else if (searchPlatform === 'instagram') {
        // Search Instagram from database
        const dbResults = await searchCreators(searchQuery, 'instagram');

        // Fetch stats for each creator
        const withStats = await Promise.all(
          dbResults.map(async (creator) => {
            const { data: stats } = await supabase
              .from('creator_stats')
              .select('followers, total_posts')
              .eq('creator_id', creator.id)
              .order('recorded_at', { ascending: false })
              .limit(1)
              .single();

            return {
              platform: 'instagram',
              platformId: creator.platform_id,
              username: creator.username,
              displayName: creator.display_name || creator.username,
              profileImage: creator.profile_image,
              description: creator.description,
              subscribers: stats?.followers || 0,
              totalPosts: stats?.total_posts || 0,
            };
          })
        );

        results = withStats.slice(0, 5);
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 min-h-[280px] flex flex-col relative">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <select
            value={searchPlatform}
            onChange={(e) => setSearchPlatform(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="twitch">Twitch</option>
            <option value="kick">Kick</option>
          </select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creator..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
                className="w-full flex items-center gap-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <img
                  src={result.profileImage}
                  alt={result.displayName}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{result.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">
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
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Search className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Search for a creator</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonRow({ label, icon: Icon, values, highlight }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-gray-600 font-medium">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {label}
        </div>
      </td>
      {values.map((value, index) => (
        <td
          key={index}
          className={`px-6 py-4 text-center font-semibold ${
            highlight === index ? 'text-emerald-600 bg-emerald-50' : 'text-gray-900'
          }`}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

function MobileComparisonCard({ label, icon: Icon, creators, getValue, formatValue, hideIfEmpty }) {
  if (hideIfEmpty && creators.length === 0) return null;

  const values = creators.map(getValue);
  const winner = getWinner(values);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className="space-y-2">
        {creators.map((creator, index) => {
          const isWinner = winner === index;
          const value = getValue(creator);
          return (
            <div
              key={creator.platformId}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isWinner ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-gray-50'
              }`}
            >
              <img
                src={creator.profileImage}
                alt={creator.displayName}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="flex-1 font-medium text-gray-900 truncate text-sm">
                {creator.displayName}
              </span>
              <span className={`font-bold ${isWinner ? 'text-emerald-600' : 'text-gray-900'}`}>
                {formatValue(value)}
              </span>
              {isWinner && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
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

