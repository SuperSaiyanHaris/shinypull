import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Youtube, Twitch, ExternalLink, Share2, Radio, AlertCircle } from 'lucide-react';
import { getChannelByUsername as getYouTubeChannel } from '../services/youtubeService';
import { getChannelByUsername as getTwitchChannel } from '../services/twitchService';
import SEO from '../components/SEO';

const platformConfig = {
  youtube: {
    icon: Youtube,
    gradient: 'from-red-500 to-red-600',
    label: 'subscribers',
    embedUrl: (id) => `https://livecounts.io/embed/youtube-live-subscriber-counter/${id}`,
    liveCountsUrl: (id) => `https://livecounts.io/youtube-live-subscriber-counter/${id}`,
  },
  twitch: {
    icon: Twitch,
    gradient: 'from-purple-500 to-purple-600',
    label: 'followers',
    embedUrl: (username) => `https://livecounts.io/embed/twitch-live-follower-counter/${username}`,
    liveCountsUrl: (username) => `https://livecounts.io/twitch-live-follower-counter/${username}`,
  },
};

export default function LiveCount() {
  const { platform, username } = useParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = platformConfig[platform] || platformConfig.youtube;
  const Icon = config.icon;

  useEffect(() => {
    const fetchCreatorInfo = async () => {
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
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load creator');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorInfo();
  }, [platform, username]);

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

  const getEmbedId = () => {
    if (platform === 'youtube') {
      return creator?.platformId;
    }
    return username;
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
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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

  const embedId = getEmbedId();

  return (
    <>
      <SEO
        title={`${creator.displayName} Live ${config.label} Count`}
        description={`Watch ${creator.displayName}'s ${platform} ${config.label} count update in real-time.`}
      />

      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Main Counter */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center w-full max-w-3xl">
            {/* Live Indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
              <span className="text-red-500 font-bold text-lg uppercase tracking-wider">Live</span>
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r ${config.gradient} text-white`}>
                <Icon className="w-4 h-4" />
                {platform}
              </span>
            </div>

            {/* Embedded Live Counter - Large and Centered */}
            {embedId && (
              <div className="mb-10">
                <iframe
                  src={config.embedUrl(embedId)}
                  width="100%"
                  height="280"
                  frameBorder="0"
                  scrolling="no"
                  style={{
                    border: 0,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    maxWidth: '700px',
                    margin: '0 auto',
                    display: 'block',
                  }}
                  title={`${creator.displayName} live ${config.label} count`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <Link
                to={`/${platform}/${username}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Full Profile
              </Link>
              {embedId && (
                <a
                  href={config.liveCountsUrl(embedId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  View on LiveCounts
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 text-center text-gray-500 text-sm border-t border-gray-800">
          <div className="flex items-center justify-center gap-2">
            <Radio className="w-4 h-4 text-red-500" />
            <span>Real-time updates powered by LiveCounts.io</span>
          </div>
        </div>
      </div>
    </>
  );
}
