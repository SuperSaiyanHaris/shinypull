import React, { useState, useEffect } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, Minus, Info, Award, Loader2 } from 'lucide-react';
import { formatPrice, getPriceTrend } from '../services/cardService';
import { getEbayPriceAPI, getEbayPSA10Price, estimateEbayPrice, estimatePSA10Price } from '../services/ebayService';
import { fetchAndUpdateTCGPrice } from '../services/priceUpdateService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import AddToCollectionButton from './AddToCollectionButton';
import PriceAlertButton from './PriceAlertButton';

// Edition badge helper
const getEditionDisplay = (edition) => {
  if (!edition || edition === 'Unlimited') return null;
  
  const displays = {
    '1st Edition': { text: '1st Edition', icon: '🥇', class: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' },
    'Shadowless': { text: 'Shadowless', icon: '👻', class: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    'Reverse Holofoil': { text: 'Reverse Holo', icon: '✨', class: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    'Limited Edition': { text: 'Limited', icon: '💎', class: 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30' },
    'Normal': { text: 'Normal', icon: '', class: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30' }
  };
  
  return displays[edition] || { text: edition, icon: '', class: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30' };
};

// Reusable tooltip component for High price explanation
const HighPriceTooltip = ({ className = "" }) => (
  <div className={`group relative inline-flex items-center ${className}`}>
    <Info className="w-3.5 h-3.5 text-adaptive-tertiary cursor-help ml-1" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 price-tooltip text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] font-normal normal-case tracking-normal pointer-events-none">
      Highest listed price on TCGPlayer. May be inflated by individual sellers and not reflect actual market value.
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent price-tooltip-arrow"></div>
    </div>
  </div>
);

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

    // Fetch fresh TCG market price and update database
    setLoadingTcg(true);
    fetchAndUpdateTCGPrice(card.id)
      .then(freshPrice => {
        if (freshPrice) {
          setTcgPrices(freshPrice);
        }
      })
      .finally(() => setLoadingTcg(false));

    // Check if we already have verified eBay data
    const hasEbayData = card.prices?.ebay?.verified;
    const hasPsa10Data = card.prices?.psa10?.verified;

    // If we already have good data, use it
    if (hasEbayData) {
      setEbayPrices(card.prices.ebay);
    }
    if (hasPsa10Data) {
      setPsa10Prices(card.prices.psa10);
    }

    // If missing data, fetch from eBay API
    if (!hasEbayData || !hasPsa10Data) {
      setLoadingEbay(true);

      const fetchPrices = async () => {
        try {
          const [ebayData, psa10Data] = await Promise.all([
            !hasEbayData ? getEbayPriceAPI(card.name, card.set || '', card.number || '', card.rarity || '') : Promise.resolve(null),
            !hasPsa10Data ? getEbayPSA10Price(card.name, card.set || '', card.number || '', card.rarity || '') : Promise.resolve(null)
          ]);

          if (ebayData) {
            setEbayPrices({
              avg: ebayData.avg,
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
  const displayEbayPrices = ebayPrices || card.prices?.ebay || { avg: 0, verified: false, searchTerms: '', searchUrl: '' };
  const displayPsa10Prices = psa10Prices || card.prices?.psa10 || { avg: 0, verified: false, searchTerms: '', searchUrl: '' };
  
  // Use fresh TCG prices if available, otherwise fall back to card data
  const displayTcgPrices = tcgPrices || {
    market: card.prices?.tcgplayer?.market || 0,
    low: card.prices?.tcgplayer?.low || 0,
    high: card.prices?.tcgplayer?.high || 0
  };

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
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-display text-adaptive-primary">{card.name}</h2>
                  {card.edition && getEditionDisplay(card.edition) && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg border ${getEditionDisplay(card.edition).class}`}>
                      {getEditionDisplay(card.edition).icon} {getEditionDisplay(card.edition).text}
                    </span>
                  )}
                </div>
                <p className="text-sm text-adaptive-secondary mt-1">{card.set} • {card.number}</p>
              </div>

              {/* Price Box */}
              <div className="relative">
                <div className={`p-4 modal-price-box rounded-xl border ${!user ? 'blur-sm select-none' : ''}`}>
                  {/* Variant Prices Grid - adjust columns based on available variants */}
                  <div className={`grid gap-3 mb-3 ${(displayTcgPrices.normal > 0 && displayTcgPrices.holofoil > 0) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {displayTcgPrices.normal > 0 && (
                    <div className="text-center bg-adaptive-hover rounded-lg p-3">
                      <p className="text-xs text-adaptive-secondary font-medium mb-1">Normal</p>
                      <p className="text-xl font-bold text-adaptive-primary">
                        {formatPrice(displayTcgPrices.normal)}
                      </p>
                    </div>
                  )}
                  {displayTcgPrices.holofoil > 0 && (
                    <div className="text-center bg-adaptive-hover rounded-lg p-3">
                      <p className="text-xs text-adaptive-secondary font-medium mb-1">Holofoil</p>
                      <p className="text-xl font-bold price-gradient">
                        {formatPrice(displayTcgPrices.holofoil)}
                      </p>
                    </div>
                  )}
                </div>
                {loadingTcg && <p className="text-xs text-adaptive-tertiary text-center mb-2">(updating...)</p>}

                {/* Price Range Row */}
                <div className="flex gap-3 mt-3 pt-3 border-t border-adaptive">
                  <div className="flex-1">
                    <p className="text-xs text-adaptive-tertiary">Low</p>
                    <p className="text-base font-semibold text-green-500">
                      {formatPrice(displayTcgPrices.low)}
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-adaptive-tertiary">High</p>
                    <p className="text-base font-semibold text-red-500">
                      {formatPrice(displayTcgPrices.high)}
                    </p>
                  </div>
                </div>
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
                  {/* TCGPlayer */}
                  {card.tcgplayerUrl && (
                    <div className="p-3 modal-card rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-adaptive-tertiary">TCG {loadingTcg && <span className="text-[10px]">(updating...)</span>}</p>
                          <p className="text-lg font-bold text-blue-500">
                            {formatPrice(displayTcgPrices.market)}
                          </p>
                        </div>
                        <a
                          href={card.tcgplayerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <span className="text-xs font-medium text-green-500">View</span>
                          <ExternalLink className="w-3.5 h-3.5 text-green-500" />
                        </a>
                      </div>
                    </div>
                  )}

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
                              {displayEbayPrices.verified ? 'eBay Raw Card' : 'eBay Raw Card (est.)'}
                            </p>
                            <p className="text-lg font-bold text-blue-500">
                              {displayEbayPrices.verified && displayEbayPrices.low !== undefined
                                ? `${formatPrice(displayEbayPrices.low)} - ${formatPrice(displayEbayPrices.high)}`
                                : formatPrice(displayEbayPrices.avg)}
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
                              {displayPsa10Prices.verified ? 'eBay PSA 10' : 'eBay PSA 10 (est.)'}
                            </p>
                            <p className="text-lg font-bold text-blue-500">
                              {displayPsa10Prices.verified && displayPsa10Prices.low !== undefined
                                ? `${formatPrice(displayPsa10Prices.low)} - ${formatPrice(displayPsa10Prices.high)}`
                                : formatPrice(displayPsa10Prices.avg)}
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
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h2 className="text-4xl font-display text-adaptive-primary">
                        {card.name}
                      </h2>
                      {card.edition && getEditionDisplay(card.edition) && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg border ${getEditionDisplay(card.edition).class}`}>
                          {getEditionDisplay(card.edition).icon} {getEditionDisplay(card.edition).text}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-adaptive-secondary">
                    <span className="text-lg">{card.set}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-lg font-mono">{card.number}</span>
                  </div>

                  {/* Current Price Display */}
                  <div className="relative">
                    <div className={`p-6 modal-price-box rounded-xl border ${!user ? 'blur-sm select-none' : ''}`}>
                      {/* Variant Prices Grid - adjust columns based on available variants */}
                      <div className={`grid gap-4 mb-4 ${(displayTcgPrices.normal > 0 && displayTcgPrices.holofoil > 0) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {displayTcgPrices.normal > 0 && (
                        <div className="text-center bg-adaptive-hover rounded-lg p-4">
                          <p className="text-sm text-adaptive-secondary font-medium mb-2">Normal</p>
                          <p className="text-3xl font-bold text-adaptive-primary">
                            {formatPrice(displayTcgPrices.normal)}
                          </p>
                        </div>
                      )}
                      {displayTcgPrices.holofoil > 0 && (
                        <div className="text-center bg-adaptive-hover rounded-lg p-4">
                          <p className="text-sm text-adaptive-secondary font-medium mb-2">Holofoil</p>
                          <p className="text-3xl font-bold price-gradient">
                            {formatPrice(displayTcgPrices.holofoil)}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-adaptive-tertiary text-center mb-3">Prices updated regularly</p>
                    {loadingTcg && <p className="text-xs text-adaptive-tertiary text-center mb-3">(updating...)</p>}

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 modal-price-card rounded-lg border">
                        <p className="text-xs text-adaptive-tertiary mb-1">Low</p>
                        <p className="text-lg font-semibold text-green-500">
                          {formatPrice(displayTcgPrices.low)}
                        </p>
                      </div>
                      <div className="p-3 modal-price-card rounded-lg border">
                        <p className="text-xs text-adaptive-tertiary mb-1 flex items-center">
                          High
                          <HighPriceTooltip />
                        </p>
                        <p className="text-lg font-semibold text-red-500">
                          {formatPrice(displayTcgPrices.high)}
                        </p>
                      </div>
                    </div>
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
                  <PriceCompareRow
                    platform="TCG"
                    price={card.prices.tcgplayer.market}
                    verified
                    link={card.tcgplayerUrl}
                  />
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
    <div className="flex items-center gap-3">
      <span className="text-adaptive-primary font-semibold">{platform}</span>
      {verified && (
        <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/30">
          ✓ Verified
        </span>
      )}
      {estimated && (
        <span className="px-2 py-0.5 badge-estimated text-xs font-bold rounded-full">
          ~Estimated
        </span>
      )}
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

  const { avg, low, high, count, verified, searchUrl, cheapestListing } = ebayData;

  return (
    <div className="flex items-center justify-between p-4 modal-card rounded-lg hover:shadow-sm transition-all border group">
      <div className="flex items-center gap-3">
        <span className="text-adaptive-primary font-semibold">
          {verified ? label : `${label} (estimated)`}
        </span>
        {verified ? (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/30">
            ✓ Found listings
          </span>
        ) : (
          <span className="px-2 py-0.5 badge-estimated text-xs font-bold rounded-full">
            ~Estimated
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {verified && low !== undefined && high !== undefined ? (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(low)} - {formatPrice(high)}
          </span>
        ) : (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(avg)}
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

  const { avg, low, high, count, verified, searchUrl } = psa10Data;

  return (
    <div className="flex items-center justify-between p-4 modal-card rounded-lg hover:shadow-sm transition-all border group">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <span className="text-adaptive-primary font-semibold">
            {verified ? 'eBay PSA 10' : 'eBay PSA 10 (estimated)'}
          </span>
        </div>
        {verified ? (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/30">
            ✓ Found listings
          </span>
        ) : (
          <span className="px-2 py-0.5 badge-estimated text-xs font-bold rounded-full">
            ~Estimated
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {verified && low !== undefined && high !== undefined ? (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(low)} - {formatPrice(high)}
          </span>
        ) : (
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(avg)}
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
