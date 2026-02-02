import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Youtube, Twitch, ExternalLink, Share2, AlertCircle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { getChannelByUsername as getYouTubeChannel } from '../services/youtubeService';
import { getChannelByUsername as getTwitchChannel } from '../services/twitchService';
import Odometer from '../components/Odometer';
import SEO from '../components/SEO';

const platformConfig = {
  youtube: {
    icon: Youtube,
    color: 'text-red-500',
    bgGradient: 'from-red-500 to-red-600',
    glowColor: 'shadow-red-500/20',
    label: 'subscribers',
    avgGrowthPerSecond: 2.5,
  },
  twitch: {
    icon: Twitch,
    color: 'text-purple-500',
    bgGradient: 'from-purple-500 to-purple-600',
    glowColor: 'shadow-purple-500/20',
    label: 'followers',
    avgGrowthPerSecond: 0.8,
  },
};

export default function LiveCount() {
  const { platform, username } = useParams();
  const [creator, setCreator] = useState(null);
  const [baseCount, setBaseCount] = useState(null);
  const [estimatedCount, setEstimatedCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionChange, setSessionChange] = useState(0);
  const [lastChange, setLastChange] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);

  const config = platformConfig[platform] || platformConfig.youtube;
  const Icon = config.icon;
  const intervalRef = useRef(null);

  // Fetch creator data
  useEffect(() => {
    const fetchCreator = async () => {
      setLoading(true);
      setError(null);

      try {
        let data = null;
        if (platform === 'youtube') {
          data = await getYouTubeChannel(username);
        } else if (platform === 'twitch') {
          data = await getTwitchChannel(username);
        }

        if (data) {
          setCreator(data);
          const count = data.subscribers || data.followers || 0;
          setBaseCount(count);
          setEstimatedCount(count);
        } else {
          setError('Creator not found');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load creator');
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [platform, username]);

  // Simulate live count changes
  useEffect(() => {
    if (!baseCount || !creator) return;

    const subscribers = baseCount;
    let growthMultiplier = 1;

    // Larger channels grow faster
    if (subscribers > 100000000) growthMultiplier = 3;
    else if (subscribers > 50000000) growthMultiplier = 2.5;
    else if (subscribers > 10000000) growthMultiplier = 2;
    else if (subscribers > 1000000) growthMultiplier = 1.5;
    else if (subscribers > 100000) growthMultiplier = 1;
    else growthMultiplier = 0.5;

    const baseGrowthPerSecond = config.avgGrowthPerSecond * growthMultiplier;

    const updateInterval = () => {
      const interval = 100 + Math.random() * 400;

      intervalRef.current = setTimeout(() => {
        setEstimatedCount(prev => {
          // Random change: mostly positive, occasionally negative
          const direction = Math.random() > 0.15 ? 1 : -1;
          const magnitude = Math.random() * baseGrowthPerSecond * (interval / 1000) * 2;
          const change = Math.round(direction * magnitude);

          if (change !== 0) {
            setLastChange(change);
            setSessionChange(s => s + change);
            setUpdateCount(c => c + 1);
          }

          return Math.max(0, prev + change);
        });

        updateInterval();
      }, interval);
    };

    updateInterval();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [baseCount, creator, config.avgGrowthPerSecond]);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${creator?.displayName || username}'s live ${config.label} count`;

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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">Loading live count...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">Creator Not Found</h2>
          <p className="text-gray-400 mb-6 text-lg">{error || `Could not find @${username} on ${platform}`}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${creator.displayName} Live ${config.label} Count`}
        description={`Watch ${creator.displayName}'s ${platform} ${config.label} count update in real-time. Estimated live counter.`}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="text-center w-full max-w-4xl">

            {/* Live Indicator */}
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
              <span className="text-red-500 font-bold text-base sm:text-lg uppercase tracking-widest">Live</span>
            </div>

            {/* Creator Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-10">
              <img
                src={creator.profileImage}
                alt={creator.displayName}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl object-cover border-4 border-gray-700 shadow-2xl"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{creator.displayName}</h1>
                <p className="text-gray-400 text-base sm:text-lg mb-3">@{creator.username || username}</p>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r ${config.bgGradient} text-white shadow-lg ${config.glowColor}`}>
                  <Icon className="w-4 h-4" />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </span>
              </div>
            </div>

            {/* The Big Counter */}
            <div className="mb-6 sm:mb-8">
              <div className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black ${config.color} tracking-tight`}>
                {estimatedCount !== null && (
                  <Odometer value={estimatedCount} duration={300} />
                )}
              </div>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mt-4 font-medium">
                {config.label}
              </p>
            </div>

            {/* Change Indicator */}
            {lastChange !== 0 && (
              <div className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-base sm:text-lg font-semibold mb-6 sm:mb-8 ${
                lastChange > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {lastChange > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {lastChange > 0 ? '+' : ''}{lastChange.toLocaleString()}
              </div>
            )}

            {/* Session Stats */}
            {updateCount > 5 && (
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 text-sm sm:text-base">
                <div className="bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/50">
                  <span className="text-gray-400">Session: </span>
                  <span className={`font-bold ${sessionChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sessionChange >= 0 ? '+' : ''}{sessionChange.toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/50">
                  <span className="text-gray-400">Updates: </span>
                  <span className="font-bold text-white">{updateCount.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors border border-gray-700"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <Link
                to={`/${platform}/${username}`}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Full Profile
              </Link>
            </div>

            {/* Estimate Disclaimer */}
            <div className="flex items-start sm:items-center justify-center gap-2 text-gray-500 text-xs sm:text-sm max-w-lg mx-auto">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-left sm:text-center">
                This is an <span className="text-gray-400">estimated</span> count based on the channel's {config.label} and typical growth patterns.
                <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 ml-1">Learn more</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
