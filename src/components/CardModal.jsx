import React, { useState, useEffect } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, Minus, Info, Award, Loader2 } from 'lucide-react';
import { formatPrice, getPriceTrend } from '../services/cardService';
import { getEbayPriceAPI, getEbayPSA10Price, estimateEbayPrice, estimatePSA10Price } from '../services/ebayService';
import { getDBPrices } from '../services/priceUpdateService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import AddToCollectionButton from './AddToCollectionButton';
import PriceAlertButton from './PriceAlertButton';

// Reusable tooltip component for High price explanation
const HighPriceTooltip = ({ className = "" }) => (
  <div className={`group relative inline-flex items-center ${className}`}>
    <Info className="w-3.5 h-3.5 text-adaptive-tertiary cursor-help ml-1" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 price-tooltip text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] font-normal normal-case tracking-normal pointer-events-none">
      Highest listed price on eBay. May be inflated by individual sellers and not reflect actual market value.
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent price-tooltip-arrow"></div>
    </div>
  </div>
);

// Price variant display configuration
const VARIANT_CONFIG = {
  normal: { label: 'Normal', color: 'text-adaptive-primary', bgColor: 'bg-slate-500/10' },
  holofoil: { label: 'Holofoil', color: 'price-gradient', bgColor: 'bg-purple-500/10' },
  reverseHolofoil: { label: 'Reverse Holo', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  firstEditionHolofoil: { label: '1st Ed. Holo', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  firstEditionNormal: { label: '1st Ed. Normal', color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  unlimited: { label: 'Unlimited', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  unlimitedHolofoil: { label: 'Unltd. Holo', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' }
};

// Component to display a single price variant card
const PriceVariantCard = ({ variant, data, compact = false }) => {
  if (!data?.market) return null;

  const config = VARIANT_CONFIG[variant] || { label: variant, color: 'text-adaptive-primary', bgColor: 'bg-slate-500/10' };

  if (compact) {
    return (
      <div className={`text-center ${config.bgColor} rounded-lg p-2`}>
        <p className="text-[10px] text-adaptive-secondary font-medium mb-0.5 truncate">{config.label}</p>
        <p className={`text-sm font-bold ${config.color}`}>
          {formatPrice(data.market)}
        </p>
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} rounded-lg p-3 border border-adaptive/50`}>
      <p className="text-xs text-adaptive-secondary font-medium mb-1">{config.label}</p>
      <p className={`text-xl font-bold ${config.color}`}>
        {formatPrice(data.market)}
      </p>

    </div>
  );
};

// Component to display all available price variants
const PriceVariantsDisplay = ({ prices, loading = false, compact = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-adaptive-secondary">Loading prices...</span>
      </div>
    );
  }

  // Get all variants that have data
  const availableVariants = Object.keys(VARIANT_CONFIG).filter(
    variant => prices?.[variant]?.market
  );

  if (availableVariants.length === 0) {
    // Fallback to legacy market price if no variants
    if (prices?.market) {
      return (
        <div className="text-center bg-adaptive-hover rounded-lg p-4">
          <p className="text-sm text-adaptive-secondary font-medium mb-2">Market Price</p>
          <p className="text-3xl font-bold price-gradient">{formatPrice(prices.market)}</p>
        </div>
      );
    }
    return (
      <p className="text-sm text-adaptive-tertiary text-center py-4">No price data available</p>
    );
  }

  // Determine grid columns based on number of variants
  const gridCols = availableVariants.length === 1 ? 'grid-cols-1' :
                   availableVariants.length === 2 ? 'grid-cols-2' :
                   availableVariants.length <= 4 ? 'grid-cols-2 md:grid-cols-4' :
                   'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-2 ${compact ? '' : 'gap-3'}`}>
      {availableVariants.map(variant => (
        <PriceVariantCard
          key={variant}
          variant={variant}
          data={prices[variant]}
          compact={compact}
        />
      ))}
    </div>
  );
};

const CardModal = ({ card, isOpen, onClose, onCardAdded, onCardRemoved }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [ebayPrices, setEbayPrices] = useState(null);
  const [psa10Prices, setPsa10Prices] = useState(null);
  const [loadingEbay, setLoadingEbay] = useState(false);
  const [tcgPrices, setTcgPrices] = useState(null);
  const [loadingTcg, setLoadingTcg] = useState(false);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Admin check
  const ADMIN_EMAILS = ['haris.lilic@gmail.com', 'shinypull@proton.me'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Admin force refresh handler
  const handleForceRefresh = async () => {
    console.log('🔧 Admin forcing price refresh...');
    setLoadingTcg(true);
    try {
      // Get user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      // Call admin API endpoint with authentication
      const response = await fetch('/api/admin-refresh-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ cardId: card.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh prices');
      }

      if (result.success && result.prices) {
        setTcgPrices(result.prices);
        console.log('✅ Prices refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Error forcing refresh:', error);
      alert('Failed to refresh prices: ' + error.message);
    } finally {
      setLoadingTcg(false);
    }
  };

  // Close modal when clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Fetch eBay prices on-demand when modal opens
  useEffect(() => {
    if (!isOpen || !card) return;

    // Skip price fetching for non-authenticated users
    if (!user) {
      console.log('Skipping price fetch - user not authenticated');
      return;
    }

    // Load prices from database only - no API calls on modal open
    setLoadingTcg(true);
    getDBPrices(card.id)
      .then(dbPrices => {
        if (dbPrices) {
          setTcgPrices(dbPrices);
        }
      })
      .finally(() => setLoadingTcg(false));

    // Load eBay prices from card data (DB) only - no automatic API fetching
    // Admin can manually refresh if needed
    if (card.prices?.ebay) {
      setEbayPrices(card.prices.ebay);
    }
    if (card.prices?.psa10) {
      setPsa10Prices(card.prices.psa10);
    }

    // DISABLED: Automatic eBay fetching removed - admin manual refresh only
    // if (!hasEbayData || !hasPsa10Data) {
    //   setLoadingEbay(true);

    /*
      const fetchPrices = async () => {
        try {
          const [ebayData, psa10Data] = await Promise.all([
            !hasEbayData ? getEbayPriceAPI(card.name, card.set || '', card.number || '', card.rarity || '') : Promise.resolve(null),
            !hasPsa10Data ? getEbayPSA10Price(card.name, card.set || '', card.number || '', card.rarity || '') : Promise.resolve(null)
          ]);

          if (ebayData) {
            setEbayPrices({
              avg: ebayData.avg,
              market: ebayData.market,
              median: ebayData.median,
              low: ebayData.low,
              high: ebayData.high,
              count: ebayData.count,
              verified: true,
              cheapestListing: ebayData.cheapestListing,
              searchTerms: ebayData.searchTerms || '',
              searchUrl: ebayData.searchUrl || ''
            });
          } else if (!hasEbayData) {
            // Use estimated price if API returned nothing
            const marketPrice = card.prices?.tcgplayer?.market || 0;
            // Build fallback eBay search URL
            const fallbackQuery = `Pokemon ${card.name} ${card.number || ''} ${card.set || ''}`.trim();
            const encodedQuery = encodeURIComponent(fallbackQuery);
            setEbayPrices({
              avg: estimateEbayPrice(marketPrice),
              verified: false,
              searchTerms: fallbackQuery,
              searchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`
            });
          }

          if (psa10Data) {
            setPsa10Prices({
              avg: psa10Data.avg,
              market: psa10Data.market,
              median: psa10Data.median,
              low: psa10Data.low,
              high: psa10Data.high,
              count: psa10Data.count,
              verified: true,
              cheapestListing: psa10Data.cheapestListing,
              searchTerms: psa10Data.searchTerms || '',
              searchUrl: psa10Data.searchUrl || ''
            });
          } else if (!hasPsa10Data) {
            // Use estimated price if API returned nothing
            const marketPrice = card.prices?.tcgplayer?.market || 0;
            // Build fallback eBay search URL for PSA 10
            const fallbackQuery = `Pokemon ${card.name} ${card.number || ''} PSA 10`.trim();
            const encodedQuery = encodeURIComponent(fallbackQuery);
            setPsa10Prices({
              avg: estimatePSA10Price(marketPrice),
              verified: false,
              searchTerms: fallbackQuery,
              searchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=183454&mkcid=1&mkrid=711-53200-19255-0&campid=5339138366&toolid=10001`
            });
          }
        } catch (error) {
          console.error('Error fetching eBay prices:', error);
        } finally {
          setLoadingEbay(false);
        }
      };

      fetchPrices();
    }
    */
  }, [isOpen, card]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEbayPrices(null);
      setPsa10Prices(null);
      setTcgPrices(null);
      setLoadingEbay(false);
      setLoadingTcg(false);
    }
  }, [isOpen]);

  // Early return AFTER all hooks
  if (!isOpen || !card) return null;

  // Use fetched prices or fall back to card's original prices
  const displayEbayPrices = ebayPrices || card.prices?.ebay || { market: 0, verified: false, searchTerms: '', searchUrl: '' };
  const displayPsa10Prices = psa10Prices || card.prices?.psa10 || { market: 0, verified: false, searchTerms: '', searchUrl: '' };

  // Primary market price: Use eBay median if available, otherwise fall back to DB market price
  const primaryMarketPrice = card.prices?.market || displayEbayPrices.market || displayEbayPrices.median || 0;

  const trend = getPriceTrend(card.priceHistory);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 modal-backdrop backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Mobile: Full-screen drawer from bottom | Desktop: Centered modal */}
      <div className="relative w-full md:max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-up modal-container border flex flex-col">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex-shrink-0 flex items-center justify-between p-4 border-b border-adaptive bg-adaptive-card z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-adaptive-secondary"
          >
            <X className="w-5 h-5" />
            <span className="font-medium">Close</span>
          </button>
          <span className="text-xs text-adaptive-tertiary font-mono">#{card.number}</span>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:block absolute top-4 right-4 z-10 p-2 modal-button rounded-lg transition-colors group border"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-adaptive-secondary group-hover:text-adaptive-primary" />
        </button>

        {/* Admin Force Refresh Button (hidden, next to close button) */}
        {isAdmin && (
          <button
            onClick={handleForceRefresh}
            disabled={loadingTcg}
            className="hidden md:block absolute top-4 right-16 z-10 p-2 modal-button rounded-lg transition-colors group border hover:bg-amber-500/10 hover:border-amber-500/30"
            title="Admin: Force refresh prices (bypass cache)"
          >
            {loadingTcg ? (
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 group-hover:text-amber-400">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            )}
          </button>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 md:max-h-[90vh] bg-adaptive-card">
          {/* Mobile Layout */}
          <div className="md:hidden bg-adaptive-card">
            {/* Card Image - Smaller on mobile */}
            <div className="p-4 flex justify-center">
              <div className="relative w-40 aspect-[3/4]">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            </div>

            {/* Card Info */}
            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-2xl font-display text-adaptive-primary">{card.name}</h2>
                <p className="text-sm text-adaptive-secondary mt-1">{card.set} • {card.number}</p>
              </div>

              {/* Price Box */}
              <div className="relative">
                <div className={`p-4 modal-price-box rounded-xl border ${!user ? 'blur-sm select-none' : ''}`}>
                  {/* Primary Market Price - eBay Based */}
                  <div className="text-center">
                    <p className="text-xs text-adaptive-secondary font-medium mb-1">Market Price</p>
                    <p className="text-3xl font-bold price-gradient">
                      {loadingEbay ? (
                        <Loader2 className="w-8 h-8 animate-spin inline-block text-blue-500" />
                      ) : (
                        formatPrice(primaryMarketPrice)
                      )}
                    </p>
                  </div>
                  {/* TCGPlayer Variants - Only show if more than 1 variant */}
                  {tcgPrices && Object.keys(tcgPrices).filter(key => key !== 'market' && tcgPrices[key]?.market).length > 1 && (
                    <div className="pt-3 border-t border-adaptive/30 mt-3">
                      <PriceVariantsDisplay prices={tcgPrices} loading={loadingTcg} compact />
                    </div>
                  )}
                </div>

                {/* Auth Gate Overlay for Price Box */}
                {!user && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-adaptive-card/95 backdrop-blur-sm rounded-xl">
                    <p className="text-xs text-adaptive-tertiary mb-2 text-center px-4">
                      Sign in to view pricing
                    </p>
                    <button
                      onClick={() => openAuthModal()}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 modal-card rounded-lg border">
                  <p className="text-xs text-adaptive-tertiary">Number</p>
                  <p className="text-sm font-bold text-adaptive-primary font-mono">{card.number}</p>
                </div>
                <div className="p-3 modal-card rounded-lg border">
                  <p className="text-xs text-adaptive-tertiary">Rarity</p>
                  <p className="text-sm font-bold text-adaptive-primary">{card.rarity}</p>
                </div>
              </div>

              {/* Actions */}
              <div className={`pt-2 space-y-2 ${!user ? 'blur-sm pointer-events-none' : ''}`}>
                <AddToCollectionButton
                  card={card}
                  className="w-full"
                  onSuccess={onCardAdded}
                  onRemove={onCardRemoved}
                />
                <PriceAlertButton card={card} className="w-full" />
              </div>

              {/* Price Comparison */}
              <div className="space-y-2 relative">
                <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wide">Price Comparison</h3>
                <div className={`space-y-2 ${!user ? 'blur-sm select-none' : ''}`}>
                  {loadingEbay ? (
                    <div className="flex items-center justify-center p-3 modal-card rounded-lg border">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                      <span className="text-sm text-adaptive-secondary">Fetching eBay prices...</span>
                    </div>
                  ) : (
                    <>
                      {/* eBay Raw Card */}
                      <div className="p-3 modal-card rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-adaptive-tertiary">
                              eBay Raw Card
                            </p>
                            <p className="text-lg font-bold text-blue-500">
                              {displayEbayPrices.low && displayEbayPrices.high
                                ? `${formatPrice(displayEbayPrices.low)} - ${formatPrice(displayEbayPrices.high)}`
                                : formatPrice(displayEbayPrices.market)}
                            </p>
                          </div>
                          {displayEbayPrices.searchUrl && (
                            <a
                              href={displayEbayPrices.searchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <span className="text-xs font-medium text-blue-500">View</span>
                              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* eBay PSA 10 */}
                      <div className="p-3 modal-card rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-adaptive-tertiary flex items-center gap-1">
                              <Award className="w-3 h-3 text-yellow-500" />
                              eBay PSA 10
                            </p>
                            <p className="text-lg font-bold text-blue-500">
                              {displayPsa10Prices.low && displayPsa10Prices.high
                                ? `${formatPrice(displayPsa10Prices.low)} - ${formatPrice(displayPsa10Prices.high)}`
                                : formatPrice(displayPsa10Prices.market)}
                            </p>
                          </div>
                          {displayPsa10Prices.searchUrl && (
                            <a
                              href={displayPsa10Prices.searchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <span className="text-xs font-medium text-blue-500">View</span>
                              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Auth Gate Overlay for Price Comparison */}
                {!user && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-adaptive-card/95 backdrop-blur-sm rounded-xl mt-8">
                    <p className="text-xs text-adaptive-tertiary mb-2 text-center px-4">
                      Sign in to compare prices
                    </p>
                    <button
                      onClick={() => openAuthModal()}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

              {/* Source info */}
              <p className="text-xs text-adaptive-tertiary text-center">
                Links may be affiliate links. We may earn a commission from purchases.
              </p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            {/* Header Section */}
            <div className="relative p-8 modal-header border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Card Image */}
                <div className="flex items-center justify-center">
                  <div className="relative aspect-[3/4] w-full max-w-md">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                </div>

                {/* Right: Card Info */}
                <div className="flex flex-col justify-center space-y-4">
                  <h2 className="text-4xl font-display text-adaptive-primary mb-2">
                    {card.name}
                  </h2>
                  <div className="flex items-center gap-3 text-adaptive-secondary">
                    <span className="text-lg">{card.set}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-lg font-mono">{card.number}</span>
                  </div>

                  {/* Current Price Display */}
                  <div className="relative">
                    <div className={`p-6 modal-price-box rounded-xl border ${!user ? 'blur-sm select-none' : ''}`}>
                      {/* Primary Market Price - eBay Based */}
                      <div className="text-center mb-4">
                        <p className="text-sm text-adaptive-secondary font-medium mb-2">Market Price</p>
                        <p className="text-4xl font-bold price-gradient">
                          {loadingEbay ? (
                            <Loader2 className="w-10 h-10 animate-spin inline-block text-blue-500" />
                          ) : (
                            formatPrice(primaryMarketPrice)
                          )}
                        </p>
                      </div>
                      {/* TCGPlayer Variants - Only show if more than 1 variant */}
                      {tcgPrices && Object.keys(tcgPrices).filter(key => key !== 'market' && tcgPrices[key]?.market).length > 1 && (
                        <div className="pt-4 border-t border-adaptive/30 mt-4">
                          <PriceVariantsDisplay prices={tcgPrices} loading={loadingTcg} />
                        </div>
                      )}
                    </div>

                    {/* Auth Gate Overlay for Desktop Price Box */}
                    {!user && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-adaptive-card/95 backdrop-blur-sm rounded-xl">
                        <p className="text-sm text-adaptive-tertiary mb-3 text-center px-4">
                          Sign in to view pricing
                        </p>
                        <button
                          onClick={() => openAuthModal()}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className={`grid grid-cols-2 gap-3 ${!user ? 'blur-sm pointer-events-none' : ''}`}>
                    <AddToCollectionButton
                      card={card}
                      className="w-full"
                      onSuccess={onCardAdded}
                      onRemove={onCardRemoved}
                    />
                    <PriceAlertButton card={card} className="w-full" />
                  </div>
                  {card.tcgplayerUrl && (
                    <a
                      href={card.tcgplayerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full px-4 py-3 modal-button text-adaptive-secondary rounded-xl transition-colors border flex items-center justify-center gap-2 ${!user ? 'blur-sm pointer-events-none' : ''}`}
                      title="View on TCGPlayer"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="text-sm font-medium">View on TCGPlayer</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 modal-content space-y-6">
              <div className="relative">
                <h3 className="text-xl font-display text-adaptive-primary mb-4">Price Comparison</h3>
                <div className={`space-y-3 ${!user ? 'blur-sm select-none' : ''}`}>
                  {card.prices?.tcgplayer?.market > 0 && (
                    <PriceCompareRow
                      platform="TCG"
                      price={card.prices.tcgplayer.market}
                      link={card.prices.tcgplayer.url || card.tcgplayerUrl}
                    />
                  )}
                  {loadingEbay ? (
                    <div className="flex items-center justify-center p-4 modal-card rounded-lg border">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                      <span className="text-adaptive-secondary">Fetching eBay prices...</span>
                    </div>
                  ) : (
                    <>
                      <EbayPriceRow
                        ebayData={displayEbayPrices}
                        label="eBay Raw Card"
                      />
                      <PSA10PriceRow
                        psa10Data={displayPsa10Prices}
                      />
                    </>
                  )}
                </div>
                <p className="text-xs text-adaptive-tertiary mt-4 text-center">
                  Links may be affiliate links. We may earn a commission from purchases.
                </p>
                
                {/* Auth Gate Overlay for Desktop Price Comparison */}
                {!user && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-adaptive-card/95 backdrop-blur-sm rounded-xl mt-12">
                    <p className="text-sm text-adaptive-tertiary mb-3 text-center px-4">
                      Sign in to compare prices
                    </p>
                    <button
                      onClick={() => openAuthModal()}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* End Desktop Layout */}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ label, value, trend, color = 'text-blue-500', showHighTooltip = false }) => (
  <div className="p-5 modal-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
    <p className="text-xs font-semibold text-adaptive-secondary mb-2 uppercase tracking-wide flex items-center">
      {label}
      {showHighTooltip && <HighPriceTooltip />}
    </p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {trend && (
      <p className="text-xs text-adaptive-tertiary mt-2 capitalize">Trend: {trend}</p>
    )}
  </div>
);

const InfoCard = ({ label, value }) => (
  <div className="p-4 modal-card rounded-lg border shadow-sm">
    <p className="text-xs font-semibold text-adaptive-tertiary mb-1 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-bold text-adaptive-primary truncate">{value}</p>
  </div>
);

const PriceCompareRow = ({ platform, price, verified, estimated, link }) => (
  <div className="flex items-center justify-between p-4 modal-card rounded-lg hover:shadow-sm transition-all border">
    <div>
      <span className="text-adaptive-primary font-semibold">{platform}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
        {formatPrice(price)}
      </span>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          title="View on TCGPlayer"
        >
          <ExternalLink className="w-4 h-4 text-blue-500" />
        </a>
      )}
    </div>
  </div>
);

const EbayPriceRow = ({ ebayData, label = "eBay" }) => {
  if (!ebayData) return null;

  const { avg, market, median, low, high, count, verified, searchUrl, cheapestListing } = ebayData;
  
  // Use market (median) if available, otherwise avg
  const displayPrice = market || median || avg || 0;

  return (
    <div className="flex items-center justify-between p-4 modal-card rounded-lg hover:shadow-sm transition-all border group">
      <div>
        <span className="text-adaptive-primary font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {low > 0 && high > 0 ? (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(low)} - {formatPrice(high)}
          </span>
        ) : (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(displayPrice)}
          </span>
        )}
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            title={verified ? "View on eBay" : "Search on eBay (no results found)"}
          >
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </a>
        )}
      </div>
    </div>
  );
};

const PSA10PriceRow = ({ psa10Data }) => {
  if (!psa10Data) return null;

  const { avg, market, median, low, high, count, verified, searchUrl } = psa10Data;
  
  // Use market (median) if available, otherwise avg
  const displayPrice = market || median || avg || 0;

  return (
    <div className="flex items-center justify-between p-4 modal-card rounded-lg hover:shadow-sm transition-all border group">
      <div>
        <span className="text-adaptive-primary font-semibold">
          eBay PSA 10
        </span>
      </div>
      <div className="flex items-center gap-3">
        {low > 0 && high > 0 ? (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(low)} - {formatPrice(high)}
          </span>
        ) : (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(displayPrice)}
          </span>
        )}
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            title={verified ? "View PSA 10 on eBay" : "Search PSA 10 on eBay (no results found)"}
          >
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </a>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center p-4 modal-card rounded-lg border">
    <span className="text-adaptive-secondary font-semibold uppercase text-xs tracking-wide">{label}</span>
    <span className="text-adaptive-primary font-bold">{value}</span>
  </div>
);

export default CardModal;
