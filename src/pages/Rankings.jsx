import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Youtube, Twitch, Instagram, TrendingUp, Users, Eye, Trophy } from 'lucide-react';
import { getRankedCreators } from '../services/creatorService';
import SEO from '../components/SEO';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', hoverColor: 'hover:bg-red-700', lightBg: 'bg-red-50', textColor: 'text-red-600', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'bg-purple-600', hoverColor: 'hover:bg-purple-700', lightBg: 'bg-purple-50', textColor: 'text-purple-600', available: true },
  { id: 'tiktok', name: 'TikTok', icon: null, color: 'bg-pink-500', lightBg: 'bg-pink-50', textColor: 'text-pink-500', available: false },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500', lightBg: 'bg-purple-50', textColor: 'text-purple-500', available: false },
];

export default function Rankings() {
  const { platform: urlPlatform } = useParams();
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState(urlPlatform || 'youtube');
  const [selectedRankType, setSelectedRankType] = useState('subscribers');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rankTypes = [
    { id: 'subscribers', name: selectedPlatform === 'twitch' ? 'Top Followers' : 'Top Subscribers', icon: Users },
    { id: 'views', name: 'Most Views', icon: Eye },
    { id: 'growth', name: 'Fastest Growing', icon: TrendingUp },
  ];

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
  const currentPlatform = platforms.find(p => p.id === selectedPlatform);

  return (
    <>
      <SEO
        title={`${currentPlatform?.name || 'Creator'} Rankings`}
        description={`Top ${currentPlatform?.name || ''} creators ranked by subscribers, views, and growth.`}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Creator Rankings</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-500">Discover top creators across platforms</p>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Platform Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatform === platform.id;

              return (
                <button
                  key={platform.id}
                  onClick={() => platform.available && handlePlatformChange(platform.id)}
                  disabled={!platform.available}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    isSelected
                      ? `${platform.color} text-white shadow-lg`
                      : platform.available
                      ? 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {platform.name}
                  {!platform.available && <span className="text-xs opacity-75">(Soon)</span>}
                </button>
              );
            })}
          </div>

          {/* Rank Type Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
            {rankTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedRankType(type.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  selectedRankType === type.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <type.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{type.name}</span>
              </button>
            ))}
          </div>

          {/* Rankings Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Creator</div>
              <div className="col-span-2 text-right">{followerLabel}</div>
              <div className="col-span-2 text-right">Views</div>
              <div className="col-span-2 text-right">30-Day Growth</div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="px-6 py-16 text-center">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading rankings...</p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="px-6 py-16 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={loadRankings}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && rankings.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">No ranking data available yet</p>
                <p className="text-sm text-gray-400">Rankings will appear here once creators are tracked</p>
              </div>
            )}

            {/* Rankings List */}
            {!loading && !error && rankings.map((creator, index) => (
              <Link
                key={creator.id}
                to={`/${creator.platform}/${creator.username}`}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors group"
              >
                {/* Rank */}
                <div className="col-span-2 md:col-span-1">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Creator Info */}
                <div className="col-span-10 md:col-span-5 flex items-center gap-3 min-w-0">
                  <img
                    src={creator.profile_image || '/placeholder-avatar.svg'}
                    alt={creator.display_name}
                    className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                    onError={(e) => {
                      e.target.src = '/placeholder-avatar.svg';
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {creator.display_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">@{creator.username}</p>
                  </div>
                </div>

                {/* Stats - Desktop */}
                <div className="hidden md:block col-span-2 text-right">
                  <span className="font-semibold text-gray-900">{formatNumber(creator.subscribers)}</span>
                </div>
                <div className="hidden md:block col-span-2 text-right">
                  <span className="text-gray-600">{formatNumber(creator.totalViews)}</span>
                </div>
                <div className="hidden md:block col-span-2 text-right">
                  <span className={`font-medium ${creator.growth30d > 0 ? 'text-emerald-600' : creator.growth30d < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {creator.growth30d > 0 ? '+' : ''}{formatNumber(creator.growth30d)}
                  </span>
                </div>

                {/* Stats - Mobile */}
                <div className="col-span-12 md:hidden flex gap-4 text-sm pl-11">
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-900">{formatNumber(creator.subscribers)}</span> {followerLabel.toLowerCase()}
                  </span>
                  <span className="text-gray-500">
                    <span className="font-medium text-gray-900">{formatNumber(creator.totalViews)}</span> views
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
