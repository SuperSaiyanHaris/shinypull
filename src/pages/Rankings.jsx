import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Youtube, Twitch, TrendingUp, Users, Eye, Trophy, Info, ChevronDown } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import InstagramIcon from '../components/InstagramIcon';
import TikTokIcon from '../components/TikTokIcon';
import { TableSkeleton } from '../components/Skeleton';
import FunErrorState from '../components/FunErrorState';
import { getRankedCreators } from '../services/creatorService';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { analytics } from '../lib/analytics';
import { formatNumber } from '../lib/utils';
import logger from '../lib/logger';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', hoverColor: 'hover:bg-red-700', lightBg: 'bg-red-50', textColor: 'text-red-600', available: true },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'bg-pink-600', hoverColor: 'hover:bg-pink-700', lightBg: 'bg-pink-50', textColor: 'text-pink-600', available: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'bg-gray-900', hoverColor: 'hover:bg-gray-800', lightBg: 'bg-pink-50', textColor: 'text-pink-600', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'bg-purple-600', hoverColor: 'hover:bg-purple-700', lightBg: 'bg-purple-50', textColor: 'text-purple-600', available: true },
  { id: 'kick', name: 'Kick', icon: KickIcon, color: 'bg-green-500', hoverColor: 'hover:bg-green-600', lightBg: 'bg-green-50', textColor: 'text-green-600', available: true },
];

const topCounts = [50, 100, 500];

// SEO helpers per platform
function getSeoData(platform, rankType, topCount) {
  const p = platform?.name || 'Creator';
  const pid = platform?.id || 'youtube';
  const countLabel = `Top ${topCount}`;

  const metricLabel = rankType === 'views' ? 'Most Viewed' :
    rankType === 'growth' ? 'Fastest Growing' :
    pid === 'instagram' || pid === 'tiktok' || pid === 'twitch' ? 'Most Followed' :
    pid === 'kick' ? 'Most Subscribed' : 'Most Subscribed';

  const title = `${countLabel} ${p} ${rankType === 'growth' ? 'Fastest Growing' : rankType === 'views' ? 'Most Viewed' : pid === 'youtube' ? 'YouTubers' : p + ' Creators'} (2026) - Live Rankings`;

  const descriptions = {
    youtube: `The ${countLabel.toLowerCase()} most subscribed YouTubers ranked by subscribers, views, and growth. Updated daily with live stats. See who has the most YouTube subscribers in 2026.`,
    instagram: `${countLabel} most followed Instagram accounts ranked by followers and growth. Updated daily. Find out who has the most Instagram followers in 2026.`,
    tiktok: `${countLabel} most followed TikTok creators ranked by followers, likes, and growth. Updated daily. See who has the most TikTok followers in 2026.`,
    twitch: `${countLabel} most followed Twitch streamers ranked by followers, watch hours, and growth. Updated daily. Find the most watched Twitch streamers in 2026.`,
    kick: `${countLabel} Kick streamers ranked by paid subscribers and growth. Updated daily. See the top Kick streamers in 2026.`,
  };

  const keywords = {
    youtube: `top youtubers, top ${topCount} youtubers, most subscribed youtubers, biggest youtube channels, who has the most youtube subscribers, most popular youtubers 2026, youtube rankings`,
    instagram: `top instagram accounts, top ${topCount} instagram, most followed instagram, who has the most instagram followers, biggest instagram accounts 2026, instagram rankings`,
    tiktok: `top tiktokers, top ${topCount} tiktokers, most followed tiktok, who has the most tiktok followers, most tiktok likes, biggest tiktok accounts 2026, tiktok rankings`,
    twitch: `top twitch streamers, top ${topCount} twitch streamers, most followed twitch, most watched twitch streamers, most hours watched twitch, biggest twitch channels 2026, twitch rankings`,
    kick: `top kick streamers, top ${topCount} kick streamers, most subscribed kick, biggest kick channels 2026, kick rankings`,
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
    instagram: `Top ${topCount} Instagram Accounts`,
    tiktok: `Top ${topCount} TikTok Creators`,
    twitch: `Top ${topCount} Twitch Streamers`,
    kick: `Top ${topCount} Kick Streamers`,
  };
  return labels[pid] || `Top ${topCount} ${platform?.name} Creators`;
}

