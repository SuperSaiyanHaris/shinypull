import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Youtube, Twitch, Instagram, Twitter, User } from 'lucide-react';

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
  instagram: Instagram,
  twitter: Twitter,
};

const platformColors = {
  youtube: 'bg-red-600',
  twitch: 'bg-purple-600',
  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
  twitter: 'bg-sky-500',
  tiktok: 'bg-pink-500',
};

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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
    // TODO: Implement actual search against Supabase
    // For now, show placeholder
    setTimeout(() => {
      setResults([]);
      setLoading(false);
    }, 500);
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

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or channel name..."
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </form>

      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Searching...</p>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No creators found</h3>
          <p className="text-gray-400 mb-4">
            We couldn't find any creators matching "{query}"
          </p>
          <p className="text-sm text-gray-500">
            Try searching for a different name or check the spelling
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((creator) => {
            const Icon = platformIcons[creator.platform] || User;
            return (
              <Link
                key={creator.id}
                to={`/${creator.platform}/${creator.username}`}
                className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                <img
                  src={creator.profile_image || '/placeholder-avatar.png'}
                  alt={creator.display_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{creator.display_name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${platformColors[creator.platform]} text-white`}>
                      {creator.platform}
                    </span>
                  </div>
                  <p className="text-gray-400">@{creator.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatNumber(creator.followers)}</p>
                  <p className="text-sm text-gray-400">followers</p>
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
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
