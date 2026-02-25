import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShoppingBag, Mic, Camera, Lightbulb, Headphones, Monitor, Package, Filter, X, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { getActiveProducts } from '../services/productsService';

const categories = [
  { id: 'all', label: 'All Gear', icon: ShoppingBag },
  { id: 'microphones', label: 'Microphones', icon: Mic },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  { id: 'audio', label: 'Audio & Mixers', icon: Headphones },
  { id: 'capture', label: 'Capture Cards', icon: Monitor },
  { id: 'accessories', label: 'Accessories', icon: Package },
];

function categorizeProduct(product) {
  const name = (product.name || '').toLowerCase();
  const slug = (product.slug || '').toLowerCase();

  if (name.includes('microphone') || name.includes('mic ') || slug.includes('mic') || name.includes('sm7b') || name.includes('k669')) {
    return 'microphones';
  }
  if (name.includes('camera') || name.includes('webcam') || slug.includes('cam') || name.includes('zv-1') || name.includes('zv1') || name.includes('kiyo')) {
    return 'cameras';
  }
  if (name.includes('light') || name.includes('softbox') || name.includes('ring light') || slug.includes('light') || slug.includes('green-screen')) {
    return 'lighting';
  }
  if (name.includes('audio interface') || name.includes('xlr') || name.includes('mixer') || name.includes('goxlr') || name.includes('rodecaster') || name.includes('cloudlifter') || name.includes('scarlett') || name.includes('beacn') || slug.includes('wave-xlr')) {
    return 'audio';
  }
  if (name.includes('capture card') || name.includes('cam link') || slug.includes('hd60') || slug.includes('cam-link') || slug.includes('gamer-mini')) {
    return 'capture';
  }
  return 'accessories';
}

export default function Gear() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    getActiveProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    if (categoryId === 'all') {
      // If "All" is clicked, clear all other selections
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        // Remove "all" if it's currently selected
        const withoutAll = prev.filter(c => c !== 'all');

        // Toggle the clicked category
        if (prev.includes(categoryId)) {
          const updated = withoutAll.filter(c => c !== categoryId);
          // If no categories left, default to "all"
          return updated.length === 0 ? ['all'] : updated;
        } else {
          return [...withoutAll, categoryId];
        }
      });
    }
  };

  // Filter products (OR logic - match ANY selected category)
  const filtered = selectedCategories.includes('all')
    ? products
    : products.filter(p => selectedCategories.includes(categorizeProduct(p)));

  const categoryCounts = {};
  products.forEach(p => {
    const cat = categorizeProduct(p);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return (
    <>
      <SEO
        title="Recommended Streaming Gear"
        description="The best streaming equipment for YouTube, Twitch, and Kick creators. Microphones, cameras, lighting, audio interfaces, and accessories hand-picked by the ShinyPull team."
        keywords="best streaming gear, streaming setup, streaming microphone, streaming camera, streaming lights, capture card, audio interface, streamer equipment 2026"
      />

      <div className="min-h-screen bg-[#0a0a0f]">
        {/* Hero */}
        <section className="border-b border-gray-800/60">
          <div className="w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-950/50 border border-indigo-800 rounded-full text-sm font-medium text-indigo-400 mb-6">
                <ShoppingBag className="w-4 h-4" />
                Hand-picked by the ShinyPull team
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-100 mb-4 tracking-tight">
                Recommended Streaming Gear
              </h1>
              <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                The best equipment for YouTube, Twitch, and Kick creators at every budget. We use and recommend these products.
              </p>
            </div>
          </div>
        </section>

        {/* Category Tabs - Now Sidebar + Mobile Slide Panel */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-8">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 px-3">
                    Categories
                  </h3>
                  <nav className="space-y-1">
                    {categories.map(cat => {
                      const Icon = cat.icon;
                      const count = cat.id === 'all' ? products.length : (categoryCounts[cat.id] || 0);
                      const isActive = selectedCategories.includes(cat.id);

                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-gray-300 hover:bg-gray-800/50 hover:text-indigo-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isActive
                                ? 'bg-white/20 border-white/30'
                                : 'border-gray-600'
                            }`}>
                              {isActive && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{cat.label}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            isActive ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              {/* Mobile Filter Button - Bottom Left */}
              <div className="lg:hidden fixed bottom-6 left-6 z-40">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full shadow-lg transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                </button>
              </div>

              {/* Mobile Slide Panel */}
              {mobileFiltersOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
                    onClick={() => setMobileFiltersOpen(false)}
                  />

                  {/* Slide Panel */}
                  <div className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gray-900 z-50 shadow-2xl animate-slide-in-left overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-100">Filter by Category</h3>
                        <button
                          onClick={() => setMobileFiltersOpen(false)}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-300" />
                        </button>
                      </div>

                      <nav className="space-y-1">
                        {categories.map(cat => {
                          const Icon = cat.icon;
                          const count = cat.id === 'all' ? products.length : (categoryCounts[cat.id] || 0);
                          const isActive = selectedCategories.includes(cat.id);

                          return (
                            <button
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-indigo-400'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isActive
                                    ? 'bg-gray-900 border-gray-800'
                                    : 'border-gray-600'
                                }`}>
                                  {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                                </div>
                                <span>{cat.label}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                isActive ? 'bg-indigo-600/20 text-white' : 'bg-gray-800 text-gray-300'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                </>
              )}

              {/* Products Grid */}
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 animate-pulse">
                        <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3"></div>
                        <div className="h-4 bg-gray-800 rounded mb-2 w-3/4"></div>
                        <div className="h-6 bg-gray-800 rounded w-1/3"></div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-300 text-lg">No products in this category yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {filtered.map(product => {
                  const affiliateLink = product.affiliate_link || product.affiliateLink;
                  const hasImage = product.image && product.image.trim() !== '';

                  return (
                    <div key={product.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-3 sm:p-4 hover:border-indigo-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col group">
                      {/* Image */}
                      <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden mb-2 sm:mb-3">
                        {hasImage ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-contain p-1 sm:p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-300" />
                          </div>
                        )}
                      </div>

                      {/* Badge */}
                      {product.badge && (
                        <span className="inline-block self-start px-1.5 sm:px-2 py-0.5 bg-indigo-900/50 text-indigo-300 text-xs font-semibold rounded-full mb-1 sm:mb-2">
                          {product.badge}
                        </span>
                      )}

                      {/* Name */}
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-100 line-clamp-2 leading-snug mb-1">
                        {product.name}
                      </h3>

                      {/* Description - Hidden on mobile */}
                      {product.description && (
                        <p className="hidden sm:block text-xs text-gray-400 line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}

                      {/* Price + Button */}
                      <div className="flex items-center justify-between mt-auto pt-1 sm:pt-2">
                        <p className="text-base sm:text-lg font-bold text-indigo-400">
                          {product.price}
                        </p>
                        {affiliateLink ? (
                          <a
                            href={affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                          >
                            Buy
                            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </a>
                        ) : (
                          <span className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gray-800 text-gray-300 text-xs sm:text-sm font-medium rounded-lg">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}              </div>
            </div>          </div>
        </section>

        {/* Blog Posts CTA */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-indigo-500/40 rounded-2xl p-8 md:p-12 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-500" />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 mb-4">
                  Need help choosing?
                </h2>
                <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                  Check out our in-depth gear guides and comparison articles to find the perfect setup for your budget.
                </p>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Read Our Gear Guides
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
