import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, ArrowUpRight, Calculator, Scale, TrendingUp, Trophy,
  Youtube, Twitch, BarChart3, BookOpen, Sparkles, Zap, LineChart, Star,
} from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import { Music } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import { getAllPosts } from '../services/blogService';
import { getRankedCreators } from '../services/creatorService';
import { supabase } from '../lib/supabase';
import { formatNumber } from '../lib/utils';
import CreatorAvatar from '../components/CreatorAvatar';
import CountUp from '../components/CountUp';
import Sparkline from '../components/Sparkline';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', Icon: Youtube,     accent: '#ef4444', tone: 'red',     gradient: 'from-red-500 to-rose-600',          shadow: 'shadow-red-500/25',     hoverShadow: 'group-hover:shadow-red-500/40',     blurb: 'Subscribers · views · earnings' },
  { id: 'tiktok',  name: 'TikTok',  Icon: TikTokIcon,  accent: '#ec4899', tone: 'pink',    gradient: 'from-pink-500 to-rose-600',         shadow: 'shadow-pink-500/25',    hoverShadow: 'group-hover:shadow-pink-500/40',    blurb: 'Followers · likes · video count' },
  { id: 'twitch',  name: 'Twitch',  Icon: Twitch,      accent: '#a855f7', tone: 'purple',  gradient: 'from-purple-500 to-violet-700',     shadow: 'shadow-purple-500/25',  hoverShadow: 'group-hover:shadow-purple-500/40',  blurb: 'Followers · hours watched · peak' },
  { id: 'kick',    name: 'Kick',    Icon: KickIcon,    accent: '#22c55e', tone: 'green',   gradient: 'from-green-500 to-emerald-600',     shadow: 'shadow-green-500/25',   hoverShadow: 'group-hover:shadow-green-500/40',   blurb: 'Paid subs · hours watched' },
  { id: 'bluesky', name: 'Bluesky', Icon: BlueskyIcon, accent: '#0ea5e9', tone: 'sky',     gradient: 'from-sky-500 to-cyan-600',          shadow: 'shadow-sky-500/25',     hoverShadow: 'group-hover:shadow-sky-500/40',     blurb: 'Followers · posts' },
  { id: 'music',   name: 'Music',   Icon: Music,       accent: '#f59e0b', tone: 'amber',   gradient: 'from-amber-500 to-orange-600',      shadow: 'shadow-amber-500/25',   hoverShadow: 'group-hover:shadow-amber-500/40',   blurb: 'Listeners · plays' },
];

