import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Youtube, Twitch, Instagram, TrendingUp, Users, Eye } from 'lucide-react';
import { getRankedCreators } from '../services/creatorService';
import SEO from '../components/SEO';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'bg-purple-600', available: true },
  { id: 'tiktok', name: 'TikTok', icon: null, color: 'bg-pink-500', available: false },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500', available: false },
];

const rankTypes = [
  { id: 'subscribers', name: 'Top by Subscribers', icon: Users },
  { id: 'views', name: 'Top by Views', icon: Eye },
  { id: 'growth', name: 'Fastest Growing', icon: TrendingUp },
];

export default function Rankings() {
  const { platform: urlPlatform } = useParams();
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState(urlPlatform || 'youtube');
  const [selectedRankType, setSelectedRankType] = useState('subscribers');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (urlPlatform && urlPlatform !== selectedPlatform) {
      setSelectedPlatform(urlPlatform);
    }
  }, [urlPlatform]);

  useEffect(() => {
    loadRankings();
  }, [selectedPlatform, selectedRankType]);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRankedCreators(selectedPlatform, selectedRankType, 50);
      setRankings(data);
    } catch (err) {
      console.error('Failed to load rankings:', err);
      setError(err.message || 'Failed to load rankings');
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformChange = (platformId) => {
    if (!platformId) return;
    setSelectedPlatform(platformId);
    navigate(`/rankings/${platformId}`);
  };

  const followerLabel = selectedPlatform === 'twitch' ? 'Followers' : 'Subscribers';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Creator Rankings</h1>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <button
              key={platform.id}
              onClick={() => platform.available && handlePlatformChange(platform.id)}
              disabled={!platform.available}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPlatform === platform.id
                  ? platform.color + ' text-white'
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

      {/* Rank Type Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        {rankTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedRankType(type.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              selectedRankType === type.id
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <type.icon className="w-5 h-5" />
            {type.name}
          </button>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400 text-sm">
              <th className="px-4 py-3 w-16">Rank</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3 text-right">{followerLabel}</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3 text-right">30-Day Growth</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Loading rankings...</p>
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-red-400">
                  <p className="mb-2">{error}</p>
                  <button
                    onClick={loadRankings}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && rankings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <p className="mb-2">No ranking data available yet</p>
                  <p className="text-sm">
                    Rankings will appear here once creators are tracked
                  </p>
                </td>
              </tr>
            )}

            {!loading && !error && rankings.map((creator, index) => (
              <tr key={creator.id} className="border-t border-gray-700 hover:bg-gray-800/60">
                <td className="px-4 py-4 font-semibold text-gray-300">{index + 1}</td>
                <td className="px-4 py-4">
                  <Link
                    to={`/${creator.platform}/${creator.username}`}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={creator.profile_image || '/placeholder-avatar.svg'}
                      alt={creator.display_name}
                      className="w-10 h-10 rounded-full object-cover bg-gray-700"
                      onError={(e) => {
                        e.target.src = '/placeholder-avatar.svg';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{creator.display_name}</p>
                      <p className="text-sm text-gray-400 truncate">@{creator.username}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4 text-right font-semibold">
                  {formatNumber(creator.subscribers)}
                </td>
                <td className="px-4 py-4 text-right text-gray-300">
                  {formatNumber(creator.totalViews)}
                </td>
                <td className="px-4 py-4 text-right text-gray-300">
                  {formatNumber(creator.growth30d)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