function getSubheading(platform) {
  const pid = platform?.id || 'youtube';
  const subs = {
    youtube: 'Ranked by subscribers, views, and growth. Updated daily.',
    instagram: 'Ranked by followers and growth. Updated daily.',
    tiktok: 'Ranked by followers, likes, and growth. Updated daily.',
    twitch: 'Ranked by followers, watch hours, and growth. Updated daily.',
    kick: 'Ranked by paid subscribers and growth. Updated daily.',
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
  const [selectedPlatform, setSelectedPlatform] = useState(urlPlatform || 'youtube');
  const [selectedRankType, setSelectedRankType] = useState('subscribers');
  const [topCount, setTopCount] = useState(100);
  const [topCountOpen, setTopCountOpen] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rankTypes = [
    { id: 'subscribers', name: selectedPlatform === 'instagram' ? 'Top Followers' : selectedPlatform === 'tiktok' ? 'Top Followers' : selectedPlatform === 'twitch' ? 'Top Followers' : selectedPlatform === 'kick' ? 'Top Paid Subs' : 'Top Subscribers', icon: Users },
    // Hide views for Kick, Instagram, and TikTok since APIs don't provide view data
    ...(selectedPlatform !== 'kick' && selectedPlatform !== 'instagram' && selectedPlatform !== 'tiktok' ? [{ id: 'views', name: 'Most Views', icon: Eye }] : []),
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

  const handlePlatformChange = (platformId) => {
    if (!platformId) return;
    setSelectedPlatform(platformId);
    navigate(`/rankings/${platformId}`);
    analytics.switchPlatform('rankings', platformId);
  };

  const followerLabel = selectedPlatform === 'instagram' ? 'Followers' : selectedPlatform === 'tiktok' ? 'Followers' : selectedPlatform === 'twitch' ? 'Followers' : selectedPlatform === 'kick' ? 'Paid Subs' : 'Subscribers';
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

      <div className="min-h-screen bg-gray-50">
        {/* Header - Dark */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{getH1Text(currentPlatform, topCount)}</h1>
            </div>
            <p className="text-sm sm:text-base text-slate-400">{getSubheading(currentPlatform)}</p>
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

          {/* Rank Type Tabs + Top Count Selector */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
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

            {/* Top Count Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTopCountOpen(!topCountOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <Trophy className="w-4 h-4 text-indigo-500" />
                Top {topCount}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${topCountOpen ? 'rotate-180' : ''}`} />
              </button>
              {topCountOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setTopCountOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 min-w-[120px] overflow-hidden">
                    {topCounts.map(count => (
                      <button
                        key={count}
                        onClick={() => {
                          setTopCount(count);
                          setTopCountOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          topCount === count
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-50'
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className={selectedPlatform === 'kick' || selectedPlatform === 'instagram' ? 'col-span-7' : 'col-span-5'}>Creator</div>
              <div className="col-span-2 text-right">{followerLabel}</div>
              {selectedPlatform === 'tiktok' && <div className="col-span-2 text-right">Likes</div>}
              {selectedPlatform !== 'kick' && selectedPlatform !== 'instagram' && selectedPlatform !== 'tiktok' && <div className="col-span-2 text-right">Views</div>}
              <div className="col-span-2 text-right flex items-center justify-end gap-1 group">
                <span>30-Day Growth</span>
                <div className="relative">
                  <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  <div className="absolute right-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    {selectedPlatform === 'youtube'
                      ? 'YouTube growth based on total views'
                      : selectedPlatform === 'kick'
                      ? 'Kick growth based on paid subscribers'
                      : selectedPlatform === 'instagram'
                      ? 'Instagram growth based on followers'
                      : selectedPlatform === 'tiktok'
                      ? 'TikTok growth based on followers'
                      : 'Twitch growth based on watch hours'}
                  </div>
                </div>
              </div>
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
                <div className={`col-span-10 flex items-center gap-3 min-w-0 ${selectedPlatform === 'kick' || selectedPlatform === 'instagram' ? 'md:col-span-7' : 'md:col-span-5'}`}>
                  <img
                    src={creator.profile_image || '/placeholder-avatar.svg'}
                    alt={creator.display_name}
                    loading="lazy"
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
                {selectedPlatform === 'tiktok' && (
                  <div className="hidden md:block col-span-2 text-right">
                    <span className="text-gray-600">{formatNumber(creator.totalViews)}</span>
                  </div>
                )}
                {selectedPlatform !== 'kick' && selectedPlatform !== 'instagram' && selectedPlatform !== 'tiktok' && (
                  <div className="hidden md:block col-span-2 text-right">
                    <span className="text-gray-600">{formatNumber(creator.totalViews)}</span>
                  </div>
                )}
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
                  {selectedPlatform === 'instagram' ? (
                    <span className="text-gray-500">
                      <span className="font-medium text-gray-900">{formatNumber(creator.totalPosts)}</span> posts
                    </span>
                  ) : selectedPlatform === 'tiktok' ? (
                    <span className="text-gray-500">
                      <span className="font-medium text-gray-900">{formatNumber(creator.totalLikes || creator.totalViews)}</span> likes
                    </span>
                  ) : selectedPlatform !== 'kick' && (
                    <span className="text-gray-500">
                      <span className="font-medium text-gray-900">{formatNumber(creator.totalViews)}</span> views
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* SEO FAQ Section */}
          {!loading && !error && rankings.length > 0 && (
            <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                {currentPlatform?.name} Rankings FAQ
              </h2>
              <div className="space-y-6 text-gray-600 text-sm sm:text-base leading-relaxed">
                {selectedPlatform === 'youtube' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Who has the most YouTube subscribers?</h3>
                      <p>{rankings[0]?.display_name} currently holds the top spot with {formatNumber(rankings[0]?.subscribers)} subscribers. Our rankings are updated daily using the YouTube Data API.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">How are the top YouTuber rankings calculated?</h3>
                      <p>We track subscriber counts, total views, and 30-day growth for every channel in our database. You can sort by subscribers, views, or fastest growing to find the top YouTubers by any metric.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">How often are these rankings updated?</h3>
                      <p>Stats are collected multiple times per day, so the rankings reflect the latest publicly available data from YouTube.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'instagram' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Who has the most Instagram followers?</h3>
                      <p>{rankings[0]?.display_name} leads with {formatNumber(rankings[0]?.subscribers)} followers. We track the biggest Instagram accounts and update follower counts regularly.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">How are Instagram rankings determined?</h3>
                      <p>We rank Instagram accounts by follower count and track growth over time. You can also sort by fastest growing to see which accounts are gaining followers the quickest.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'tiktok' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Who has the most TikTok followers?</h3>
                      <p>{rankings[0]?.display_name} sits at the top with {formatNumber(rankings[0]?.subscribers)} followers. We track follower counts and likes for TikTok's biggest creators.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Who has the most TikTok likes?</h3>
                      <p>Our TikTok rankings track both followers and total likes. Sort by different metrics to see who's leading in each category.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'twitch' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Who is the most followed Twitch streamer?</h3>
                      <p>{rankings[0]?.display_name} leads with {formatNumber(rankings[0]?.subscribers)} followers. We track all major Twitch streamers with daily updates.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Which Twitch streamer has the most watch hours?</h3>
                      <p>We track hours watched for every Twitch streamer in our database. Sort by growth to see which streamers are pulling the most watch hours over the last 30 days.</p>
                    </div>
                  </>
                )}
                {selectedPlatform === 'kick' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Who is the top Kick streamer?</h3>
                      <p>{rankings[0]?.display_name} leads the Kick rankings with {formatNumber(rankings[0]?.subscribers)} paid subscribers. We track all major Kick streamers with daily updates.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">How are Kick rankings different from Twitch?</h3>
                      <p>Kick rankings are based on paid subscriber counts rather than free followers. This makes the numbers smaller but more meaningful in terms of direct creator support.</p>
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

