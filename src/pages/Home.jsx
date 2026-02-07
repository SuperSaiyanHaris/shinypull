import { Link } from 'react-router-dom';
import { Search, Youtube, Twitch, Instagram, TrendingUp, BarChart3, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { getAllPosts } from '../services/blogService';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-600', stats: '72M+ channels', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600', stats: '7M+ channels', available: true },
  { id: 'tiktok', name: 'TikTok', icon: null, color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50', textColor: 'text-pink-600', stats: 'Coming Soon', available: false },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-orange-500', bgColor: 'bg-gradient-to-br from-purple-50 to-orange-50', textColor: 'text-purple-600', stats: 'Coming Soon', available: false },
];

const features = [
  {
    icon: Search,
    title: 'Search Creators',
    description: 'Find any creator across YouTube and Twitch with real-time data.',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    link: '/search',
  },
  {
    icon: TrendingUp,
    title: 'Track Growth',
    description: 'See daily, weekly, and monthly follower and view growth statistics.',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    link: '/rankings/youtube',
  },
  {
    icon: BarChart3,
    title: 'Compare & Rank',
    description: 'Compare creators and see how they rank against others.',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    link: '/compare',
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [latestPosts, setLatestPosts] = useState([]);
  const navigate = useNavigate();

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
        description="Track YouTube, Twitch, TikTok, Instagram & Twitter statistics. View subscriber counts, earnings estimates, rankings and growth analytics for your favorite creators."
        keywords="youtube statistics, twitch statistics, subscriber count, social blade alternative, creator analytics, earnings calculator"
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section - Dark Gradient with Mesh */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0">
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            {/* Gradient orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-xs sm:text-sm font-medium text-indigo-300 mb-6 sm:mb-8">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                Real-time creator analytics
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight px-2">
                Social Media{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Statistics
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                Track followers, views, and growth for your favorite YouTube and Twitch creators. Get detailed analytics and insights.
              </p>

              {/* Search Bar - Modern Clean Design */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12 sm:mb-16 px-4">
                <div className="space-y-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition duration-300"></div>
                    <div className="relative flex items-center bg-white rounded-2xl shadow-2xl border-2 border-white/50">
                      <Search className="absolute left-5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a creator (e.g., MrBeast, Ninja)"
                        className="w-full pl-14 pr-6 py-5 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-lg rounded-2xl font-medium"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto sm:block px-8 py-4 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all duration-200 shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-0.5"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Platform Cards - Glass style */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
                {platforms.map((platform) => {
                  const Icon = platform.icon;

                  if (platform.available) {
                    return (
                      <Link
                        key={platform.id}
                        to={`/rankings/${platform.id}`}
                        className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className={`w-14 h-14 ${platform.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          {Icon ? (
                            <Icon className={`w-7 h-7 ${platform.textColor}`} />
                          ) : (
                            <span className={`${platform.textColor} font-bold text-lg`}>{platform.name.slice(0, 2)}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                          {platform.name}
                        </h3>
                        <p className="text-sm text-slate-400">{platform.stats}</p>
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={platform.id}
                      className="relative bg-white/5 rounded-2xl p-6 border border-white/5 opacity-50 cursor-not-allowed"
                    >
                      <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        {Icon ? (
                          <Icon className="w-7 h-7 text-slate-500" />
                        ) : (
                          <span className="text-slate-500 font-bold text-lg">{platform.name.slice(0, 2)}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-500 mb-1">{platform.name}</h3>
                      <p className="text-sm text-slate-600">{platform.stats}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom fade to white */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
        </section>

        {/* Features Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Track Creator Growth
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to analyze and track social media creators
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Link
                  key={index}
                  to={feature.link}
                  className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 bg-gradient-to-r ${feature.color} bg-clip-text`} style={{ color: feature.color.includes('emerald') ? '#10b981' : feature.color.includes('blue') ? '#6366f1' : '#8b5cf6' }} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Blog Posts */}
        {latestPosts.length > 0 && (
          <section className="w-full px-4 sm:px-6 lg:px-8 py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    Latest from the Blog
                  </h2>
                  <p className="text-lg text-gray-600">
                    Tips, guides, and insights for creators
                  </p>
                </div>
                <Link
                  to="/blog"
                  className="hidden sm:flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                >
                  View all posts <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {latestPosts.map(post => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group"
                  >
                    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6 flex flex-col flex-1">
                        <span className="text-indigo-600 font-medium text-sm mb-2">
                          {post.category}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                          {post.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.read_time}
                          </span>
                          <span className="text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read more <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              <Link
                to="/blog"
                className="mt-8 flex sm:hidden items-center justify-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                View all posts <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* CTA Section - Dark Footer */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          {/* Top fade from white */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent"></div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Start tracking your favorite creators
              </h2>
              <p className="text-slate-300 mb-8 max-w-xl mx-auto text-lg">
                Search for any YouTube or Twitch creator and get detailed analytics instantly.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
