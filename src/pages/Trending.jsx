import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Loader2 } from 'lucide-react';
import { Youtube, Twitch } from 'lucide-react';
import SEO from '../components/SEO';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import { getRankedCreators } from '../services/creatorService';
import { formatNumber } from '../lib/utils';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, textColor: 'text-red-400', activeBg: 'bg-red-950/40', activeBorder: 'border-red-500/60', followerLabel: 'subscribers', growthLabel: 'views gained', growthNote: 'YouTube rounds subscriber counts by policy, so views are used as the growth metric.' },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, textColor: 'text-pink-400', activeBg: 'bg-pink-950/40', activeBorder: 'border-pink-500/60', followerLabel: 'followers', growthLabel: 'followers gained', growthNote: null },
  { id: 'twitch', name: 'Twitch', icon: Twitch, textColor: 'text-purple-400', activeBg: 'bg-purple-950/40', activeBorder: 'border-purple-500/60', followerLabel: 'followers', growthLabel: 'watch hours gained', growthNote: 'Twitch growth is measured by hours watched per month, the standard streaming metric.' },
  { id: 'kick', name: 'Kick', icon: KickIcon, textColor: 'text-green-400', activeBg: 'bg-green-950/40', activeBorder: 'border-green-500/60', followerLabel: 'paid subs', growthLabel: 'paid subs gained', growthNote: 'Kick\'s API only exposes paid subscriber counts, not free follower counts.' },
  { id: 'bluesky', name: 'Bluesky', icon: BlueskyIcon, textColor: 'text-sky-400', activeBg: 'bg-sky-950/40', activeBorder: 'border-sky-500/60', followerLabel: 'followers', growthLabel: 'followers gained', growthNote: null },
];

export default function Trending() {
  const [activePlatform, setActivePlatform] = useState('youtube');
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState({});

  useEffect(() => {
    if (cache[activePlatform]) {
      setCreators(cache[activePlatform]);
      return;
    }
    setLoading(true);
    getRankedCreators(activePlatform, 'growth', 25).then(data => {
      const filtered = (data || []).filter(c => c.growth30d > 0);
      setCreators(filtered);
      setCache(prev => ({ ...prev, [activePlatform]: filtered }));
      setLoading(false);
    });
  }, [activePlatform]);

  const platform = PLATFORMS.find(p => p.id === activePlatform);

  return (
    <>
      <SEO
        title="Trending Creators"
        description="See the fastest growing YouTube, TikTok, Twitch, Kick, and Bluesky creators this month. Rankings updated daily."
        keywords="trending creators, fastest growing youtubers, fastest growing tiktok accounts, trending streamers, creator growth rankings"
      />
      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Page header */}
        <div className="bg-gray-900/60 border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Updated Daily</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 mb-2">Trending Creators</h1>
            <p className="text-gray-400 text-base sm:text-lg">Fastest growing channels and accounts over the last 30 days.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Platform tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
            {PLATFORMS.map(p => {
              const PIcon = p.icon;
              const isActive = p.id === activePlatform;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 border flex-shrink-0 ${
                    isActive
                      ? `${p.activeBg} ${p.activeBorder} ${p.textColor}`
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                  }`}
                >
                  <PIcon className="w-4 h-4" />
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Metric note */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">
              Ranked by <span className="text-gray-400 font-medium">{platform.growthLabel}</span> over the last 30 days
              {platform.growthNote && <span className="hidden sm:inline">. {platform.growthNote}</span>}
            </p>
          </div>

          {/* Creator list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : creators.length === 0 ? (
            <p className="text-center py-20 text-gray-500">No growth data available yet for this platform.</p>
          ) : (
            <div className="space-y-2">
              {creators.map((creator, i) => {
                const baseSubs = creator.latestStats.subscribers - creator.growth30d;
                const growthPct = baseSubs > 0 ? ((creator.growth30d / baseSubs) * 100).toFixed(1) : null;
                return (
                  <Link
                    key={creator.id}
                    to={`/${activePlatform}/${creator.username}`}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800/50 transition-all duration-200 group"
                  >
                    <span className="w-6 text-center text-sm font-bold text-gray-600 flex-shrink-0">{i + 1}</span>
                    <img
                      src={creator.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.display_name)}&background=1f2937&color=9ca3af&size=48`}
                      alt={creator.display_name}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover bg-gray-800 flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-100 truncate group-hover:text-white text-sm sm:text-base">{creator.display_name}</p>
                      <p className="text-xs text-gray-500 truncate">{formatNumber(creator.latestStats.subscribers)} {platform.followerLabel}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-emerald-400 text-sm sm:text-base">+{formatNumber(creator.growth30d)}</p>
                      <p className="text-xs text-gray-500">{platform.growthLabel}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
