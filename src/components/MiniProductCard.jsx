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
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all">
      <div className="flex items-center gap-4">
        {/* Product Image */}
        <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <span className="text-indigo-400 text-xs font-medium">No img</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
            {product.name}
          </h4>
          <p className="text-base font-bold text-indigo-600 mt-1">
            {product.price}
          </p>
        </div>

        {/* CTA Button */}
        {affiliateLink ? (
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Buy
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="flex-shrink-0 px-3 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg">
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
