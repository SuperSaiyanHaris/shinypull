import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2 } from 'lucide-react';
import ProductCard from './ProductCard';
import MiniProductCard, { MiniProductGrid } from './MiniProductCard';
import { getProduct } from '../services/productsService';

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
      <div className={`${mini ? 'p-4' : 'my-6 p-6'} bg-gray-800 rounded-lg flex items-center justify-center`}>
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return mini ? <MiniProductCard product={product} /> : <ProductCard product={product} />;
}

export const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold text-gray-100 mt-8 mb-6">{children}</h1>
  ),
  h2: ({ children }) => (
    <div className="relative mt-16 mb-8 first:mt-0">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />
      <h2 className="text-3xl font-bold text-gray-100 pl-16">{children}</h2>
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-bold text-gray-100 mt-8 mb-3">{children}</h3>
  ),
  p: ({ children, node }) => {
    const isFirst = node?.position?.start?.line === 1;
    if (isFirst) {
      return (
        <div className="mb-12">
          <p className="text-xl text-gray-300 leading-relaxed font-medium p-6 bg-gradient-to-br from-indigo-950/30 to-purple-950/30 rounded-xl border border-indigo-800">
            {children}
          </p>
        </div>
      );
    }
    return <p className="text-gray-400 leading-relaxed mb-4">{children}</p>;
  },
  a: ({ href, children }) => {
    const isExternal = href?.startsWith('http');
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
          {children}
        </a>
      );
    }
    return (
      <Link to={href} className="text-indigo-400 hover:text-indigo-300 underline font-medium">
        {children}
      </Link>
    );
  },
  strong: ({ children }) => <strong className="font-semibold text-gray-100">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  ul: ({ children }) => <ul className="my-4 text-gray-300 list-disc ml-4 md:ml-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 text-gray-300 list-decimal ml-4 md:ml-6">{children}</ol>,
  li: ({ children }) => <li className="mb-1 md:mb-2 text-gray-300">{children}</li>,
  hr: () => <hr className="my-8 border-gray-700" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-8">
      <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
  tbody: ({ children }) => <tbody className="bg-gray-900 divide-y divide-gray-700">{children}</tbody>,
  tr: ({ children, isHeader }) => <tr className={isHeader ? '' : 'even:bg-gray-800/50'}>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{children}</th>
  ),
  td: ({ children }) => <td className="px-4 py-3 text-sm text-gray-300">{children}</td>,
  code: ({ inline, children }) => {
    if (inline) {
      return <code className="px-1.5 py-0.5 bg-gray-800 rounded text-sm font-mono text-indigo-400">{children}</code>;
    }
    return (
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
        <code className="text-sm font-mono">{children}</code>
      </pre>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-500 pl-4 my-4 italic text-gray-400">{children}</blockquote>
  ),
};

export default function BlogContent({ content }) {
  if (!content) return null;

  const parts = content.split(/(\{\{product(?:-mini)?:[^}]+\}\}|\{\{product-grid\}\}|\{\{\/product-grid\}\})/g);

  let inGrid = false;
  let gridItems = [];
  const elements = [];

  parts.forEach((part, index) => {
    if (part === '{{product-grid}}') {
      inGrid = true;
      gridItems = [];
      return;
    }
    if (part === '{{/product-grid}}') {
      if (gridItems.length > 0) {
        elements.push(<MiniProductGrid key={`grid-${index}`}>{gridItems}</MiniProductGrid>);
      }
      inGrid = false;
      gridItems = [];
      return;
    }
    const miniMatch = part.match(/\{\{product-mini:([^}]+)\}\}/);
    if (miniMatch) {
      const embed = <ProductEmbed key={`mini-${index}`} slug={miniMatch[1]} mini={true} />;
      if (inGrid) { gridItems.push(embed); } else { elements.push(embed); }
      return;
    }
    const productMatch = part.match(/\{\{product:([^}]+)\}\}/);
    if (productMatch) {
      elements.push(<ProductEmbed key={`product-${index}`} slug={productMatch[1]} />);
      return;
    }
    if (part.trim()) {
      elements.push(
        <ReactMarkdown key={`content-${index}`} remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {part}
        </ReactMarkdown>
      );
    }
  });

  return <div className="prose prose-lg max-w-none">{elements}</div>;
}
