import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Loader2, BookOpen, Filter, X, Tag, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { getAllPosts, getAllCategories } from '../services/blogService';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [postsData, categoriesData] = await Promise.all([
        getAllPosts(),
        getAllCategories()
      ]);
      setPosts(postsData);
      setCategories(categoriesData);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Toggle category selection
  const toggleCategory = (category) => {
    if (category === 'all') {
      // If "All" is clicked, clear all other selections
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        // Remove "all" if it's currently selected
        const withoutAll = prev.filter(c => c !== 'all');

        // Toggle the clicked category
        if (prev.includes(category)) {
          const updated = withoutAll.filter(c => c !== category);
          // If no categories left, default to "all"
          return updated.length === 0 ? ['all'] : updated;
        } else {
          return [...withoutAll, category];
        }
      });
    }
  };

  // Filter posts by selected categories (OR logic - match ANY selected category)
  const filteredPosts = selectedCategories.includes('all')
    ? posts
    : posts.filter(post => selectedCategories.includes(post.category));

  // Count posts per category
  const categoryCounts = {};
  posts.forEach(p => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Shared category button renderer
  const renderCategoryButtons = (onSelect) => (
    <nav className="space-y-1">
      <button
        onClick={() => onSelect('all')}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          selectedCategories.includes('all')
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            selectedCategories.includes('all')
              ? 'bg-white border-white'
              : 'border-gray-300'
          }`}>
            {selectedCategories.includes('all') && <Check className="w-3 h-3 text-indigo-600" />}
          </div>
          <span>All Posts</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
          selectedCategories.includes('all') ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {posts.length}
        </span>
      </button>
      {categories.map(category => {
        const count = categoryCounts[category] || 0;
        const isActive = selectedCategories.includes(category);

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                isActive
                  ? 'bg-white border-white'
                  : 'border-gray-300'
              }`}>
                {isActive && <Check className="w-3 h-3 text-indigo-600" />}
              </div>
              <span>{category}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
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

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
                <BookOpen className="w-7 h-7 sm:w-9 sm:h-9 text-indigo-600" />
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Creator Resources</h1>
              </div>
              <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
                Expert guides on streaming gear, growth strategies, and industry insights to help you succeed as a creator
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar + Content Layout */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
                    Categories
                  </h3>
                  {renderCategoryButtons(toggleCategory)}
                </div>
              </aside>

              {/* Mobile Filter Button - Bottom Left */}
              <div className="lg:hidden fixed bottom-6 left-6 z-40">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-lg transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                </button>
              </div>

              {/* Mobile Slide Panel */}
              {mobileFiltersOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
                    onClick={() => setMobileFiltersOpen(false)}
                  />

                  {/* Slide Panel */}
                  <div className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl animate-slide-in-left overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Filter by Category</h3>
                        <button
                          onClick={() => setMobileFiltersOpen(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>

                      {renderCategoryButtons((cat) => {
                        toggleCategory(cat);
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Blog Content */}
              <div className="flex-1 min-w-0">
                {/* No posts message */}
                {filteredPosts.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No blog posts in this category yet.</p>
                  </div>
                )}

                {/* Featured Post */}
                {filteredPosts.length > 0 && (
                  <Link
                    to={`/blog/${filteredPosts[0].slug}`}
                    className="block mb-8 group"
                  >
                    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="md:flex">
                        <div className="md:w-1/2">
                          <img
                            src={filteredPosts[0].image}
                            alt={filteredPosts[0].title}
                            className="w-full h-64 md:h-full object-cover"
                          />
                        </div>
                        <div className="md:w-1/2 p-8 flex flex-col justify-center">
                          <span className="text-indigo-600 font-medium text-sm mb-2">
                            {filteredPosts[0].category}
                          </span>
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                            {filteredPosts[0].title}
                          </h2>
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {filteredPosts[0].description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(filteredPosts[0].published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {filteredPosts[0].read_time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                )}

                {/* Post Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPosts.slice(1).map(post => (
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

                {/* CTA Section */}
                <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Track Your Channel's Growth
                  </h2>
                  <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                    Use ShinyPull's free analytics to monitor your subscribers, views, and compare your growth with top creators.
                  </p>
                  <Link
                    to="/search"
                    className="inline-block px-8 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    Search Creators
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
