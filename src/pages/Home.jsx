import { Link } from 'react-router-dom';
import { Search, Youtube, Twitch, TrendingUp, BarChart3, ArrowRight, Clock, ChevronRight, Calculator, DollarSign, ShoppingBag, ExternalLink, X } from 'lucide-react';
import KickIcon from '../components/KickIcon';
import TikTokIcon from '../components/TikTokIcon';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { getAllPosts } from '../services/blogService';
import { getActiveProducts } from '../services/productsService';

const platforms = [
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-600', stats: '72M+ channels', available: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'from-gray-900 to-gray-800', bgColor: 'bg-pink-50', textColor: 'text-pink-600', stats: '1B+ accounts', available: true },
  { id: 'twitch', name: 'Twitch', icon: Twitch, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600', stats: '7M+ channels', available: true },
  { id: 'kick', name: 'Kick', icon: KickIcon, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600', stats: 'New!', available: true },
];

const features = [
  {
    icon: Search,
    title: 'Search Creators',
    description: 'Find any creator across all major platforms with real-time data.',
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
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllPosts().then(posts => setLatestPosts(posts.slice(0, 3)));
    getActiveProducts().then(products => {
      // Categorize products (same logic as Gear page)
      const categorizeProduct = (product) => {
        const name = (product.name || '').toLowerCase();
        const slug = (product.slug || '').toLowerCase();
        
        if (name.includes('microphone') || name.includes('mic ') || slug.includes('mic') || name.includes('sm7b') || name.includes('k669')) {
          return 'microphones';
        }
        if (name.includes('camera') || name.includes('webcam') || slug.includes('cam') || name.includes('zv-1') || name.includes('zv1') || name.includes('kiyo')) {
          return 'cameras';
        }
        if (name.includes('light') || name.includes('softbox') || name.includes('ring light') || slug.includes('light') || slug.includes('green-screen')) {
          return 'lighting';
        }
        if (name.includes('audio interface') || name.includes('xlr') || name.includes('mixer') || name.includes('goxlr') || name.includes('rodecaster') || name.includes('cloudlifter') || name.includes('scarlett') || name.includes('beacn') || slug.includes('wave-xlr')) {
          return 'audio';
        }
        if (name.includes('capture card') || name.includes('cam link') || slug.includes('hd60') || slug.includes('cam-link') || slug.includes('gamer-mini')) {
          return 'capture';
        }
        return 'accessories';
      };
      
      // Group products by category
      const byCategory = {};
      products.forEach(product => {
        const category = categorizeProduct(product);
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(product);
      });
      
      // Daily rotation with category diversity
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Simple hash function using date as seed
      const hashWithSeed = (str, seed) => {
        let hash = seed;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash = hash & hash;
        }
        return Math.abs(hash);
      };
      
      const seed = hashWithSeed(today, 0);
      
      // Get categories with products, shuffle them daily
      const categories = Object.keys(byCategory).sort((a, b) => {
        return hashWithSeed(a, seed) - hashWithSeed(b, seed);
      });
      
      // Pick one product from each of the first 4 categories
      const selected = [];
      for (let i = 0; i < Math.min(4, categories.length); i++) {
        const categoryProducts = byCategory[categories[i]];
        // Shuffle products within category and pick first one
        const shuffled = [...categoryProducts].sort((a, b) => {
          const hashA = hashWithSeed(a.id || a.slug, seed);
          const hashB = hashWithSeed(b.id || b.slug, seed);
          return hashA - hashB;
        });
        selected.push(shuffled[0]);
      }
      
      setFeaturedProducts(selected);
    });
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
                Track followers, views, and growth for your favorite YouTube, TikTok, Twitch, and Kick creators. Get detailed analytics and insights.
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
                        className="w-full pl-14 pr-12 py-5 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-lg rounded-2xl font-medium"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
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

              {/* Platform Cards - Horizontal pills on mobile, grid on desktop */}
              {/* Mobile: 2x2 grid pills */}
              <div className="grid grid-cols-2 sm:hidden gap-2 px-4 -mx-4">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  if (platform.available) {
                    return (
                      <Link
                        key={platform.id}
                        to={`/rankings/${platform.id}`}
                        className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 border border-white/10 hover:bg-white/20 active:bg-white/25 transition-all"
                      >
                        <div className={`w-7 h-7 ${platform.bgColor} rounded-full flex items-center justify-center`}>
                          {Icon && <Icon className={`w-3.5 h-3.5 ${platform.textColor}`} />}
                        </div>
                        <span className="text-sm font-medium text-white whitespace-nowrap">{platform.name}</span>
                      </Link>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Desktop: 5-column grid cards */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
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
                        <h2 className="text-base font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                          {platform.name}
                        </h2>
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
                      <h2 className="text-base font-semibold text-slate-500 mb-1">{platform.name}</h2>
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

        {/* Calculator Promo Banner */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-emerald-500 to-teal-600">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    YouTube Money Calculator
                  </h3>
                  <p className="text-emerald-100 text-lg">
                    Estimate how much YouTubers earn from their videos
                  </p>
                </div>
              </div>
              <Link
                to="/youtube/money-calculator"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Calculator className="w-5 h-5" />
                Try Calculator
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Recommended Gear */}
        {featuredProducts.length > 0 && (
          <section className="w-full px-4 sm:px-6 lg:px-8 py-24 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    Recommended Gear
                  </h2>
                  <p className="text-lg text-gray-600">
                    Top picks for streamers and content creators
                  </p>
                </div>
                <Link
                  to="/gear"
                  className="hidden sm:flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                >
                  View all gear <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {featuredProducts.map(product => {
                  const affiliateLink = product.affiliate_link || product.affiliateLink;
                  const hasImage = product.image && product.image.trim() !== '';

                  return (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col group">
                      <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden mb-3">
                        {hasImage ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-indigo-300" />
                          </div>
                        )}
                      </div>
                      {product.badge && (
                        <span className="inline-block self-start px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-2">
                          {product.badge}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-auto">
                        <p className="text-lg font-bold text-indigo-600">{product.price}</p>
                        {affiliateLink ? (
                          <a
                            href={affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Buy <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg">Soon</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/gear"
                className="mt-8 flex sm:hidden items-center justify-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                View all gear <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

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
                Search for any creator and get detailed analytics instantly.
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
