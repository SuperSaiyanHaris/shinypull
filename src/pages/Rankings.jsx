import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Youtube, Twitch, TrendingUp, Users, Eye, Trophy, Info, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Megaphone } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import { TableSkeleton } from '../components/Skeleton';
import FunErrorState from '../components/FunErrorState';
import { getRankedCreators, getFeaturedListings } from '../services/creatorService';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { analytics } from '../lib/analytics';
import { formatNumber } from '../lib/utils';
import logger from '../lib/logger';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', hoverColor: 'hover:bg-red-500', lightBg: 'bg-red-950/30', textColor: 'text-red-400', available: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'bg-pink-600', hoverColor: 'hover:bg-pink-500', lightBg: 'bg-pink-950/30', textColor: 'text-pink-400', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'bg-purple-600', hoverColor: 'hover:bg-purple-500', lightBg: 'bg-purple-950/30', textColor: 'text-purple-400', available: true },
  { id: 'kick', name: 'Kick', icon: KickIcon, color: 'bg-green-600', hoverColor: 'hover:bg-green-500', lightBg: 'bg-green-950/30', textColor: 'text-green-400', available: true },
  { id: 'bluesky', name: 'Bluesky', icon: BlueskyIcon, color: 'bg-sky-500', hoverColor: 'hover:bg-sky-400', lightBg: 'bg-sky-950/30', textColor: 'text-sky-400', available: true },
];

const topCounts = [50, 100, 500];

// SEO helpers per platform
function getSeoData(platform, rankType, topCount) {
  const p = platform?.name || 'Creator';
  const pid = platform?.id || 'youtube';
  const countLabel = `Top ${topCount}`;

  const metricLabel = rankType === 'views' ? 'Most Viewed' :
    rankType === 'growth' ? 'Fastest Growing' :
    pid === 'tiktok' || pid === 'twitch' || pid === 'bluesky' ? 'Most Followed' :
    pid === 'kick' ? 'Most Subscribed' : 'Most Subscribed';

  const title = `${countLabel} ${p} ${rankType === 'growth' ? 'Fastest Growing' : rankType === 'views' ? 'Most Viewed' : pid === 'youtube' ? 'YouTubers' : p + ' Creators'} (2026) - Live Rankings`;

  const descriptions = {
    youtube: `The ${countLabel.toLowerCase()} most subscribed YouTubers ranked by subscribers, views, and growth. Updated daily with live stats. See who has the most YouTube subscribers in 2026.`,
    tiktok: `${countLabel} most followed TikTok creators ranked by followers, likes, and growth. Updated daily. See who has the most TikTok followers in 2026.`,
    twitch: `${countLabel} most followed Twitch streamers ranked by followers, watch hours, and growth. Updated daily. Find the most watched Twitch streamers in 2026.`,
    kick: `${countLabel} Kick streamers ranked by paid subscribers and growth. Updated daily. See the top Kick streamers in 2026.`,
    bluesky: `${countLabel} most followed Bluesky accounts ranked by followers and growth. Updated daily. See who has the most Bluesky followers in 2026.`,
  };

  const keywords = {
    youtube: `top youtubers, top ${topCount} youtubers, most subscribed youtubers, biggest youtube channels, who has the most youtube subscribers, most popular youtubers 2026, youtube rankings`,
    tiktok: `top tiktokers, top ${topCount} tiktokers, most followed tiktok, who has the most tiktok followers, most tiktok likes, biggest tiktok accounts 2026, tiktok rankings`,
    twitch: `top twitch streamers, top ${topCount} twitch streamers, most followed twitch, most watched twitch streamers, most hours watched twitch, biggest twitch channels 2026, twitch rankings`,
    kick: `top kick streamers, top ${topCount} kick streamers, most subscribed kick, biggest kick channels 2026, kick rankings`,
    bluesky: `top bluesky accounts, top ${topCount} bluesky creators, most followed bluesky, biggest bluesky accounts 2026, bluesky rankings, bluesky statistics`,
  };

  return {
    title,
    description: descriptions[pid] || descriptions.youtube,
    keywords: keywords[pid] || keywords.youtube,
  };
}

