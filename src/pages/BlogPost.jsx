import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from '../components/SEO';
import StructuredData, { createBlogPostingSchema, createBreadcrumbSchema } from '../components/StructuredData';
import Breadcrumbs from '../components/Breadcrumbs';
import ShareButtons from '../components/ShareButtons';
import ProductCard from '../components/ProductCard';
import MiniProductCard, { MiniProductGrid } from '../components/MiniProductCard';
import { getPostBySlug, getRelatedPosts } from '../services/blogService';
import { getProduct } from '../services/productsService';

/**
 * Component that loads and displays a product card
 */
function ProductEmbed({ slug, mini = false }) {
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
      <div className={`${mini ? 'p-4' : 'my-6 p-6'} bg-gray-50 rounded-lg flex items-center justify-center`}>
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return mini ? <MiniProductCard product={product} /> : <ProductCard product={product} />;
}

/**
 * Custom markdown components with ShinyPull styling
 */
const markdownComponents = {
  // Headers with fancy styling
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-6">{children}</h1>
  ),
  h2: ({ children }) => (
    <div className="relative mt-16 mb-8 first:mt-0">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />
      <h2 className="text-3xl font-bold text-gray-900 pl-16">{children}</h2>
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">{children}</h3>
  ),
  // Paragraphs
  p: ({ children, node }) => {
    // Check if this is the first paragraph (intro/lead)
    const parent = node?.position?.start?.line === 1;
    if (parent) {
      return (
        <div className="mb-12">
          <p className="text-xl text-gray-700 leading-relaxed font-medium p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            {children}
          </p>
        </div>
      );
    }
    return <p className="text-gray-600 leading-relaxed mb-4">{children}</p>;
  },
  // Links - external vs internal
  a: ({ href, children }) => {
    const isExternal = href?.startsWith('http');
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-700 underline"
        >
          {children}
        </a>
      );
    }
    return (
      <Link to={href} className="text-indigo-600 hover:text-indigo-700 underline font-medium">
        {children}
      </Link>
    );
  },
  // Bold and italic
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  // Lists
  ul: ({ children }) => (
    <ul className="my-4 text-gray-700 list-disc ml-4 md:ml-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 text-gray-700 list-decimal ml-4 md:ml-6">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="mb-1 md:mb-2 text-gray-700">{children}</li>
  ),
  // Horizontal rule
  hr: () => <hr className="my-8 border-gray-200" />,
  // Tables with GFM support
  table: ({ children }) => (
    <div className="overflow-x-auto my-8">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>,
  tr: ({ children, isHeader }) => (
    <tr className={isHeader ? '' : 'even:bg-gray-50'}>{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-gray-700">{children}</td>
  ),
  // Code blocks
  code: ({ inline, children }) => {
    if (inline) {
      return <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-indigo-600">{children}</code>;
    }
    return (
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
        <code className="text-sm font-mono">{children}</code>
      </pre>
    );
  },
  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-500 pl-4 my-4 italic text-gray-600">
      {children}
    </blockquote>
  ),
};

/**
 * Renders blog content with support for embedded product cards
 * Use {{product:slug}} for full card, {{product-mini:slug}} for compact card
 * Use {{product-grid}}...{{/product-grid}} to wrap mini cards in a grid
 */
function BlogContent({ content }) {
  if (!content) return null;

  // Split content by all product embeds and grid markers
  const parts = content.split(/(\{\{product(?:-mini)?:[^}]+\}\}|\{\{product-grid\}\}|\{\{\/product-grid\}\})/g);

  let inGrid = false;
  let gridItems = [];

  const elements = [];

  parts.forEach((part, index) => {
    // Check for grid start
    if (part === '{{product-grid}}') {
      inGrid = true;
      gridItems = [];
      return;
    }

    // Check for grid end
    if (part === '{{/product-grid}}') {
      if (gridItems.length > 0) {
        elements.push(
          <MiniProductGrid key={`grid-${index}`}>
            {gridItems}
          </MiniProductGrid>
        );
      }
      inGrid = false;
      gridItems = [];
      return;
    }

    // Check for mini product embed
    const miniMatch = part.match(/\{\{product-mini:([^}]+)\}\}/);
    if (miniMatch) {
      const productSlug = miniMatch[1];
      const embed = <ProductEmbed key={`mini-${index}`} slug={productSlug} mini={true} />;
      if (inGrid) {
        gridItems.push(embed);
      } else {
        elements.push(embed);
      }
      return;
    }

    // Check for full product embed
    const productMatch = part.match(/\{\{product:([^}]+)\}\}/);
    if (productMatch) {
      const productSlug = productMatch[1];
      elements.push(<ProductEmbed key={`product-${index}`} slug={productSlug} />);
      return;
    }

    // Regular markdown content - use react-markdown
    if (part.trim()) {
      elements.push(
        <ReactMarkdown
          key={`content-${index}`}
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {part}
        </ReactMarkdown>
      );
    }
  });

  return (
    <div className="prose prose-lg max-w-none">
      {elements}
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
                        loading="lazy"
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
