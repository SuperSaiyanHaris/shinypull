import { Link } from 'react-router-dom';
import { Search, Youtube, Twitch, BarChart3, ArrowRight, Clock, ChevronRight, Calculator, DollarSign, X, GitCompare } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import BlueskyIcon from '../components/BlueskyIcon';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { getAllPosts } from '../services/blogService';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600', bgColor: 'bg-red-950/30', textColor: 'text-red-600', ringColor: 'ring-red-800', stats: '72M+ channels', available: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-950/30', textColor: 'text-pink-400', ringColor: 'ring-pink-800', stats: '1B+ accounts', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-950/30', textColor: 'text-purple-600', ringColor: 'ring-purple-800', stats: '7M+ channels', available: true },
  { id: 'kick', name: 'Kick', icon: KickIcon, color: 'from-green-500 to-green-600', bgColor: 'bg-green-950/30', textColor: 'text-green-600', ringColor: 'ring-green-800', stats: '10M+ channels', available: true },
  { id: 'bluesky', name: 'Bluesky', icon: BlueskyIcon, color: 'from-sky-500 to-sky-600', bgColor: 'bg-sky-950/30', textColor: 'text-sky-400', ringColor: 'ring-sky-800', stats: '40M+ accounts', available: true },
];

const typewriterWords = [
  { text: 'YouTube Creator', color: 'text-red-500' },
  { text: 'TikTok Star', color: 'text-pink-400' },
  { text: 'Twitch Streamer', color: 'text-purple-600' },
  { text: 'Kick Channel', color: 'text-green-500' },
  { text: 'Bluesky Creator', color: 'text-sky-400' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [latestPosts, setLatestPosts] = useState([]);
  const navigate = useNavigate();

  // Typewriter effect
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = typewriterWords[wordIndex].text;
    let timeout;

    if (!isDeleting && displayText === currentWord) {
      // Pause at full word
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      // Move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % typewriterWords.length);
    } else {
      // Type or delete
      timeout = setTimeout(() => {
        setDisplayText(prev =>
          isDeleting ? prev.slice(0, -1) : currentWord.slice(0, prev.length + 1)
        );
      }, isDeleting ? 40 : 80);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex]);

  useEffect(() => {
    getAllPosts().then(posts => setLatestPosts(posts.slice(0, 3)));
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
        description="Track YouTube, TikTok, Twitch, and Kick statistics. View subscriber counts, follower growth, earnings estimates, rankings and analytics for your favorite creators."
        keywords="youtube statistics, tiktok statistics, twitch statistics, kick statistics, subscriber count, follower count, social blade alternative, creator analytics, earnings calculator"
      />

      <div className="min-h-screen bg-gray-900">
        {/* Hero Section - Clean Light with Typewriter */}
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-[#0a0a0f]">
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-50"></div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
            <div className="text-center max-w-4xl mx-auto">
              {/* Platform chips - 3+2 on mobile, single row on desktop */}
              <div className="mb-8 sm:mb-10">
                {/* Mobile: row 1 — YouTube, TikTok, Twitch */}
                <div className="flex sm:hidden items-center justify-center gap-2 mb-2">
                  {platforms.slice(0, 3).map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <Link
                        key={platform.id}
                        to={`/search?platform=${platform.id}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 ${platform.bgColor} rounded-full hover:ring-2 ${platform.ringColor} transition-all duration-200`}
                      >
                        <Icon className={`w-4 h-4 ${platform.textColor}`} />
                        <span className={`text-xs font-semibold ${platform.textColor}`}>{platform.name}</span>
                      </Link>
                    );
                  })}
                </div>
                {/* Mobile: row 2 — Kick, Bluesky */}
                <div className="flex sm:hidden items-center justify-center gap-6">
                  {platforms.slice(3).map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <Link
                        key={platform.id}
                        to={`/search?platform=${platform.id}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 ${platform.bgColor} rounded-full hover:ring-2 ${platform.ringColor} transition-all duration-200`}
                      >
                        <Icon className={`w-4 h-4 ${platform.textColor}`} />
                        <span className={`text-xs font-semibold ${platform.textColor}`}>{platform.name}</span>
                      </Link>
                    );
                  })}
                </div>
                {/* Desktop: single row */}
                <div className="hidden sm:flex items-center justify-center gap-3">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <Link
                        key={platform.id}
                        to={`/search?platform=${platform.id}`}
                        className={`flex items-center gap-2 px-4 py-2 ${platform.bgColor} rounded-full hover:ring-2 ${platform.ringColor} transition-all duration-200`}
                      >
                        <Icon className={`w-4 h-4 ${platform.textColor}`} />
                        <span className={`text-sm font-semibold ${platform.textColor}`}>{platform.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Typewriter heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-100 mb-5 sm:mb-6 tracking-tight leading-tight">
                Find any{' '}
                <span className={`${typewriterWords[wordIndex].color} inline-block min-w-[200px] sm:min-w-[300px] text-left`}>
                  {displayText}
                  <span className="animate-pulse text-indigo-400">|</span>
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
                Real-time stats, growth tracking, and analytics across every major platform.
              </p>

              {/* Search Bar - Glowing on focus */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6 px-4">
                <div className="space-y-3">
                  <div className="relative group">
                    {/* Glow effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur-lg transition-all duration-500"></div>
                    <div className="relative flex items-center bg-gray-900 rounded-2xl shadow-lg shadow-black/20 border border-gray-700 group-focus-within:border-indigo-500 group-focus-within:shadow-indigo-500/20 transition-all duration-300">
                      <Search className="absolute left-5 w-5 h-5 text-gray-300" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a creator (e.g., MrBeast, Ninja)"
                        className="w-full pl-14 pr-12 py-4 sm:py-5 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-base sm:text-lg rounded-2xl"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-300 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto sm:block px-8 py-3.5 sm:py-4 text-base sm:text-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-[#0a0a0f]">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100">Everything you need to track creators</h2>
              <p className="mt-3 text-gray-400 text-base sm:text-lg">Real data. No guessing. Updated daily.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
              {/* Card 1 — Search */}
              <Link
                to="/search"
                className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/60 rounded-2xl p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10"
              >
                {/* glow blob */}
                <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
                {/* card number */}
                <span className="absolute top-6 right-7 text-3xl font-black text-gray-800 select-none group-hover:text-gray-700 transition-colors">01</span>

                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                    <Search className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">Find Any Creator</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Search across YouTube, TikTok, Twitch, Kick, and Bluesky. Real profiles with live stats.</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 group-hover:gap-3 transition-all duration-200">
                    Search now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>

              {/* Card 2 — Rankings */}
              <Link
                to="/rankings"
                className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-amber-500/60 rounded-2xl p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/10"
              >
                <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors duration-500" />
                <span className="absolute top-6 right-7 text-3xl font-black text-gray-800 select-none group-hover:text-gray-700 transition-colors">02</span>

                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform duration-300">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">Top Rankings</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">See who's growing the fastest. Leaderboards updated daily across every platform.</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 group-hover:gap-3 transition-all duration-200">
                    View rankings <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>

              {/* Card 3 — Compare */}
              <Link
                to="/compare"
                className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-emerald-500/60 rounded-2xl p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
                <span className="absolute top-6 right-7 text-3xl font-black text-gray-800 select-none group-hover:text-gray-700 transition-colors">03</span>

                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                    <GitCompare className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">Compare Creators</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Put any creators head to head. Subscribers, views, and growth. All in one chart.</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 group-hover:gap-3 transition-all duration-200">
                    Compare now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Calculator Promo */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#0a0a0f]">
          <div className="max-w-6xl mx-auto">
            <Link
              to="/youtube/money-calculator"
              className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-yellow-500/50 rounded-2xl p-7 sm:p-10 flex flex-col sm:flex-row items-start gap-6 sm:gap-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-500/10"
            >
              {/* Glow blobs */}
              <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-colors duration-500" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/15 transition-colors duration-500" />

              {/* Ghost label — bottom right, away from content */}
              <span className="pointer-events-none absolute bottom-5 right-7 text-6xl sm:text-8xl font-black text-gray-800 select-none leading-none group-hover:text-gray-700 transition-colors">$$$</span>

              {/* Icon box */}
              <div className="relative flex-shrink-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:scale-105 transition-transform duration-300">
                <DollarSign className="w-8 h-8 text-white" />
              </div>

              {/* Text + CTA */}
              <div className="relative flex-1 min-w-0">
                <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-1">Free Tool</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 mb-2">YouTube Money Calculator</h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mb-6">
                  Estimate how much any YouTuber earns from their videos. Enter a channel and get a real earnings range based on view counts and CPM data.
                </p>
                <span className="inline-flex items-center gap-2.5 px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold rounded-xl group-hover:bg-yellow-500/20 group-hover:border-yellow-500/50 group-hover:gap-4 transition-all duration-200 whitespace-nowrap">
                  <Calculator className="w-5 h-5" />
                  Try Calculator
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>


        {/* Latest Blog Posts */}
        {latestPosts.length > 0 && (
          <section className="w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-[#0a0a0f]">
            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className="flex items-end justify-between mb-12 sm:mb-16">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100">Latest from the Blog</h2>
                  <p className="mt-3 text-gray-400 text-base sm:text-lg">Tips, guides, and insights for creators</p>
                </div>
                <Link
                  to="/blog"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:gap-3 transition-all duration-200"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
                {latestPosts.map((post, index) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/60 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col"
                  >
                    {/* Glow blob */}
                    <div className="pointer-events-none absolute -bottom-10 -right-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />

                    {/* Image */}
                    <div className="overflow-hidden flex-shrink-0">
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="relative p-6 flex flex-col flex-1">
                      <span className="inline-block px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full mb-3 self-start">
                        {post.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-100 mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors duration-200">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-2 flex-1">
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {post.read_time}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 group-hover:gap-3 transition-all duration-200">
                          Read more <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                to="/blog"
                className="mt-8 flex sm:hidden items-center justify-center gap-2 text-indigo-400 font-medium hover:gap-4 transition-all"
              >
                View all posts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-[#0a0a0f]">
          <div className="max-w-6xl mx-auto">
            <div className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/40 rounded-2xl p-10 sm:p-14 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
              {/* Glow blobs */}
              <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-500" />

              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 mb-3">Ready to dive in?</h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto text-base sm:text-lg">
                  Search for any creator and get real-time analytics instantly.
                </p>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
