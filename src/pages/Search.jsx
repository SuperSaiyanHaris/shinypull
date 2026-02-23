import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Youtube, Twitch, User, AlertCircle, ArrowRight, Clock, CheckCircle, X } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import { CreatorRowSkeleton } from '../components/Skeleton';
import FunErrorState from '../components/FunErrorState';
import { searchChannels as searchYouTube } from '../services/youtubeService';
import { searchChannels as searchTwitch } from '../services/twitchService';
import { searchChannels as searchKick } from '../services/kickService';
import { searchBluesky } from '../services/blueskyService';
import { upsertCreator, saveCreatorStats, searchCreators } from '../services/creatorService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import { analytics } from '../lib/analytics';
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
  youtube: { bg: 'bg-red-600', light: 'bg-red-950/30', text: 'text-red-400' },
  tiktok: { bg: 'bg-pink-600', light: 'bg-pink-950/30', text: 'text-pink-400' },
  twitch: { bg: 'bg-purple-600', light: 'bg-purple-950/30', text: 'text-purple-400' },
  kick: { bg: 'bg-green-600', light: 'bg-green-950/30', text: 'text-green-400' },
  bluesky: { bg: 'bg-sky-500', light: 'bg-sky-950/30', text: 'text-sky-400' },
  instagram: { bg: 'bg-pink-600', light: 'bg-pink-950/30', text: 'text-pink-400' },
};

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, available: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, available: true },
  { id: 'kick', name: 'Kick', icon: KickIcon, available: true },
  { id: 'bluesky', name: 'Bluesky', icon: BlueskyIcon, available: true },
];

