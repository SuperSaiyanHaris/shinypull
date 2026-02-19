import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import StructuredData, { createBlogPostingSchema, createBreadcrumbSchema } from '../components/StructuredData';
import Breadcrumbs from '../components/Breadcrumbs';
import ShareButtons from '../components/ShareButtons';
import BlogContent from '../components/BlogContent';
import { getPostBySlug, getRelatedPosts } from '../services/blogService';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const postData = await getPostBySlug(slug);
      setPost(postData);

      if (postData?.category) {
        const related = await getRelatedPosts(postData.category, slug);
        setRelatedPosts(related);
      }

      setLoading(false);
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-800/50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-indigo-600 hover:text-indigo-300">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Share URLs
  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(post.title);
  const postUrl = `https://shinypull.com/blog/${post.slug}`;

  // Create structured data schemas
  const blogPostSchema = createBlogPostingSchema({
    title: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.author,
    category: post.category,
    url: postUrl
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://shinypull.com' },
    { name: 'Blog', url: 'https://shinypull.com/blog' },
    { name: post.title, url: postUrl }
  ]);

  return (
    <>
      <SEO
        title={post.title}
        description={post.description}
        image={post.image}
        type="article"
        article={{
          publishedTime: post.published_at,
          modifiedTime: post.updated_at,
          author: post.author || 'ShinyPull',
          section: post.category
        }}
      />
      
      <StructuredData schema={blogPostSchema} />
      <StructuredData schema={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-800/50">
        {/* Hero Image */}
        <div className="relative h-64 md:h-96 bg-gray-900">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => navigate('/blog')}
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-indigo-600/20 backdrop-blur-sm rounded-lg text-white hover:bg-indigo-600/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10">
          {/* Article Header */}
          <article className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
            <div className="p-8 md:p-12">
              {/* Breadcrumbs */}
              <Breadcrumbs 
                items={[
                  { label: 'Home', path: '/' },
                  { label: 'Blog', path: '/blog' },
                  { label: post.title, path: `/blog/${post.slug}` }
                ]}
              />

              {/* Category */}
              <span className="inline-block px-3 py-1 bg-indigo-900/50 text-indigo-600 rounded-full text-sm font-medium mb-4">
                {post.category}
              </span>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-8 pb-8 border-b border-gray-800">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.read_time}
                </span>
                <span>By {post.author}</span>

                {/* Share Buttons */}
                <div className="ml-auto">
                  <ShareButtons 
                    url={postUrl} 
                    title={post.title} 
                    description={post.description} 
                  />
                </div>
              </div>

              {/* Content with Product Cards */}
              <BlogContent content={post.content} />
            </div>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12 mb-12">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {relatedPosts.map(related => (
                  <Link
                    key={related.slug}
                    to={`/blog/${related.slug}`}
                    className="group"
                  >
                    <article className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={related.image}
                        alt={related.title}
                        loading="lazy"
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-6">
                        <h3 className="font-bold text-gray-100 group-hover:text-indigo-400 transition-colors mb-2">
                          {related.title}
                        </h3>
                        <p className="text-sm text-gray-300">{related.read_time}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-xl font-bold mb-3">Track Your Growth</h2>
            <p className="text-indigo-200 mb-4">
              Monitor your channel's statistics and compare with top creators
            </p>
            <Link
              to="/search"
              className="inline-block px-6 py-2 bg-gray-900 text-indigo-300 font-semibold rounded-lg hover:bg-indigo-950/50 transition-colors"
            >
              Search Creators
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