const HEADLINE_ROTATIONS = ['YouTuber', 'TikToker', 'Streamer', 'Artist', 'Creator'];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [latestPosts, setLatestPosts] = useState([]);
  const [topCreators, setTopCreators] = useState([]);
  const [liveStats, setLiveStats] = useState({ creators: null, dataPoints: null });
  const [wordIndex, setWordIndex] = useState(0);
  const navigate = useNavigate();

  // Rotating headline word
  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % HEADLINE_ROTATIONS.length), 2400);
    return () => clearInterval(id);
  }, []);

  // Live counts from DB.
  // `count: 'exact'` is exact-but-slow and times out on multi-million row tables;
  // `count: 'estimated'` uses Postgres reltuples for an instant approximation.
  useEffect(() => {
    Promise.all([
      supabase.from('creators').select('*', { count: 'exact', head: true }).then(r => r.count),
      supabase.from('creator_stats').select('*', { count: 'estimated', head: true }).then(r => r.count),
    ]).then(([creators, dataPoints]) => {
      setLiveStats({ creators: creators || 0, dataPoints: dataPoints || 0 });
    }).catch(() => {});
  }, []);

  // Top creators preview — for the hero product mock + below-fold leaderboard
  useEffect(() => {
    getRankedCreators('youtube', 'subscribers', 5).then(setTopCreators).catch(() => {});
  }, []);

  // Latest blog posts
  useEffect(() => {
    getAllPosts().then(posts => setLatestPosts(posts.slice(0, 3))).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <SEO
        title="Home"
        description="Creator analytics across YouTube, TikTok, Twitch, Kick, Bluesky, and Music. Real-time subscriber counts, follower growth, earnings estimates, and rankings — updated daily."
        keywords="youtube statistics, tiktok statistics, twitch statistics, kick statistics, subscriber count, follower count, creator analytics"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'ShinyPull',
            url: 'https://shinypull.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: 'https://shinypull.com/search?q={search_term_string}' },
              'query-input': 'required name=search_term_string',
            },
          }).replace(/<\/script>/gi, '<\\/script>'),
        }}
      />

      <main className="bg-[#fafafa] text-neutral-900">

        {/* ============== HERO ============== */}
        <section className="relative overflow-hidden border-b border-neutral-200">
          {/* Soft mesh gradient */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full bg-indigo-100/60 blur-3xl" />
            <div className="absolute -top-20 right-0 w-[30rem] h-[30rem] rounded-full bg-purple-100/40 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] rounded-full bg-amber-50/60 blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-12 sm:pb-20">

            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-7"
            >
              <Link
                to="/promote"
                className="group inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:bg-white shadow-sm transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span><span className="font-semibold text-neutral-900">Featured Listings</span> are live</span>
                <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-4xl mx-auto"
            >
              {/* Force first line + rotating word to ALWAYS sit on separate lines.
                  Otherwise a short word ('Artist') stays inline with 'every' and the page jumps. */}
              <span className="block">Analytics for every</span>
              <span className="relative block overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: '30%' }}
                    animate={{ opacity: 1, y: '0%' }}
                    exit={{ opacity: 0, y: '-30%' }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent"
                  >
                    {HEADLINE_ROTATIONS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 max-w-2xl mx-auto text-center text-base sm:text-lg text-neutral-600 leading-relaxed"
            >
              Live subscriber and follower counts, 30-day growth trends, and earnings estimates across YouTube, TikTok, Twitch, Kick, Bluesky, and Music. Updated daily. Free to use.
            </motion.p>

            {/* Search */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-9 max-w-xl mx-auto"
            >
              <div className="relative flex items-center bg-white rounded-2xl border border-neutral-200 shadow-sm focus-within:border-neutral-400 focus-within:shadow-md transition-all duration-200 overflow-hidden">
                <Search className="absolute left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any creator: MrBeast, Ninja, Charli D'Amelio..."
                  className="w-full pl-12 pr-32 py-4 bg-transparent text-neutral-900 placeholder-neutral-400 focus:outline-none text-base"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Search
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick chips below input */}
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs text-neutral-500">Try:</span>
                {['mrbeast', 'ninja', 'pewdiepie', 'kaicenat', 'taylor-swift'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                    className="text-xs font-medium text-neutral-600 hover:text-indigo-600 bg-white border border-neutral-200 hover:border-indigo-300 rounded-full px-2.5 py-1 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.form>

            {/* Platform tiles — tilted gradient cards. Each rotates straight + lifts on hover. */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-14"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-semibold text-center mb-5">
                Tracking
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
                {PLATFORMS.map(({ id, name, Icon, gradient, shadow, hoverShadow, blurb }, i) => {
                  // Alternate tilt direction for the "diagonal wave" effect
                  const baseTilt = i % 2 === 0 ? '-rotate-2' : 'rotate-2';
                  return (
                    <Link
                      key={id}
                      to={`/rankings/${id}`}
                      className="group relative block"
                    >
                      <div
                        className={`relative bg-gradient-to-br ${gradient} ${baseTilt} group-hover:rotate-0 group-hover:-translate-y-1.5 group-hover:scale-[1.04] transition-all duration-300 rounded-2xl p-4 sm:p-5 shadow-lg ${shadow} ${hoverShadow} overflow-hidden`}
                      >
                        {/* Decorative diagonal highlight */}
                        <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white mb-2 sm:mb-3 drop-shadow-sm" />
                        <p className="text-sm sm:text-base font-extrabold text-white tracking-tight">{name}</p>
                        <p className="hidden sm:block text-[10px] mt-1 text-white/80 leading-snug truncate" title={blurb}>
                          {blurb}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============== PRODUCT PREVIEW ============== */}
        <section className="relative -mt-4 mb-16 sm:mb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl bg-white border border-neutral-200 shadow-xl shadow-neutral-200/60 overflow-hidden"
            >
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200 bg-neutral-50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 max-w-md mx-auto bg-white border border-neutral-200 rounded-md px-3 py-1 text-[11px] text-neutral-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  shinypull.com/rankings/youtube
                </div>
                <div className="w-12" />
              </div>

              {/* Mock rankings table */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-neutral-900">Top YouTubers</h3>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-semibold text-emerald-700">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Updated 2 min ago</span>
                </div>

                <div className="space-y-1">
                  {(topCreators.length > 0 ? topCreators : Array(5).fill(null)).slice(0, 5).map((creator, i) => {
                    const fallbackNames = ['MrBeast', 'T-Series', 'Cocomelon', 'SET India', 'Vlad and Niki'];
                    const displayName = creator?.display_name || fallbackNames[i];
                    const rowInner = (
                      <div className="grid grid-cols-[28px_1fr_auto_auto] sm:grid-cols-[28px_1fr_100px_70px] items-center gap-3 sm:gap-4 px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded text-xs font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' :
                          i === 1 ? 'bg-neutral-100 text-neutral-600' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-neutral-50 text-neutral-400'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CreatorAvatar src={creator?.profile_image} name={displayName} size="sm" />
                          <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
                        </div>
                        <div className="hidden sm:flex items-center justify-end">
                          <Sparkline data={[10, 12, 11, 14, 16, 18, 17, 20]} width={80} height={20} trend="up" />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-neutral-900 tabular-nums">
                            {creator?.subscribers ? formatNumber(creator.subscribers) : '—'}
                          </p>
                        </div>
                      </div>
                    );
                    return creator?.platform && creator?.username ? (
                      <Link key={creator.id} to={`/${creator.platform}/${creator.username}`}>{rowInner}</Link>
                    ) : (
                      <div key={creator?.id || i}>{rowInner}</div>
                    );
                  })}
                </div>

                {/* Prominent CTA — clear next step for visitors */}
                <Link
                  to="/rankings/youtube"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  See full rankings <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Live stats strip under preview */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 grid grid-cols-3 max-w-3xl mx-auto bg-white border border-neutral-200 rounded-xl overflow-hidden"
            >
              {[
                { label: 'Creators tracked',  value: liveStats.creators ?? 0 },
                { label: 'Daily data points', value: liveStats.dataPoints ?? 0 },
                { label: 'Platforms',         value: 6 },
              ].map((s, i) => (
                <div key={s.label} className={`p-4 sm:p-5 text-center ${i !== 2 ? 'border-r border-neutral-200' : ''}`}>
                  <p className="text-xl sm:text-2xl font-extrabold text-neutral-900 tabular-nums">
                    <CountUp value={s.value} />
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============== FEATURES ============== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">What you can do</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900">
              Track creators like a pro
            </h2>
            <p className="mt-4 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
              Everything you need to follow the creator economy. No paywalls. Just data.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                Icon: Trophy,
                title: 'Live Rankings',
                body: 'See the top creators on each platform updated daily. Sort by followers, views, or fastest growing.',
                to: '/rankings',
                accent: 'amber',
              },
              {
                Icon: Search,
                title: 'Universal Search',
                body: 'Look up any creator across six platforms with one search. Hit ⌘K from anywhere.',
                to: '/search',
                accent: 'indigo',
              },
              {
                Icon: Scale,
                title: 'Head-to-Head Compare',
                body: 'Stack creators side-by-side. Subscribers, views, watch hours, growth rates, all at once.',
                to: '/compare',
                accent: 'violet',
              },
              {
                Icon: TrendingUp,
                title: 'Trending This Month',
                body: 'The fastest-growing creators across every platform. Catch trends before they peak.',
                to: '/trending',
                accent: 'emerald',
              },
              {
                Icon: Calculator,
                title: 'Earnings Estimator',
                body: 'Estimate any YouTuber\'s ad revenue based on view counts and average CPM ranges.',
                to: '/youtube/money-calculator',
                accent: 'green',
              },
              {
                Icon: LineChart,
                title: 'Daily Growth History',
                body: 'Look back at how a creator has grown over weeks and months. Charts, deltas, milestones.',
                to: '/youtube/mrbeast',
                accent: 'sky',
              },
            ].map((feat, i) => {
              const colorMap = {
                amber:    'bg-amber-50 text-amber-600 border-amber-200',
                indigo:   'bg-indigo-50 text-indigo-600 border-indigo-200',
                violet:   'bg-violet-50 text-violet-600 border-violet-200',
                emerald:  'bg-emerald-50 text-emerald-600 border-emerald-200',
                green:    'bg-green-50 text-green-600 border-green-200',
                sky:      'bg-sky-50 text-sky-600 border-sky-200',
              };
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    to={feat.to}
                    className="group block h-full bg-white border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className={`w-11 h-11 rounded-xl border ${colorMap[feat.accent]} flex items-center justify-center mb-5`}>
                      <feat.Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">{feat.title}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-4">{feat.body}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 group-hover:gap-2 transition-all">
                      Open
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ============== B2B CTA STRIP ============== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-white border border-amber-200 p-8 sm:p-12"
          >
            {/* Soft amber accent blob in corner */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-200/50 blur-3xl pointer-events-none" />

            <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-5 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Featured Listings
                </div>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-3">
                  Get your creator in the rankings.
                </h3>
                <p className="text-base text-neutral-700 leading-relaxed">
                  Sponsored placements inside our live rankings tables. <span className="font-semibold text-neutral-900">$49/mo</span> for Basic,{' '}
                  <span className="font-semibold text-neutral-900">$149/mo</span> for top-of-page Premium slots. Cancel anytime.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                <Link
                  to="/promote"
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-amber-500/20 hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
                >
                  See plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/rankings"
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-800 font-semibold rounded-xl transition-all duration-200 whitespace-nowrap"
                >
                  See live rankings
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ============== BLOG TEASER ============== */}
        {latestPosts.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">From the blog</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">Latest in creator economy</h2>
              </div>
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 hover:gap-2 transition-all">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {latestPosts.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:border-neutral-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    {post.image && (
                      <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
                        <img
                          src={post.image}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full mb-3">
                          {post.category}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-neutral-900 mb-1.5 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">{post.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ============== FOOTER CTA ============== */}
        <section className="border-t border-neutral-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-3">
              Start tracking creators in seconds.
            </h2>
            <p className="text-base text-neutral-600 max-w-xl mx-auto mb-7">
              Free. No signup required to browse. Sign in to follow creators, save comparisons, and get growth alerts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/rankings"
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Browse rankings
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('openCommandPalette'))}
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-900 font-semibold rounded-xl transition-all duration-200"
              >
                <Search className="w-4 h-4" />
                Search creators
                <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-100 border border-neutral-200 rounded text-neutral-500">
                  <span className="text-xs leading-none">⌘</span>K
                </kbd>
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