function getH1Text(platform, topCount) {
  const pid = platform?.id || 'youtube';
  const labels = {
    youtube: `Top ${topCount} YouTubers`,
    tiktok: `Top ${topCount} TikTok Creators`,
    twitch: `Top ${topCount} Twitch Streamers`,
    kick: `Top ${topCount} Kick Streamers`,
    bluesky: `Top ${topCount} Bluesky Accounts`,
  };
  return labels[pid] || `Top ${topCount} ${platform?.name} Creators`;
}

function getSubheading(platform) {
  const pid = platform?.id || 'youtube';
  const subs = {
    youtube: 'Ranked by subscribers, views, and growth. Updated daily.',
    tiktok: 'Ranked by followers, likes, and growth. Updated daily.',
    twitch: 'Ranked by followers, watch hours, and growth. Updated daily.',
    kick: 'Ranked by paid subscribers and growth. Updated daily.',
    bluesky: 'Ranked by followers and growth. Updated daily.',
  };
  return subs[pid] || 'Ranked by stats and growth. Updated daily.';
}

// Build ItemList structured data for SEO
function createRankingListSchema(rankings, platform, topCount) {
  if (!rankings.length) return null;
  const siteUrl = 'https://shinypull.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: getH1Text(platform, topCount),
    description: `Live rankings of the top ${topCount} ${platform?.name || ''} creators, updated daily.`,
    numberOfItems: rankings.length,
    itemListElement: rankings.map((creator, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: creator.display_name,
      url: `${siteUrl}/${creator.platform}/${creator.username}`,
    })),
  };
}

export default function Rankings() {
  const { platform: urlPlatform } = useParams();
  const navigate = useNavigate();

  // If no platform in URL, show overview page
  if (!urlPlatform) {
    return <RankingsOverview />;
  }

  return <PlatformRankings urlPlatform={urlPlatform} />;
}

