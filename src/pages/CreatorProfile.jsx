import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Youtube, Twitch, Instagram, Users, Eye, Video, TrendingUp, TrendingDown, Minus, ExternalLink, AlertCircle } from 'lucide-react';
import { getChannelByUsername } from '../services/youtubeService';
import { upsertCreator, saveCreatorStats, getCreatorByUsername, getCreatorStats } from '../services/creatorService';

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

const platformUrls = {
  youtube: (username) => `https://youtube.com/@${username}`,
  twitch: (username) => `https://twitch.tv/${username}`,
  instagram: (username) => `https://instagram.com/${username}`,
  tiktok: (username) => `https://tiktok.com/@${username}`,
};

export default function CreatorProfile() {
  const { platform, username } = useParams();
  const [creator, setCreator] = useState(null);
  const [statsHistory, setStatsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCreator();
  }, [platform, username]);

  const loadCreator = async () => {
    setLoading(true);
    setError(null);

    try {
      if (platform === 'youtube') {
        // Fetch fresh data from YouTube API
        const ytChannel = await getChannelByUsername(username);

        if (ytChannel) {
          setCreator(ytChannel);

          // Save to database (fire and forget)
          try {
            const dbCreator = await upsertCreator(ytChannel);
            await saveCreatorStats(dbCreator.id, {
              subscribers: ytChannel.subscribers,
              totalViews: ytChannel.totalViews,
              totalPosts: ytChannel.totalPosts,
            });

            // Fetch stats history
            const history = await getCreatorStats(dbCreator.id, 30);
            setStatsHistory(history || []);
          } catch (dbErr) {
            console.warn('Failed to save to database:', dbErr);
            // Continue anyway - we have the data from YouTube
          }
        }
      } else {
        // Other platforms - check database only for now
        const dbCreator = await getCreatorByUsername(platform, username);
        if (dbCreator) {
          setCreator(dbCreator);
        }
      }
    } catch (err) {
      console.error('Error loading creator:', err);
      setError(err.message || 'Failed to load creator');
    } finally {
      setLoading(false);
    }
  };

  const Icon = platformIcons[platform];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading {platform} channel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Creator</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadCreator}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Creator not found
  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
              {Icon && <Icon className="w-12 h-12 text-gray-500" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">@{username}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${platformColors[platform]} text-white`}>
                  {platform}
                </span>
              </div>
              <p className="text-gray-400 mb-4">Creator not found</p>
              <a
                href={platformUrls[platform]?.(username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                Check on {platform}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Creator found - show profile
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Banner */}
        {creator.bannerImage && (
          <div className="h-32 md:h-48 bg-gray-700 overflow-hidden">
            <img
              src={creator.bannerImage}
              alt="Channel banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
            <img
              src={creator.profileImage}
              alt={creator.displayName}
              className="w-24 h-24 rounded-full object-cover bg-gray-700 border-4 border-gray-800 -mt-16 md:-mt-20"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{creator.displayName}</h1>
                <span className={`px-3 py-1 rounded-full text-sm ${platformColors[platform]} text-white flex items-center gap-1`}>
                  {Icon && <Icon className="w-4 h-4" />}
                  {platform}
                </span>
                {creator.country && (
                  <span className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
                    {creator.country}
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-3">@{creator.username}</p>
              <a
                href={platformUrls[platform]?.(creator.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on {platform}
              </a>
            </div>
          </div>

          {/* Description */}
          {creator.description && (
            <p className="text-gray-400 text-sm mb-8 line-clamp-3">
              {creator.description}
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Subscribers"
              value={formatNumber(creator.subscribers)}
              sublabel={creator.hiddenSubscribers ? '(hidden)' : null}
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={formatNumber(creator.totalViews)}
            />
            <StatCard
              icon={Video}
              label="Videos"
              value={formatNumber(creator.totalPosts)}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Views/Video"
              value={creator.totalPosts > 0 ? formatNumber(Math.round(creator.totalViews / creator.totalPosts)) : '-'}
            />
          </div>

          {/* Stats History */}
          {statsHistory.length > 1 && (
            <div className="border-t border-gray-700 pt-8">
              <h3 className="text-lg font-semibold mb-4">Statistics History</h3>
              <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
                <p>Tracking started. Historical data will appear here as we collect more snapshots.</p>
                <p className="mt-2">{statsHistory.length} data points collected</p>
              </div>
            </div>
          )}

          {/* Channel Creation Date */}
          {creator.createdAt && (
            <div className="border-t border-gray-700 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Channel created: {new Date(creator.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sublabel, change }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeColor = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <p className="text-sm text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
      {change !== undefined && change !== null && (
        <div className={`flex items-center gap-1 mt-1 text-sm ${changeColor}`}>
          <ChangeIcon className="w-4 h-4" />
          <span>{isPositive ? '+' : ''}{formatNumber(change)}</span>
        </div>
      )}
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