// TikTok search function - searches database
async function searchTikTok(query, limit = 25) {
  const results = await searchCreators(query, 'tiktok');

  const withStats = await Promise.all(
    results.map(async (creator) => {
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
        followers: stats?.followers || 0,
        totalLikes: stats?.total_views || 0,
        totalPosts: stats?.total_posts || 0,
      };
    })
  );

  return withStats.slice(0, limit);
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const validPlatforms = ['youtube', 'tiktok', 'twitch', 'kick', 'bluesky', 'instagram'];
  const initialPlatform = validPlatforms.includes(searchParams.get('platform')) ? searchParams.get('platform') : 'youtube';
  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatform);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // null, 'requesting', 'success', 'error'
  const [requestMessage, setRequestMessage] = useState('');
  const [normalizedUsername, setNormalizedUsername] = useState('');
  const { user } = useAuth();

  // Normalize a display name / search query to a likely TikTok username
  const normalizeToUsername = (input) => {
    return input
      .trim()
      .toLowerCase()
      .replace(/^@/, '')             // strip leading @
      .replace(/[^a-z0-9._]/g, '')   // remove everything except allowed chars
      .replace(/^\.+|\.+$/g, '')     // trim leading/trailing dots
      .slice(0, 30);                 // max 30 chars
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams, selectedPlatform]);

  const handlePlatformChange = (platformId) => {
    setSelectedPlatform(platformId);
    setResults([]);
    setSearched(false);
    // Clear request status when switching platforms
    setRequestStatus(null);
    setRequestMessage('');
    // Always write platform to URL so back-button restores it correctly
    const q = query.trim() || searchParams.get('q') || '';
    const newParams = { platform: platformId };
    if (q) newParams.q = q;
    setSearchParams(newParams);
  };

  const performSearch = async (searchQuery, platform = selectedPlatform) => {
    if (!searchQuery.trim()) return;

    // Track search
    analytics.search(searchQuery);

    setLoading(true);
    setError(null);
    setSearched(true);
    // Clear request status when searching for a new creator
    setRequestStatus(null);
    setRequestMessage('');

    try {
      let channels = [];
      if (platform === 'youtube') {
        channels = await searchYouTube(searchQuery, 25);
        if (channels.length > 0) {
          void persistYouTubeResults(channels);
        }
      } else if (platform === 'tiktok') {
        // Search TikTok creators from database
        channels = await searchTikTok(searchQuery, 25);
      } else if (platform === 'twitch') {
        channels = await searchTwitch(searchQuery, 25);
      } else if (platform === 'kick') {
        channels = await searchKick(searchQuery, 25);
      } else if (platform === 'bluesky') {
        channels = await searchBluesky(searchQuery, 25);
      }
      channels.sort((a, b) => (b.subscribers || b.followers || 0) - (a.subscribers || a.followers || 0));
      setResults(channels);
      // Pre-fill normalized username for TikTok request flow
      if (platform === 'tiktok') {
        setNormalizedUsername(normalizeToUsername(searchQuery));
      }
    } catch (err) {
      logger.error('Search error:', err);
      setError(err.message || 'Failed to search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim(), platform: selectedPlatform });
    }
  };

  const persistYouTubeResults = async (channels) => {
    for (const channel of channels) {
      try {
        const dbCreator = await upsertCreator(channel);
        await saveCreatorStats(dbCreator.id, {
          subscribers: channel.subscribers || channel.followers,
          totalViews: channel.totalViews,
          totalPosts: channel.totalPosts,
        });
      } catch (dbErr) {
        logger.warn('Failed to persist creator:', dbErr);
      }
    }
  };

  const handleRequestCreator = async (usernameOverride) => {
    const username = usernameOverride || normalizedUsername;
    if (!username) return;

    setRequestStatus('requesting');
    setRequestMessage('');

    try {
      const response = await fetch('/api/request-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          username,
          userId: user?.id || null,
        }),
      });

      const data = await response.json();

      if (data.success || data.exists) {
        setRequestStatus('success');
        setRequestMessage(data.message);
        // Track request event
        analytics.event('request_creator', {
          platform: selectedPlatform,
          username: query.trim(),
        });
      } else {
        setRequestStatus('error');
        setRequestMessage(data.error || 'Failed to submit request');
      }
    } catch (err) {
      logger.error('Request creator error:', err);
      setRequestStatus('error');
      setRequestMessage('Failed to submit request. Please try again.');
    }
  };

  const currentPlatform = platforms.find(p => p.id === selectedPlatform);

  return (
    <>
      <SEO
        title="Search Creators"
        description="Search for social media creators to view their statistics and analytics."
      />

      <div className="min-h-screen bg-gray-800/50">
        {/* Header - Light */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-100">Search Creators</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-300">Find any creator and view their detailed statistics</p>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Platform Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatform === platform.id;
              const colors = platformColors[platform.id];

              return (
                <button
                  key={platform.id}
                  onClick={() => platform.available && handlePlatformChange(platform.id)}
                  disabled={!platform.available}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
                    isSelected
                      ? `${colors.bg} text-white shadow-lg`
                      : platform.available
                      ? 'bg-gray-900 text-gray-300 border border-gray-700 hover:border-gray-600 hover:shadow-md'
                      : 'bg-gray-800 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span className="whitespace-nowrap">{platform.name}</span>
                  {!platform.available && <span className="text-xs opacity-75">(Soon)</span>}
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mb-8 max-w-2xl mx-auto">
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-15 group-focus-within:opacity-25 blur-xl transition duration-300"></div>
                  <div className="relative flex items-center bg-gray-900 rounded-2xl shadow-lg border-2 border-gray-800 group-focus-within:border-indigo-500 transition-colors">
                  <SearchIcon className="absolute left-5 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${currentPlatform?.name || ''} creators...`}
                    className="w-full pl-14 pr-12 py-4 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-lg rounded-2xl font-medium"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto sm:block px-8 py-4 text-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Error State - Fun Version */}
          {error && (
            <FunErrorState
              type={error.includes('fetch') ? 'server' : 'network'}
              message={error}
              onRetry={() => window.location.reload()}
              retryText="Reload Page"
            />
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              <div className="text-center mb-6">
                <p className="text-gray-300">Searching {currentPlatform?.name}...</p>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <CreatorRowSkeleton key={i} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && searched && !error && results.length === 0 && (
            <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">No creators found</h3>
              <p className="text-gray-300 mb-4">
                We couldn't find any {currentPlatform?.name} creators matching "{query}"
              </p>

              {/* TikTok: Request Creator Button */}
              {selectedPlatform === 'tiktok' && (
                <>
                  {requestStatus === null && (
                    <div className="mt-6 max-w-md mx-auto px-4">
                      <p className="text-sm text-gray-300 mb-3">
                        If you know the exact handle, enter it below — otherwise leave as-is and our smart search will find the right match.
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-gray-300 text-lg font-medium">@</span>
                        <input
                          type="text"
                          value={normalizedUsername}
                          onChange={(e) => setNormalizedUsername(normalizeToUsername(e.target.value))}
                          placeholder="e.g. charlidamelio"
                          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => handleRequestCreator()}
                        disabled={!normalizedUsername}
                        className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500"
                      >
                        <Clock className="w-5 h-5" />
                        Request @{normalizedUsername || '...'}
                      </button>
                      <p className="text-xs text-gray-300 mt-3">
                        We'll add them within 24 hours
                      </p>
                    </div>
                  )}

                  {requestStatus === 'requesting' && (
                    <div className="mt-6 max-w-md mx-auto p-4 bg-indigo-950/50 border border-indigo-800 rounded-xl">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-indigo-300 font-medium">Submitting request...</p>
                    </div>
                  )}

                  {requestStatus === 'success' && (
                    <div className="mt-6 max-w-md mx-auto p-4 bg-green-950/30 border border-green-200 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-800 font-medium mb-1">Request Submitted!</p>
                      <p className="text-sm text-green-700">{requestMessage}</p>
                    </div>
                  )}

                  {requestStatus === 'error' && (
                    <div className="mt-6 max-w-md mx-auto p-4 bg-red-950/30 border border-red-800 rounded-xl">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-800 font-medium mb-1">Request Failed</p>
                      <p className="text-sm text-red-700">{requestMessage}</p>
                      <button
                        onClick={() => handleRequestCreator()}
                        className="mt-3 text-sm text-red-700 hover:text-red-800 font-medium underline"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Standard platforms: Standard message */}
              {selectedPlatform !== 'tiktok' && (
                <p className="text-sm text-gray-300">
                  Try searching for a different name or check the spelling
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="mb-8">
              <p className="text-gray-300 mb-4">{results.length} creators found</p>
              <div className="space-y-3">
                {results.map((creator) => {
                  const Icon = platformIcons[creator.platform] || User;
                  const colors = platformColors[creator.platform];

                  return (
                    <Link
                      key={creator.platformId}
                      to={`/${creator.platform}/${creator.username}`}
                      state={{ platformId: creator.platformId }}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:shadow-lg hover:border-gray-700 transition-all duration-200 group"
                    >
                      <img
                        src={creator.profileImage || '/placeholder-avatar.svg'}
                        alt={creator.displayName}
                        loading="lazy"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover bg-gray-800 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = '/placeholder-avatar.svg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-100 truncate group-hover:text-indigo-400 transition-colors">
                            {creator.displayName}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${colors.bg} text-white`}>
                            <Icon className="w-3 h-3" />
                            {creator.platform}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-300 truncate">@{creator.username}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-100 text-base sm:text-lg">{formatNumber(creator.subscribers || creator.followers)}</p>
                        <p className="text-xs sm:text-sm text-gray-300">
                          {creator.platform === 'twitch' || creator.platform === 'tiktok' || creator.platform === 'bluesky' ? 'followers' :
                           creator.platform === 'kick' ? 'paid subs' : 'subscribers'}
                        </p>
                      </div>
                      <ArrowRight className="hidden sm:block w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* TikTok: Request Creator (when no exact username match) */}
          {selectedPlatform === 'tiktok' && searched && results.length > 0 && query && (
            (() => {
              // Check if any result has exact username match
              const hasExactMatch = results.some(r => r.username.toLowerCase() === query.toLowerCase());

              if (!hasExactMatch) {
                return (
                  <div className="text-center py-8 bg-gray-900 rounded-2xl border border-gray-800">
                    <div className="max-w-md mx-auto">
                      <p className="text-sm text-gray-300 mb-4">
                        Can't find "@{query}"? TikTok creators are added by request.
                      </p>

                      {requestStatus === null && (
                        <>
                          <p className="text-sm text-gray-300 mb-3">
                            If you know the exact handle, enter it below — otherwise leave as-is and our smart search will find the right match.
                          </p>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-gray-300 text-lg font-medium">@</span>
                            <input
                              type="text"
                              value={normalizedUsername}
                              onChange={(e) => setNormalizedUsername(normalizeToUsername(e.target.value))}
                              placeholder="e.g. charlidamelio"
                              className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            onClick={() => handleRequestCreator()}
                            disabled={!normalizedUsername}
                            className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500"
                          >
                            <Clock className="w-5 h-5" />
                            Request @{normalizedUsername || '...'}
                          </button>
                          <p className="text-xs text-gray-300 mt-3">
                            We'll add them within 24 hours
                          </p>
                        </>
                      )}

                      {requestStatus === 'requesting' && (
                        <div className="p-4 bg-indigo-950/50 border border-indigo-800 rounded-xl">
                          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-indigo-300 font-medium">Submitting request...</p>
                        </div>
                      )}

                      {requestStatus === 'success' && (
                        <div className="p-4 bg-green-950/30 border border-green-800/50 rounded-xl">
                          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-sm text-green-300 font-medium mb-1">Request Submitted!</p>
                          <p className="text-sm text-green-400">{requestMessage}</p>
                        </div>
                      )}

                      {requestStatus === 'error' && (
                        <div className="p-4 bg-red-950/30 border border-red-800 rounded-xl">
                          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-red-300 font-medium mb-1">Request Failed</p>
                          <p className="text-sm text-red-400">{requestMessage}</p>
                          <button
                            onClick={() => handleRequestCreator()}
                            className="mt-3 text-sm text-red-400 hover:text-red-300 font-medium underline"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()
          )}
        </div>
      </div>
    </>
  );
}

