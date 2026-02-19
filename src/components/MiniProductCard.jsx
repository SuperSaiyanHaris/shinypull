import { ExternalLink } from 'lucide-react';

/**
 * MiniProductCard - Compact affiliate product card for quick recommendations
 *
 * Usage in blog posts:
 * {{product-mini:fifine-k669b}}
 *
 * For a grid of mini products, use multiple in a row:
 * {{product-grid}}
 * {{product-mini:fifine-k669b}}
 * {{product-mini:blue-yeti-x}}
 * {{product-mini:shure-sm7b}}
 * {{/product-grid}}
 */
export default function MiniProductCard({ product }) {
  if (!product) return null;

  const affiliateLink = product.affiliate_link || product.affiliateLink;
  const hasImage = product.image && product.image.trim() !== '';

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 hover:shadow-md hover:border-indigo-700 transition-all flex flex-col">
      {/* Product Image */}
      <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden mb-3">
        {hasImage ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
            <span className="text-indigo-400 text-sm font-medium">No image</span>
          </div>
        )}
      </div>

      {/* Product Name */}
      <h4 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug mb-2">
        {product.name}
      </h4>

      {/* Price and Button Row */}
      <div className="flex items-center justify-between mt-auto">
        <p className="text-lg font-bold text-indigo-600">
          {product.price}
        </p>
        {affiliateLink ? (
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Buy
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="px-3 py-1.5 bg-gray-800 text-gray-500 text-sm font-medium rounded-lg">
            Soon
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * MiniProductGrid - Container for mini product cards
 */
export function MiniProductGrid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 my-6">
      {children}
    </div>
  );
}
