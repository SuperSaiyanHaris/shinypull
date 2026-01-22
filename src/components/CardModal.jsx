import React, { useState } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, Minus, Info, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { formatPrice, getPriceTrend } from '../services/cardService';
import AddToCollectionButton from './AddToCollectionButton';
import PSA10Dropdown from './PSA10Dropdown';

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

  // Close modal when clicking backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on Escape key
  React.useEffect(() => {
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

  // Early return AFTER all hooks
  if (!isOpen || !card) return null;

  const trend = getPriceTrend(card.priceHistory);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 modal-backdrop backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Mobile: Full-screen drawer from bottom | Desktop: Centered modal */}
      <div className="relative w-full md:max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-up modal-container border">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-adaptive bg-adaptive-card sticky top-0 z-20">
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto h-full md:max-h-[90vh]">
          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Card Image - Smaller on mobile */}
            <div className="p-4 flex justify-center bg-gradient-to-b from-slate-800/50 to-transparent">
              <div className="relative w-40 aspect-[3/4]">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full shadow">
                    {card.rarity}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Info */}
            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-2xl font-display text-adaptive-primary">{card.name}</h2>
                <p className="text-sm text-adaptive-secondary mt-1">{card.set}</p>
              </div>

              {/* Price Box */}
              <div className="p-4 modal-price-box rounded-xl border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-adaptive-secondary">Market Price</p>
                    <p className="text-3xl font-bold price-gradient">
                      {formatPrice(card.prices.tcgplayer.market)}
                    </p>
                  </div>
                  <TrendIcon className={`w-8 h-8 ${trendColor}`} />
                </div>

                {/* Price Range Row */}
                <div className="flex gap-3 mt-3 pt-3 border-t border-adaptive">
                  <div className="flex-1">
                    <p className="text-xs text-adaptive-tertiary">Low</p>
                    <p className="text-base font-semibold text-green-500">
                      {formatPrice(card.prices.tcgplayer.low)}
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-adaptive-tertiary">High</p>
                    <p className="text-base font-semibold text-red-500">
                      {formatPrice(card.prices.tcgplayer.high)}
                    </p>
                  </div>
                </div>
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
              <div className="flex gap-3 pt-2">
                <AddToCollectionButton 
                  card={card} 
                  className="flex-1"
                  onSuccess={onCardAdded}
                  onRemove={onCardRemoved}
                />
                <button className="px-4 py-3 modal-button rounded-xl border">
                  <ExternalLink className="w-5 h-5 text-adaptive-secondary" />
                </button>
              </div>

              {/* Source info */}
              <p className="text-xs text-adaptive-tertiary text-center">
                <span className="text-green-500">●</span> Live prices from Pokemon TCG API
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
                    {/* Rarity Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1.5 bg-yellow-400 text-slate-900 text-sm font-bold rounded-full shadow-lg">
                        {card.rarity}
                      </span>
                    </div>
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
                  <div className="p-6 modal-price-box rounded-xl border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-adaptive-secondary mb-1">Market Price</p>
                        <p className="text-4xl font-bold price-gradient">
                          {formatPrice(card.prices.tcgplayer.market)}
                        </p>
                        <p className="text-xs text-adaptive-tertiary mt-2">
                          <span className="text-green-500">●</span> Live from Pokemon TCG API
                        </p>
                      </div>
                      <TrendIcon className={`w-12 h-12 ${trendColor}`} />
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 modal-price-card rounded-lg border">
                        <p className="text-xs text-adaptive-tertiary mb-1">Low</p>
                        <p className="text-lg font-semibold text-green-500">
                          {formatPrice(card.prices.tcgplayer.low)}
                        </p>
                      </div>
                      <div className="p-3 modal-price-card rounded-lg border">
                        <p className="text-xs text-adaptive-tertiary mb-1 flex items-center">
                          High
                          <HighPriceTooltip />
                        </p>
                        <p className="text-lg font-semibold text-red-500">
                          {formatPrice(card.prices.tcgplayer.high)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-3">
                    <AddToCollectionButton 
                      card={card} 
                      className="flex-1"
                      onSuccess={onCardAdded}
                      onRemove={onCardRemoved}
                    />
                    <button className="px-4 py-3 modal-button text-adaptive-secondary rounded-xl transition-colors border">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="modal-tabs border-b">
              <div className="flex gap-1 px-8 pt-6">
                {['overview', 'compare', 'details'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-t-lg font-medium capitalize transition-all ${
                      activeTab === tab
                        ? 'tab-active border-t border-x'
                        : 'tab-inactive'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8 modal-content">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display text-adaptive-primary mb-4">Price Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      label="Current Market"
                      value={formatPrice(card.prices.tcgplayer.market)}
                      trend={trend}
                    />
                    <StatCard
                      label="Lowest Price"
                      value={formatPrice(card.prices.tcgplayer.low)}
                      color="text-green-500"
                    />
                    <StatCard
                      label="Highest Price"
                      value={formatPrice(card.prices.tcgplayer.high)}
                      color="text-red-500"
                      showHighTooltip
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-display text-adaptive-primary mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoCard label="Set" value={card.set} />
                    <InfoCard label="Number" value={card.number} />
                    <InfoCard label="Rarity" value={card.rarity} />
                    <InfoCard label="Card ID" value={card.id} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compare' && (
              <div>
                <h3 className="text-xl font-display text-adaptive-primary mb-4">Price Comparison</h3>
                <div className="space-y-3">
                  <PriceCompareRow
                    platform="Pokemon TCG API"
                    price={card.prices.tcgplayer.market}
                    verified
                  />
                  <EbayPriceRow
                    ebayData={card.prices.ebay}
                  />
                  <PSA10Dropdown
                    psa10Data={card.prices.psa10}
                  />
                </div>
                {card.prices.ebay.searchTerms && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-adaptive">
                    <p className="text-xs text-adaptive-tertiary">
                      <span className="font-semibold">eBay Search Title:</span>{' '}
                      <span className="font-mono text-adaptive-secondary">{card.prices.ebay.searchTerms}</span>
                    </p>
                  </div>
                )}
                <p className="text-xs text-adaptive-tertiary mt-4 text-center">
                  Verified prices from Pokemon TCG API. eBay prices from recent sold listings.
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div>
                <h3 className="text-xl font-display text-adaptive-primary mb-4">Card Details</h3>
                <div className="space-y-4">
                  <DetailRow label="Name" value={card.name} />
                  <DetailRow label="Set" value={card.set} />
                  <DetailRow label="Card Number" value={card.number} />
                  <DetailRow label="Rarity" value={card.rarity} />
                  <DetailRow label="Card ID" value={card.id} />
                  <DetailRow
                    label="Market Price"
                    value={formatPrice(card.prices.tcgplayer.market)}
                  />
                  <DetailRow
                    label="Price Range"
                    value={`${formatPrice(card.prices.tcgplayer.low)} - ${formatPrice(card.prices.tcgplayer.high)}`}
                  />
                </div>
              </div>
            )}
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

const PriceCompareRow = ({ platform, price, verified, estimated }) => (
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
    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
      {formatPrice(price)}
    </span>
  </div>
);

const EbayPriceRow = ({ ebayData }) => {
  if (!ebayData) return null;

  const { avg, verified, searchUrl } = ebayData;

  return (
    <div className="flex items-center justify-between p-4 modal-card rounded-lg hover:shadow-sm transition-all border group">
      <div className="flex items-center gap-3">
        <span className="text-adaptive-primary font-semibold">
          {verified ? 'eBay (Sold)' : 'eBay (estimated)'}
        </span>
        {verified ? (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/30">
            ✓ Verified
          </span>
        ) : (
          <span className="px-2 py-0.5 badge-estimated text-xs font-bold rounded-full">
            ~Estimated
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {formatPrice(avg)}
        </span>
        {verified && searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            title="View on eBay"
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