function RankingsOverview() {
  const navigate = useNavigate();
  const [platformData, setPlatformData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          platforms.map(async (p) => {
            try {
              const data = await getRankedCreators(p.id, 'subscribers', 10);
              return { platform: p.id, data };
            } catch {
              return { platform: p.id, data: [] };
            }
          })
        );
        const map = {};
        results.forEach(r => { map[r.platform] = r.data; });
        setPlatformData(map);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  return (
    <>
      <SEO
        title="Creator Rankings - Top YouTubers, TikTokers, Twitch, Kick & Bluesky Creators (2026)"
        description="Live rankings of the top creators across YouTube, TikTok, Twitch, Kick, and Bluesky. Updated daily with subscriber counts, follower stats, and growth metrics."
        keywords="top youtubers, top tiktokers, top twitch streamers, top kick streamers, top bluesky accounts, creator rankings, most subscribers, most followers, live rankings 2026"
      />
      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-800/60">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-100">Creator Rankings</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400">Top creators across all platforms. Updated daily.</p>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6">
                  <TableSkeleton rows={5} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const creators = platformData[platform.id] || [];
                const follLabel = platform.id === 'tiktok' || platform.id === 'twitch' || platform.id === 'bluesky' ? 'followers' : platform.id === 'kick' ? 'paid subs' : 'subscribers';

                return (
                  <div key={platform.id} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
                    {/* Platform Header */}
                    <div className={`flex items-center justify-between px-5 py-4 ${platform.lightBg} border-b border-gray-800`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-bold text-gray-100">Top {platform.name} Creators</h2>
                      </div>
                      <Link
                        to={`/rankings/${platform.id}`}
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        View All &rarr;
                      </Link>
                    </div>

                    {/* Mini Rankings List */}
                    <div className="divide-y divide-gray-800/70">
                      {creators.length === 0 ? (
                        <div className="px-5 py-8 text-center text-gray-300 text-sm">No data available</div>
                      ) : (
                        creators.map((creator, index) => (
                          <Link
                            key={creator.id}
                            to={`/${creator.platform}/${creator.username}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors group"
                          >
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              index === 0 ? 'bg-yellow-900/30 text-yellow-400' :
                              index === 1 ? 'bg-gray-800 text-gray-300' :
                              index === 2 ? 'bg-orange-900/30 text-orange-400' :
                              'bg-gray-800/50 text-gray-300'
                            }`}>
                              {index + 1}
                            </span>
                            <img
                              src={creator.profile_image || '/placeholder-avatar.svg'}
                              alt={creator.display_name}
                              loading="lazy"
                              className="w-8 h-8 rounded-lg object-cover bg-gray-800 flex-shrink-0"
                              onError={(e) => { e.target.src = '/placeholder-avatar.svg'; }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-100 truncate group-hover:text-indigo-400 transition-colors">
                                {creator.display_name}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-gray-300 flex-shrink-0">
                              {formatNumber(creator.subscribers)} {follLabel}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>

                    {/* View Full Rankings Button */}
                    <div className="px-5 py-3 border-t border-gray-800">
                      <Link
                        to={`/rankings/${platform.id}`}
                        className={`block w-full text-center py-2.5 rounded-xl text-sm font-medium ${platform.color} text-white ${platform.hoverColor} transition-colors`}
                      >
                        View Top 50 {platform.name} Creators
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PlatformRankings({ urlPlatform }) {
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState(urlPlatform || 'youtube');
  const [selectedRankType, setSelectedRankType] = useState('subscribers');
  const [topCount, setTopCount] = useState(50);
  const [topCountOpen, setTopCountOpen] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const [sponsoredListings, setSponsoredListings] = useState([]);

  const rankTypes = [
    { id: 'subscribers', name: selectedPlatform === 'tiktok' || selectedPlatform === 'twitch' || selectedPlatform === 'bluesky' ? 'Top Followers' : selectedPlatform === 'kick' ? 'Top Paid Subs' : 'Top Subscribers', icon: Users },
    // Hide views for Kick, TikTok, and Bluesky since APIs don't provide view data
    ...(selectedPlatform !== 'kick' && selectedPlatform !== 'tiktok' && selectedPlatform !== 'bluesky' ? [{ id: 'views', name: 'Most Views', icon: Eye }] : []),
    { id: 'growth', name: 'Fastest Growing', icon: TrendingUp },
  ];

  useEffect(() => {
    if (urlPlatform && urlPlatform !== selectedPlatform) {
      setSelectedPlatform(urlPlatform);
    }
  }, [urlPlatform]);

  useEffect(() => {
    loadRankings();
  }, [selectedPlatform, selectedRankType, topCount]);

  useEffect(() => {
    getFeaturedListings(selectedPlatform)
      .then(setSponsoredListings)
      .catch(() => setSponsoredListings([]));
  }, [selectedPlatform]);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRankedCreators(selectedPlatform, selectedRankType, topCount);
      setRankings(data);
    } catch (err) {
      logger.error('Failed to load rankings:', err);
      setError(err.message || 'Failed to load rankings');
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset column sort when rank type or platform changes
  useEffect(() => {
    setSortColumn(null);
    setSortDirection('desc');
  }, [selectedRankType, selectedPlatform]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      // Data is pre-sorted desc by the active rank type, so if clicking that
      // same column with no custom sort active, start ascending for a visible change
      const startDir = (!sortColumn && column === selectedRankType) ? 'asc' : 'desc';
      setSortColumn(column);
      setSortDirection(startDir);
    }
  };

  const sortedRankings = useMemo(() => {
    const withRank = rankings.map((c, i) => ({ ...c, originalRank: i + 1 }));
    if (!sortColumn) return withRank;
    const getValue = (creator) => {
      switch (sortColumn) {
        case 'subscribers': return creator.subscribers || 0;
        case 'views': return creator.totalViews || 0;
        case 'growth': return creator.growth30d || 0;
        default: return 0;
      }
    };
    return [...withRank].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [rankings, sortColumn, sortDirection]);

  // Inject sponsored rows after rank 10, then every 5 organic ranks — first come first served.
  // Top 10 stays clean (reserved for premium placements).
  // If a slot-holder cancels, the next advertiser automatically moves up.
  const displayList = useMemo(() => {
    if (!sponsoredListings.length) return sortedRankings;
    const result = [];
    let sponsorIdx = 0;
    let nextSlot = 10; // 0-indexed: inject before organic index 10 (after rank 10)
    for (let i = 0; i < sortedRankings.length; i++) {
      if (sponsorIdx < sponsoredListings.length && i === nextSlot) {
        const listing = sponsoredListings[sponsorIdx];
        const c = listing.creators;
        result.push({
          ...c,
          isSponsored: true,
          listingId: listing.id,
          display_name: c?.display_name,
          username: c?.username,
          profile_image: c?.profile_image,
          platform: c?.platform,
        });
        sponsorIdx++;
        nextSlot += 5; // next slot every 5 organic ranks
      }
      result.push(sortedRankings[i]);
    }
    return result;
  }, [sortedRankings, sponsoredListings]);

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
    return sortDirection === 'desc'
      ? <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
      : <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const handlePlatformChange = (platformId) => {
    if (!platformId) return;
    setSelectedPlatform(platformId);
    // Reset rank type if switching to a platform that doesn't support it
    const noViews = platformId === 'kick' || platformId === 'tiktok' || platformId === 'bluesky';
    if (selectedRankType === 'views' && noViews) setSelectedRankType('subscribers');
    navigate(`/rankings/${platformId}`);
    analytics.switchPlatform('rankings', platformId);
  };

  const followerLabel = selectedPlatform === 'tiktok' || selectedPlatform === 'twitch' || selectedPlatform === 'bluesky' ? 'Followers' : selectedPlatform === 'kick' ? 'Paid Subs' : 'Subscribers';
  const currentPlatform = platforms.find(p => p.id === selectedPlatform);
  const seoData = getSeoData(currentPlatform, selectedRankType, topCount);
  const listSchema = createRankingListSchema(rankings, currentPlatform, topCount);

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
      />
      {listSchema && <StructuredData schema={listSchema} />}

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-800/60">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-100">{getH1Text(currentPlatform, topCount)}</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-300">{getSubheading(currentPlatform)}</p>
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
                      ? 'bg-gray-900 text-gray-300 border border-gray-700 hover:border-gray-600 hover:shadow-md'
                      : 'bg-gray-800 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {platform.name}
                  {!platform.available && <span className="text-xs opacity-75">(Soon)</span>}
                </button>
              );
            })}
          </div>

          {/* Rank Type Tabs + Top Count Selector */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex gap-1 p-1 bg-gray-800 rounded-xl w-fit">
              {rankTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedRankType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    selectedRankType === type.id
                      ? 'bg-gray-900 text-gray-100 shadow-sm'
                      : 'text-gray-300 hover:text-gray-300'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.name}</span>
                </button>
              ))}
            </div>

            {/* Top Count Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTopCountOpen(!topCountOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl font-medium text-gray-300 hover:border-gray-600 hover:shadow-md transition-all"
              >
                <Trophy className="w-4 h-4 text-indigo-500" />
                Top {topCount}
                <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${topCountOpen ? 'rotate-180' : ''}`} />
              </button>
              {topCountOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setTopCountOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-40 min-w-[120px] overflow-hidden">
                    {topCounts.map(count => (
                      <button
                        key={count}
                        onClick={() => {
                          setTopCount(count);
                          setTopCountOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          topCount === count
                            ? 'bg-indigo-950/50 text-indigo-300'
                            : 'text-gray-300 hover:bg-gray-800/50'
                        }`}
                      >
                        Top {count}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rankings Table */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-800/50 border-b border-gray-800 text-sm font-semibold text-gray-300 uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className={selectedPlatform === 'kick' || selectedPlatform === 'bluesky' ? 'col-span-7' : 'col-span-5'}>Creator</div>
              <button
                onClick={() => handleSort('subscribers')}
                className="col-span-2 flex items-center justify-end gap-1 text-right hover:text-gray-300 transition-colors cursor-pointer"
              >
                <span>{followerLabel}</span>
                <SortIcon column="subscribers" />
              </button>
              {selectedPlatform === 'tiktok' && (
                <button
                  onClick={() => handleSort('views')}
                  className="col-span-2 flex items-center justify-end gap-1 text-right hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <span>Likes</span>
                  <SortIcon column="views" />
                </button>
              )}
              {selectedPlatform !== 'kick' && selectedPlatform !== 'tiktok' && selectedPlatform !== 'bluesky' && (
                <button
                  onClick={() => handleSort('views')}
                  className="col-span-2 flex items-center justify-end gap-1 text-right hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <span>Views</span>
                  <SortIcon column="views" />
                </button>
              )}
              <button
                onClick={() => handleSort('growth')}
                className="col-span-2 flex items-center justify-end gap-1.5 text-right hover:text-gray-300 transition-colors cursor-pointer group"
              >
                <span>30-Day Growth</span>
                <SortIcon column="growth" />
                <div className="relative">
                  <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                  <div className="absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none normal-case tracking-normal font-normal">
                    {selectedPlatform === 'youtube'
                      ? 'YouTube growth based on total views'
                      : selectedPlatform === 'kick'
                      ? 'Kick growth based on paid subscribers'
                      : selectedPlatform === 'tiktok'
                      ? 'TikTok growth based on followers'
                      : selectedPlatform === 'bluesky'
                      ? 'Bluesky growth based on followers'
                      : 'Twitch growth based on watch hours'}
                  </div>
                </div>
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="px-6 py-4">
                <TableSkeleton rows={10} />
              </div>
            )}

            {/* Error State - Fun Version */}
            {!loading && error && (
              <FunErrorState
                type={error.includes('fetch') ? 'server' : 'network'}
                message={error}
                onRetry={loadRankings}
                retryText="Retry"
              />
            )}

            {/* Empty State */}
            {!loading && !error && rankings.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-300 font-medium mb-2">No ranking data available yet</p>
                <p className="text-sm text-gray-300">Rankings will appear here once creators are tracked</p>
              </div>
            )}

            {/* Rankings List */}
            {!loading && !error && displayList.map((creator, index) => {
              if (creator.isSponsored) {
                return (
                  <Link
                    key={`sponsored-${creator.listingId}`}
                    to={`/${creator.platform}/${creator.username}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-amber-900/30 bg-amber-950/10 hover:bg-amber-950/20 transition-colors group"
                  >
                    {/* "Ad" badge in rank column — always visible on mobile and desktop */}
                    <div className="col-span-2 md:col-span-1 flex items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-900/40 border border-amber-800/50 text-amber-400 text-xs font-bold tracking-wide">
                        Ad
                      </span>
                    </div>

                    {/* Creator Info */}
                    <div className={`col-span-10 flex items-center gap-3 min-w-0 ${selectedPlatform === 'kick' || selectedPlatform === 'bluesky' ? 'md:col-span-7' : 'md:col-span-5'}`}>
                      <img
                        src={creator.profile_image || '/placeholder-avatar.svg'}
                        alt={creator.display_name}
                        loading="lazy"
                        className="w-12 h-12 rounded-xl object-cover bg-gray-800 flex-shrink-0"
                        onError={(e) => { e.target.src = '/placeholder-avatar.svg'; }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-100 truncate group-hover:text-amber-400 transition-colors">
                            {creator.display_name}
                          </p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
                            Sponsored
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 truncate">@{creator.username}</p>
                      </div>
                    </div>

                    {/* Empty stat columns to match layout */}
                    <div className="hidden md:block col-span-2 text-right" />
                    {selectedPlatform !== 'kick' && selectedPlatform !== 'bluesky' && (
                      <div className="hidden md:block col-span-2 text-right" />
                    )}
                    <div className="hidden md:block col-span-2 text-right" />
                  </Link>
                );
              }

              return (
                <Link
                  key={creator.id}
                  to={`/${creator.platform}/${creator.username}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-800 hover:bg-gray-800/50 transition-colors group"
                >
                  {/* Rank */}
                  <div className="col-span-2 md:col-span-1">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                      creator.originalRank === 1 ? 'bg-yellow-900/30 text-yellow-400' :
                      creator.originalRank === 2 ? 'bg-gray-800 text-gray-300' :
                      creator.originalRank === 3 ? 'bg-orange-900/30 text-orange-400' :
                      'bg-gray-800/50 text-gray-300'
                    }`}>
                      {creator.originalRank}
                    </span>
                  </div>

                  {/* Creator Info */}
                  <div className={`col-span-10 flex items-center gap-3 min-w-0 ${selectedPlatform === 'kick' || selectedPlatform === 'bluesky' ? 'md:col-span-7' : 'md:col-span-5'}`}>
                    <img
                      src={creator.profile_image || '/placeholder-avatar.svg'}
                      alt={creator.display_name}
                      loading="lazy"
                      className="w-12 h-12 rounded-xl object-cover bg-gray-800 flex-shrink-0"
                      onError={(e) => { e.target.src = '/placeholder-avatar.svg'; }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-100 truncate group-hover:text-indigo-400 transition-colors">
                        {creator.display_name}
                      </p>
                      <p className="text-sm text-gray-300 truncate">@{creator.username}</p>
                    </div>
                  </div>

                  {/* Stats - Desktop */}
                  <div className="hidden md:block col-span-2 text-right">
                    <span className="font-semibold text-gray-100">{formatNumber(creator.subscribers)}</span>
                  </div>
                  {selectedPlatform === 'tiktok' && (
                    <div className="hidden md:block col-span-2 text-right">
                      <span className="text-gray-300">{formatNumber(creator.totalViews)}</span>
                    </div>
                  )}
                  {selectedPlatform !== 'kick' && selectedPlatform !== 'tiktok' && selectedPlatform !== 'bluesky' && (
                    <div className="hidden md:block col-span-2 text-right">
                      <span className="text-gray-300">{formatNumber(creator.totalViews)}</span>
                    </div>
                  )}
                  <div className="hidden md:block col-span-2 text-right">
                    <span className={`font-medium ${creator.growth30d > 0 ? 'text-emerald-400' : creator.growth30d < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                      {creator.growth30d > 0 ? '+' : ''}{formatNumber(creator.growth30d)}
                    </span>
                  </div>

                  {/* Stats - Mobile */}
                  <div className="col-span-12 md:hidden flex flex-wrap gap-4 text-sm pl-11">
                    <span className="text-gray-300">
                      <span className="font-medium text-gray-100">{formatNumber(creator.subscribers)}</span> {followerLabel.toLowerCase()}
                    </span>
                    {selectedPlatform === 'tiktok' ? (
                      <span className="text-gray-300">
                        <span className="font-medium text-gray-100">{formatNumber(creator.totalLikes || creator.totalViews)}</span> likes
                      </span>
                    ) : selectedPlatform !== 'kick' && selectedPlatform !== 'bluesky' && (
                      <span className="text-gray-300">
                        <span className="font-medium text-gray-100">{formatNumber(creator.totalViews)}</span> views
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* SEO FAQ Section */}
          {!loading && !error && rankings.length > 0 && (
            <div className="mt-12 bg-gray-900 rounded-2xl border border-gray-800 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-6">
                {currentPlatform?.name} Rankings FAQ
              </h2>
              <div className="space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed">
                {selectedPlatform === 'youtube' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">Who has the most YouTube subscribers?</h3>
                      <p>{rankings[0]?.display_name} currently holds the top spot with {formatNumber(rankings[0]?.subscribers)} subscribers. Our rankings are updated daily using the YouTube Data API.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">How are the top YouTuber rankings calculated?</h3>
                      <p>We track subscriber counts, total views, and 30-day growth for every channel in our database. You can sort by subscribers, views, or fastest growing to find the top YouTubers by any metric.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">How often are these rankings updated?</h3>
                      <p>Stats are collected multiple times per day, so the rankings reflect the latest publicly available data from YouTube.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'tiktok' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">Who has the most TikTok followers?</h3>
                      <p>{rankings[0]?.display_name} sits at the top with {formatNumber(rankings[0]?.subscribers)} followers. We track follower counts and likes for TikTok's biggest creators.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">Who has the most TikTok likes?</h3>
                      <p>Our TikTok rankings track both followers and total likes. Sort by different metrics to see who's leading in each category.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'twitch' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">Who is the most followed Twitch streamer?</h3>
                      <p>{rankings[0]?.display_name} leads with {formatNumber(rankings[0]?.subscribers)} followers. We track all major Twitch streamers with daily updates.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">Which Twitch streamer has the most watch hours?</h3>
                      <p>We track hours watched for every Twitch streamer in our database. Sort by growth to see which streamers are pulling the most watch hours over the last 30 days.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'kick' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">Who is the top Kick streamer?</h3>
                      <p>{rankings[0]?.display_name} leads the Kick rankings with {formatNumber(rankings[0]?.subscribers)} paid subscribers. We track all major Kick streamers with daily updates.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">How are Kick rankings different from Twitch?</h3>
                      <p>Kick rankings are based on paid subscriber counts rather than free followers. This makes the numbers smaller but more meaningful in terms of direct creator support.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'bluesky' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">Who has the most Bluesky followers?</h3>
                      <p>{rankings[0]?.display_name} holds the top spot with {formatNumber(rankings[0]?.subscribers)} followers. We track major Bluesky accounts with daily updates via the AT Protocol API.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 mb-1">How are Bluesky rankings calculated?</h3>
                      <p>We track follower counts and post activity for Bluesky accounts. Rankings are updated daily using the public AT Protocol API, which requires no authentication.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

