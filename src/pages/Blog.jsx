import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Loader2, BookOpen, Filter, X, Search } from 'lucide-react';
import SEO from '../components/SEO';
import { getAllPosts, getAllCategories } from '../services/blogService';

const PAGE_SIZE = 9;

// Each category gets its own color identity
const CATEGORY_COLORS = {
  'YouTube News':    { pill: 'bg-red-500/10 text-red-400 border border-red-500/20',       sidebar: 'bg-red-500/10 text-red-300',      dot: 'bg-red-500' },
  'Streaming Gear':  { pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', sidebar: 'bg-amber-500/10 text-amber-300',   dot: 'bg-amber-500' },
  'Growth Tips':     { pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', sidebar: 'bg-emerald-500/10 text-emerald-300', dot: 'bg-emerald-500' },
  'Creator Economy': { pill: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',       sidebar: 'bg-sky-500/10 text-sky-300',       dot: 'bg-sky-500' },
  'TikTok':          { pill: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',    sidebar: 'bg-pink-500/10 text-pink-300',     dot: 'bg-pink-500' },
  'Twitch':          { pill: 'bg-purple-500/10 text-purple-400 border border-purple-500/20', sidebar: 'bg-purple-500/10 text-purple-300', dot: 'bg-purple-500' },
  'Kick':            { pill: 'bg-green-500/10 text-green-400 border border-green-500/20', sidebar: 'bg-green-500/10 text-green-300',   dot: 'bg-green-500' },
  'Bluesky':         { pill: 'bg-sky-400/10 text-sky-300 border border-sky-400/20',       sidebar: 'bg-sky-400/10 text-sky-200',       dot: 'bg-sky-400' },
};
const DEFAULT_COLORS = { pill: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', sidebar: 'bg-indigo-500/10 text-indigo-300', dot: 'bg-indigo-500' };

function getCatColors(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLORS;
}

function isNewPost(publishedAt) {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    async function fetchData() {
      const [postsData, categoriesData] = await Promise.all([
        getAllPosts(),
        getAllCategories(),
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Reset pagination when filters or search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategories, searchQuery]);

  const toggleCategory = (category) => {
    if (category === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        const withoutAll = prev.filter(c => c !== 'all');
        if (prev.includes(category)) {
          const updated = withoutAll.filter(c => c !== category);
          return updated.length === 0 ? ['all'] : updated;
        }
        return [...withoutAll, category];
      });
    }
  };

  const categoryCounts = {};
  posts.forEach(p => {
    if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const filteredPosts = posts
    .filter(p => selectedCategories.includes('all') || selectedCategories.includes(p.category))
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    });

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1, 1 + visibleCount);
  const remaining = filteredPosts.length - 1 - visibleCount;
  const hasMore = remaining > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] dot-grid flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const renderSidebar = (onSelect) => (
    <nav className="space-y-0.5">
      {/* All Posts — clear-filter action */}
      <button
        onClick={() => onSelect('all')}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          selectedCategories.includes('all')
            ? 'bg-gray-800 text-gray-100'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
        }`}
      >
        <span>All Posts</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-400 font-semibold tabular-nums">
          {posts.length}
        </span>
      </button>

      {categories.map(category => {
        const count = categoryCounts[category] || 0;
        const isActive = selectedCategories.includes(category);
        const colors = getCatColors(category);
        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive ? colors.sidebar : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot} ${isActive ? 'opacity-100' : 'opacity-35'}`} />
              <span>{category}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800/60 text-gray-500 font-semibold tabular-nums">
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <SEO
        title="Blog - Creator Tips, Streaming Gear & Industry Insights"
        description="Expert guides on streaming equipment, YouTube growth strategies, and creator economy insights. Grow your channel with data-driven advice."
      />

      <div className="min-h-screen bg-[#0a0a0f] dot-grid">

        {/* Header — with sky glow matching Blog's color identity */}
        <div className="relative overflow-hidden border-b border-gray-800/60">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-950/30 to-transparent" />
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[480px] h-72 bg-sky-500/5 rounded-full blur-3xl" />
          <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-11 h-11 sm:w-13 sm:h-13 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100">Creator Resources</h1>
              </div>
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
                Expert guides on streaming gear, growth strategies, and industry insights to help you succeed as a creator
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar + Content */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">

              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-52 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 px-3">
                    Categories
                  </h3>
                  {renderSidebar(toggleCategory)}
                </div>
              </aside>

              {/* Mobile FAB */}
              <div className="lg:hidden fixed bottom-6 left-6 z-40">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full shadow-lg transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {!selectedCategories.includes('all') && (
                    <span className="ml-0.5 w-5 h-5 bg-white/20 rounded-full text-xs font-bold flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile Slide Panel */}
              {mobileFiltersOpen && (
                <>
                  <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileFiltersOpen(false)} />
                  <div className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-900 z-50 shadow-2xl overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-100">Filter by Category</h3>
                        <button onClick={() => setMobileFiltersOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                          <X className="w-5 h-5 text-gray-300" />
                        </button>
                      </div>
                      {renderSidebar(cat => { toggleCategory(cat); })}
                    </div>
                  </div>
                </>
              )}

              {/* Main Content */}
              <div className="flex-1 min-w-0">

                {/* Search bar */}
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:border-gray-600 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Empty state */}
                {filteredPosts.length === 0 && (
                  <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No posts found.</p>
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-gray-400 hover:text-gray-200 underline transition-colors">
                        Clear search
                      </button>
                    )}
                  </div>
                )}

                {/* Featured Post */}
                {featuredPost && (
                  <Link to={`/blog/${featuredPost.slug}`} className="block mb-8 group">
                    <article className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300">
                      <div className="md:flex">
                        <div className="md:w-1/2 min-h-64">
                          <img
                            src={featuredPost.image}
                            alt={featuredPost.title}
                            className="w-full h-64 md:h-full object-cover"
                          />
                        </div>
                        <div className="md:w-1/2 p-8 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getCatColors(featuredPost.category).pill}`}>
                              {featuredPost.category}
                            </span>
                            {isNewPost(featuredPost.published_at) && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                New
                              </span>
                            )}
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3 group-hover:text-gray-300 transition-colors">
                            {featuredPost.title}
                          </h2>
                          <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-2">
                            {featuredPost.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(featuredPost.published_at)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {featuredPost.read_time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                )}

                {/* Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {gridPosts.map(post => {
                    const colors = getCatColors(post.category);
                    return (
                      <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                        <article className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 h-full flex flex-col">
                          <div className="relative">
                            <img
                              src={post.image}
                              alt={post.title}
                              loading="lazy"
                              className="w-full h-48 object-cover"
                            />
                            {isNewPost(post.published_at) && (
                              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
                                New
                              </span>
                            )}
                          </div>
                          <div className="p-5 flex flex-col flex-1">
                            <span className={`inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${colors.pill}`}>
                              {post.category}
                            </span>
                            <h3 className="text-base font-bold text-gray-100 mb-2 group-hover:text-gray-300 transition-colors line-clamp-2 flex-1">
                              {post.title}
                            </h3>
                            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">
                              {post.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-gray-800/60">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(post.published_at)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {post.read_time}
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                      className="px-8 py-3 bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-gray-100 font-medium rounded-xl transition-all duration-200"
                    >
                      Load more — {remaining} remaining
                    </button>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-16 group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/40 rounded-2xl p-8 md:p-12 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
                  <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
                  <div className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-500" />
                  <div className="relative">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-100 mb-4">
                      Track Your Channel's Growth
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                      Use ShinyPull's free analytics to monitor your subscribers, views, and compare your growth with top creators.
                    </p>
                    <Link
                      to="/search"
                      className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      Search Creators
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
