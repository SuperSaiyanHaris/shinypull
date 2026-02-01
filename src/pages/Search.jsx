import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Youtube, Twitch, Instagram, User, AlertCircle } from 'lucide-react';
import { searchChannels } from '../services/youtubeService';

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

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, available: false },
  { id: 'tiktok', name: 'TikTok', icon: null, available: false },
  { id: 'instagram', name: 'Instagram', icon: Instagram, available: false },
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
  }, [searchParams]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      if (selectedPlatform === 'youtube') {
        const channels = await searchChannels(searchQuery, 10);
        setResults(channels);
      } else {
        // Other platforms not yet implemented
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Creators</h1>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <button
              key={platform.id}
              onClick={() => platform.available && setSelectedPlatform(platform.id)}
              disabled={!platform.available}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === platform.id
                  ? platformColors[platform.id] + ' text-white'
                  : platform.available
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              {platform.name}
              {!platform.available && <span className="text-xs">(Soon)</span>}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${selectedPlatform} creators...`}
            className="w-full pl-12 pr-32 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Searching {selectedPlatform}...</p>
        </div>
      )}

      {/* No Results */}
      {!loading && searched && !error && results.length === 0 && (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No creators found</h3>
          <p className="text-gray-400 mb-4">
            We couldn't find any {selectedPlatform} creators matching "{query}"
          </p>
          <p className="text-sm text-gray-500">
            Try searching for a different name or check the spelling
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-gray-400 mb-4">{results.length} creators found</p>
          {results.map((creator) => {
            const Icon = platformIcons[creator.platform] || User;
            return (
              <Link
                key={creator.platformId}
                to={`/${creator.platform}/${creator.username}`}
                className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                <img
                  src={creator.profileImage || '/placeholder-avatar.png'}
                  alt={creator.displayName}
                  className="w-16 h-16 rounded-full object-cover bg-gray-700"
                  onError={(e) => {
                    e.target.src = '/placeholder-avatar.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{creator.displayName}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${platformColors[creator.platform]} text-white flex-shrink-0`}>
                      <Icon className="w-3 h-3 inline mr-1" />
                      {creator.platform}
                    </span>
                  </div>
                  <p className="text-gray-400 truncate">@{creator.username}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">{formatNumber(creator.subscribers)}</p>
                  <p className="text-sm text-gray-400">subscribers</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
