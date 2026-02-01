import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Youtube, Twitch, Instagram, Twitter, Users, Eye, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

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

const platformUrls = {
  youtube: (username) => `https://youtube.com/@${username}`,
  twitch: (username) => `https://twitch.tv/${username}`,
  instagram: (username) => `https://instagram.com/${username}`,
  twitter: (username) => `https://twitter.com/${username}`,
  tiktok: (username) => `https://tiktok.com/@${username}`,
};

export default function CreatorProfile() {
  const { platform, username } = useParams();
  const [creator, setCreator] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch creator data from Supabase
    setLoading(false);
  }, [platform, username]);

  const Icon = platformIcons[platform];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Placeholder state when creator not found
  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          {/* Header */}
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
              <p className="text-gray-400 mb-4">Creator not yet tracked</p>
              <a
                href={platformUrls[platform]?.(username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                View on {platform}
              </a>
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Subscribers" value="-" />
            <StatCard label="Total Views" value="-" />
            <StatCard label="30-Day Growth" value="-" />
            <StatCard label="Est. Earnings" value="-" />
          </div>

          <div className="text-center py-8 border-t border-gray-700">
            <p className="text-gray-400 mb-4">
              This creator is not yet being tracked by ShinyPull.
            </p>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
              Request Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Creator profile will be rendered here when data is available */}
    </div>
  );
}

function StatCard({ label, value, change, changeLabel }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeColor = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="stat-card">
      <p className="stat-label mb-1">{label}</p>
      <p className="stat-value">{value}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-sm ${changeColor}`}>
          <ChangeIcon className="w-4 h-4" />
          <span>{isPositive ? '+' : ''}{formatNumber(change)}</span>
          {changeLabel && <span className="text-gray-500">({changeLabel})</span>}
        </div>
      )}
    </div>
  );
}

function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}
