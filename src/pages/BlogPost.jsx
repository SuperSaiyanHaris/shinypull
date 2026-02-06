import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import StructuredData, { createBlogPostingSchema, createBreadcrumbSchema } from '../components/StructuredData';
import Breadcrumbs from '../components/Breadcrumbs';
import ShareButtons from '../components/ShareButtons';
import ProductCard from '../components/ProductCard';
import { getPostBySlug, getRelatedPosts } from '../services/blogService';
import { getProduct } from '../services/productsService';

/**
 * Simple markdown to HTML converter for blog content
 */
function parseMarkdown(content) {
  let html = content
    // External links - [text](https://...)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700 underline">$1</a>')
    // Internal links - [text](/path) - styled as buttons for CTAs
    .replace(/\*\*\[([^\]]+)\]\((\/[^)]+)\)\*\*/g, '<a href="$2" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 my-4">$1 →</a>')
    // Regular internal links - [text](/path)
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:text-indigo-700 underline font-medium">$1</a>')
    // Headers with fancy styling
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<div class="relative mt-16 mb-8 first:mt-0"><div class="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div><h2 class="text-3xl font-bold text-gray-900 pl-16">$1</h2></div>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists - tighter spacing on mobile
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 md:ml-6 mb-1 md:mb-2 list-decimal">$1</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 md:ml-6 mb-1 md:mb-2 list-disc">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />');

  // Handle markdown tables
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').filter(h => h.trim());
    const rows = bodyRows.trim().split('\n').map(row =>
      row.split('|').filter(c => c.trim())
    );

    let table = '<div class="overflow-x-auto my-8"><table class="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">';
    table += '<thead class="bg-gray-50"><tr>';
    headers.forEach(h => {
      table += `<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">${h.trim()}</th>`;
    });
    table += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
    rows.forEach((row, i) => {
      table += `<tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
      row.forEach(cell => {
        table += `<td class="px-4 py-3 text-sm text-gray-700">${cell.trim()}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table></div>';
    return table;
  });

  // Paragraphs
  html = html.split('\n\n')
    .map((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.includes('<li')) {
        const tag = trimmed.includes('list-decimal') ? 'ol' : 'ul';
        return `<${tag} class="my-4">${trimmed}</${tag}>`;
      }
      if (trimmed.startsWith('<')) return trimmed;
      // First paragraph is the intro/lead - style it specially with background and separator
      if (index === 0) {
        return `<div class="mb-12"><p class="text-xl text-gray-700 leading-relaxed font-medium p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">${trimmed}</p></div>`;
      }
      return `<p class="text-gray-600 leading-relaxed mb-4">${trimmed}</p>`;
    })
    .join('\n');

  return html;
}

/**
 * Component that loads and displays a product card
 */
function ProductEmbed({ slug }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const productData = await getProduct(slug);
      setProduct(productData);
      setLoading(false);
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="my-6 p-6 bg-gray-50 rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return <ProductCard product={product} />;
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
          return <ProductEmbed key={index} slug={productSlug} />;
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
          author: post.author || 'Shiny Pull',
          section: post.category
        }}
      />
      
      <StructuredData schema={blogPostSchema} />
      <StructuredData schema={breadcrumbSchema} />

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
              {/* Breadcrumbs */}
              <Breadcrumbs 
                items={[
                  { label: 'Home', path: '/' },
                  { label: 'Blog', path: '/blog' },
                  { label: post.title, path: `/blog/${post.slug}` }
                ]}
              />

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
