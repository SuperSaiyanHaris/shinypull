import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Twitter, Facebook, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import { getPostBySlug, getRelatedPosts } from '../services/blogService';
import { getProduct } from '../data/products';

/**
 * Simple markdown to HTML converter for blog content
 */
function parseMarkdown(content) {
  let html = content
    // Links - [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">$1</a>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal">$1</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
    // Paragraphs
    .split('\n\n')
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      if (trimmed.includes('<li')) {
        return `<ul class="my-4">${trimmed}</ul>`;
      }
      return `<p class="text-gray-600 leading-relaxed mb-4">${trimmed}</p>`;
    })
    .join('\n');

  return html;
}

/**
 * Renders blog content with support for embedded product cards
 * Use {{product:slug}} in content to embed a product card
 */
function BlogContent({ content }) {
  if (!content) return null;

  // Split content by product embeds: {{product:slug}}
  const parts = content.split(/(\{\{product:[^}]+\}\})/g);

  return (
    <div className="prose prose-lg max-w-none">
      {parts.map((part, index) => {
        // Check if this part is a product embed
        const productMatch = part.match(/\{\{product:([^}]+)\}\}/);

        if (productMatch) {
          const productSlug = productMatch[1];
          const product = getProduct(productSlug);
          return <ProductCard key={index} product={product} />;
        }

        // Regular markdown content
        if (part.trim()) {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(part) }}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-indigo-600 hover:text-indigo-700">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Share URLs
  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(post.title);

  return (
    <>
      <SEO
        title={post.title}
        description={post.description}
        image={post.image}
      />

      <div className="min-h-screen bg-gray-50">
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
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10">
          {/* Article Header */}
          <article className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-8 md:p-12">
              {/* Category */}
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium mb-4">
                {post.category}
              </span>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
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
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-gray-400">Share:</span>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <Twitter className="w-4 h-4 text-gray-500" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <Facebook className="w-4 h-4 text-gray-500" />
                  </a>
                </div>
              </div>

              {/* Content with Product Cards */}
              <BlogContent content={post.content} />
            </div>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {relatedPosts.map(related => (
                  <Link
                    key={related.slug}
                    to={`/blog/${related.slug}`}
                    className="group"
                  >
                    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-6">
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                          {related.title}
                        </h3>
                        <p className="text-sm text-gray-500">{related.read_time}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mb-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-xl font-bold mb-3">Track Your Growth</h2>
            <p className="text-indigo-100 mb-4">
              Monitor your channel's statistics and compare with top creators
            </p>
            <Link
              to="/search"
              className="inline-block px-6 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Search Creators
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
