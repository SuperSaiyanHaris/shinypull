import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import { getAllPosts, getAllCategories } from '../services/blogService';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

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

  // Filter posts by selected category
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Blog - Creator Tips, Streaming Gear & Industry Insights"
        description="Expert guides on streaming equipment, YouTube growth strategies, and creator economy insights. Grow your channel with data-driven advice."
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header - Dark */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
                <BookOpen className="w-7 h-7 sm:w-9 sm:h-9 text-indigo-400" />
                <h1 className="text-3xl sm:text-4xl font-bold text-white">Creator Resources</h1>
              </div>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
                Expert guides on streaming gear, growth strategies, and industry insights to help you succeed as a creator
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Posts
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* No posts message */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blog posts in this category yet.</p>
            </div>
          )}

          {/* Featured Post */}
          {filteredPosts.length > 0 && (
            <Link
              to={`/blog/${filteredPosts[0].slug}`}
              className="block mb-12 group"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="mt-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Track Your Channel's Growth
            </h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Use ShinyPull's free analytics to monitor your subscribers, views, and compare your growth with top creators.
            </p>
            <Link
              to="/search"
              className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Search Creators
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
