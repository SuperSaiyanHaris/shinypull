import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Youtube, Twitch, User, AlertCircle, ArrowRight } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import { CreatorRowSkeleton } from '../components/Skeleton';
import { searchChannels as searchYouTube } from '../services/youtubeService';
import { searchChannels as searchTwitch } from '../services/twitchService';
import { searchChannels as searchKick } from '../services/kickService';
import { upsertCreator, saveCreatorStats } from '../services/creatorService';
import SEO from '../components/SEO';
import { analytics } from '../lib/analytics';
import { formatNumber } from '../lib/utils';
import logger from '../lib/logger';

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
  kick: KickIcon,
};

const platformColors = {
  youtube: { bg: 'bg-red-600', light: 'bg-red-50', text: 'text-red-600' },
  twitch: { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600' },
  kick: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600' },
};

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, available: true },
  { id: 'kick', name: 'Kick', icon: KickIcon, available: true },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

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
  };

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    // Track search
    analytics.search(searchQuery);

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      let channels = [];
      if (selectedPlatform === 'youtube') {
        channels = await searchYouTube(searchQuery, 25);
        if (channels.length > 0) {
          void persistYouTubeResults(channels);
        }
      } else if (selectedPlatform === 'twitch') {
        channels = await searchTwitch(searchQuery, 25);
      } else if (selectedPlatform === 'kick') {
        channels = await searchKick(searchQuery, 25);
      }
      setResults(channels);
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
      setSearchParams({ q: query.trim() });
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

  const currentPlatform = platforms.find(p => p.id === selectedPlatform);

  return (
    <>
      <SEO
        title="Search Creators"
        description="Search for YouTube, Twitch, and other social media creators to view their statistics and analytics."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header - Dark */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Search Creators</h1>
            </div>
            <p className="text-sm sm:text-base text-slate-400">Find any creator and view their detailed statistics</p>
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
                      ? 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                <div className="relative flex items-center bg-white rounded-2xl shadow-lg border-2 border-gray-100 group-focus-within:border-indigo-200 transition-colors">
                  <SearchIcon className="absolute left-5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${currentPlatform?.name || ''} creators...`}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-lg rounded-2xl font-medium"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto sm:block px-8 py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              <div className="text-center mb-6">
                <p className="text-gray-500">Searching {currentPlatform?.name}...</p>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <CreatorRowSkeleton key={i} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && searched && !error && results.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No creators found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any {currentPlatform?.name} creators matching "{query}"
              </p>
              <p className="text-sm text-gray-400">
                Try searching for a different name or check the spelling
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <p className="text-gray-500 mb-4">{results.length} creators found</p>
              <div className="space-y-3">
                {results.map((creator) => {
                  const Icon = platformIcons[creator.platform] || User;
                  const colors = platformColors[creator.platform];

                  return (
                    <Link
                      key={creator.platformId}
                      to={`/${creator.platform}/${creator.username}`}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-gray-200 transition-all duration-200 group"
                    >
                      <img
                        src={creator.profileImage || '/placeholder-avatar.svg'}
                        alt={creator.displayName}
                        loading="lazy"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = '/placeholder-avatar.svg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {creator.displayName}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${colors.bg} text-white`}>
                            <Icon className="w-3 h-3" />
                            {creator.platform}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-gray-500 truncate">@{creator.username}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900 text-base sm:text-lg">{formatNumber(creator.subscribers || creator.followers)}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{creator.platform === 'twitch' ? 'followers' : creator.platform === 'kick' ? 'paid subs' : 'subscribers'}</p>
                      </div>
                      <ArrowRight className="hidden sm:block w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

