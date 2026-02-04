import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import { getAllPosts, getAllCategories } from '../services/blogService';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
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
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Creator Resources</h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Expert guides on streaming gear, growth strategies, and industry insights to help you succeed as a creator
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium">
              All Posts
            </span>
            {categories.map(category => (
              <span
                key={category}
                className="px-4 py-2 bg-white text-gray-600 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {category}
              </span>
            ))}
          </div>

          {/* No posts message */}
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blog posts yet. Check back soon!</p>
            </div>
          )}

          {/* Featured Post */}
          {posts.length > 0 && (
            <Link
              to={`/blog/${posts[0].slug}`}
              className="block mb-12 group"
            >
              <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img
                      src={posts[0].image}
                      alt={posts[0].title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 p-8 flex flex-col justify-center">
                    <span className="text-indigo-600 font-medium text-sm mb-2">
                      {posts[0].category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {posts[0].title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {posts[0].description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(posts[0].published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {posts[0].read_time}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Post Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map(post => (
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
