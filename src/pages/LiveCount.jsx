import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Youtube, Twitch, Users, TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Share2 } from 'lucide-react';
import { getChannelByUsername as getYouTubeChannel } from '../services/youtubeService';
import { getChannelByUsername as getTwitchChannel } from '../services/twitchService';
import SEO from '../components/SEO';

const platformConfig = {
  youtube: {
    icon: Youtube,
    color: 'text-red-600',
    bg: 'bg-red-600',
    gradient: 'from-red-500 to-red-600',
    label: 'subscribers'
  },
  twitch: {
    icon: Twitch,
    color: 'text-purple-600',
    bg: 'bg-purple-600',
    gradient: 'from-purple-500 to-purple-600',
    label: 'followers'
  },
};

export default function LiveCount() {
  const { platform, username } = useParams();
  const [creator, setCreator] = useState(null);
  const [count, setCount] = useState(null);
  const [previousCount, setPreviousCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);

  const config = platformConfig[platform] || platformConfig.youtube;
  const Icon = config.icon;

  const fetchCount = async (isInitial = false) => {
    if (!isInitial) setRefreshing(true);

    try {
      let data = null;
      if (platform === 'youtube') {
        data = await getYouTubeChannel(username);
      } else if (platform === 'twitch') {
        data = await getTwitchChannel(username);
      }

      if (data) {
        const newCount = data.subscribers || data.followers || 0;

        if (isInitial) {
          setCreator(data);
          setCount(newCount);
        } else {
          setPreviousCount(count);
          setCount(newCount);

          // Track history
          setHistory(prev => {
            const newHistory = [...prev, { count: newCount, time: new Date() }];
            return newHistory.slice(-20); // Keep last 20 data points
          });
        }

        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      if (isInitial) {
        setError(err.message || 'Failed to load creator');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCount(true);

    // Poll every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchCount(false);
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [platform, username]);

  const getCountChange = () => {
    if (previousCount === null || count === null) return 0;
    return count - previousCount;
  };

  const getTotalChange = () => {
    if (history.length < 2) return 0;
    return history[history.length - 1].count - history[0].count;
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${creator?.displayName}'s live ${config.label} count: ${formatNumber(count)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch (e) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading live count...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Creator Not Found</h2>
          <p className="text-gray-400 mb-4">{error || `Could not find @${username} on ${platform}`}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const change = getCountChange();
  const totalChange = getTotalChange();

  return (
    <>
      <SEO
        title={`${creator.displayName} Live ${config.label} Count`}
        description={`Watch ${creator.displayName}'s ${platform} ${config.label} count update in real-time.`}
      />

      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Main Counter */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-4xl w-full">
            {/* Creator Info */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <img
                src={creator.profileImage}
                alt={creator.displayName}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-gray-700"
              />
              <div className="text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{creator.displayName}</h1>
                <p className="text-gray-400">@{creator.username}</p>
                <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-lg text-sm bg-gradient-to-r ${config.gradient} text-white`}>
                  <Icon className="w-4 h-4" />
                  {platform}
                </span>
              </div>
            </div>

            {/* The Big Number */}
            <div className="relative mb-8">
              <div className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tabular-nums tracking-tight bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                {count?.toLocaleString()}
              </div>
              <p className="text-xl md:text-2xl text-gray-400 mt-4 font-medium">
                {config.label}
              </p>
            </div>

            {/* Change Indicator */}
            {change !== 0 && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold mb-8 ${
                change > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {change > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {change > 0 ? '+' : ''}{change.toLocaleString()} since last update
              </div>
            )}

            {/* Session Stats */}
            {history.length >= 2 && (
              <div className="flex items-center justify-center gap-6 mb-8 text-sm">
                <div className="text-gray-400">
                  Session: <span className={`font-semibold ${totalChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalChange >= 0 ? '+' : ''}{totalChange.toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-500">•</div>
                <div className="text-gray-400">
                  {history.length} updates
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => fetchCount(false)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Now
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <Link
                to={`/${platform}/${username}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Full Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 text-center text-gray-500 text-sm border-t border-gray-800">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span>Auto-updates every 30 seconds</span>
            {lastUpdate && (
              <>
                <span>•</span>
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </>
            )}
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
