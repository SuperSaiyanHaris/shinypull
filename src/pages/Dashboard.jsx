import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Youtube, Twitch, Star, Users, Loader2, LogOut, Settings } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { getFollowedCreators } from '../services/followService';
import { getCreatorStats } from '../services/creatorService';
import { formatNumber } from '../lib/utils';

const platformIcons = {
  youtube: Youtube,
  twitch: Twitch,
};

const platformColors = {
  youtube: { bg: 'bg-red-600', light: 'bg-red-50', text: 'text-red-600' },
  twitch: { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600' },
};

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [followedCreators, setFollowedCreators] = useState([]);
  const [creatorStats, setCreatorStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadFollowedCreators();
    }
  }, [user]);

  async function loadFollowedCreators() {
    setLoading(true);
    try {
      const creators = await getFollowedCreators(user.id);
      setFollowedCreators(creators);

      // Load stats for each creator
      const stats = {};
      for (const creator of creators) {
        const creatorStats = await getCreatorStats(creator.id, 7);
        if (creatorStats?.length > 0) {
          stats[creator.id] = creatorStats[0];
        }
      }
      setCreatorStats(stats);
    } catch (error) {
      console.error('Failed to load followed creators:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  return (
    <>
      <SEO
        title="My Dashboard"
        description="Track your favorite creators and see their latest statistics."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {displayName}!
                </h1>
                <p className="text-slate-400">
                  Track your favorite creators and see their latest updates.
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Star className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{followedCreators.length}</p>
                  <p className="text-sm text-gray-500">Following</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Youtube className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {followedCreators.filter(c => c.platform === 'youtube').length}
                  </p>
                  <p className="text-sm text-gray-500">YouTube Creators</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Twitch className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {followedCreators.filter(c => c.platform === 'twitch').length}
                  </p>
                  <p className="text-sm text-gray-500">Twitch Streamers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Following List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Creators You Follow
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : followedCreators.length === 0 ? (
              <div className="text-center p-12">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No creators followed yet</h3>
                <p className="text-gray-500 mb-6">
                  Start following creators to track their statistics here.
                </p>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Find Creators
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {followedCreators.map(creator => {
                  const PlatformIcon = platformIcons[creator.platform] || Users;
                  const colors = platformColors[creator.platform] || { bg: 'bg-gray-600', light: 'bg-gray-50', text: 'text-gray-600' };
                  const stats = creatorStats[creator.id];

                  return (
                    <Link
                      key={creator.id}
                      to={`/${creator.platform}/${creator.username}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={creator.profile_image || '/placeholder-avatar.svg'}
                        alt={creator.display_name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`p-1 rounded ${colors.light}`}>
                            <PlatformIcon className={`w-3 h-3 ${colors.text}`} />
                          </span>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {creator.display_name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500">@{creator.username}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-gray-900">
                          {stats ? formatNumber(stats.subscribers || stats.followers) : '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {creator.platform === 'youtube' ? 'subscribers' : 'followers'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
