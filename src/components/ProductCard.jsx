import { ExternalLink } from 'lucide-react';

/**
 * ProductCard - Reusable affiliate product card
 *
 * Usage in blog posts:
 * {{product:fifine-k669b}}
 *
 * Products are fetched from Supabase
 */
export default function ProductCard({ product }) {
  if (!product) return null;

  // Handle both camelCase (legacy) and snake_case (Supabase) naming
  const affiliateLink = product.affiliate_link || product.affiliateLink;

  return (
    <div className="my-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Product Image */}
        <div className="sm:w-48 h-48 sm:h-auto bg-white flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-40 max-w-full object-contain"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex-1">
            {/* Badge */}
            {product.badge && (
              <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-2">
                {product.badge}
              </span>
            )}

            {/* Name & Price */}
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              {product.name}
            </h4>
            <p className="text-2xl font-bold text-indigo-600 mb-2">
              {product.price}
            </p>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4">
              {product.description}
            </p>

            {/* Features */}
            {product.features && (
              <ul className="text-sm text-gray-500 space-y-1 mb-4">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTA Button */}
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors w-full sm:w-auto"
          >
            View on Amazon
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
