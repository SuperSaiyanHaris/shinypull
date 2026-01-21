import React, { useState } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { formatPrice, getPriceTrend } from '../services/cardService';
import PriceChart from './PriceChart';

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

const CardModal = ({ card, isOpen, onClose }) => {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-backdrop backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-slide-up modal-container border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 modal-button rounded-lg transition-colors group border"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-adaptive-secondary group-hover:text-adaptive-primary" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh]">
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
                  <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-colors shadow-lg">
                    Add to Collection
                  </button>
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
              {['overview', 'chart', 'compare', 'details'].map((tab) => (
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

            {activeTab === 'chart' && (
              <div>
                <h3 className="text-xl font-display text-adaptive-primary mb-4">Price History</h3>
                <PriceChart
                  priceHistory={card.priceHistory}
                  currentPrice={card.prices.tcgplayer.market}
                />
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
                  <PriceCompareRow
                    platform={card.prices.ebay.verified ? "eBay API" : "eBay (estimated)"}
                    price={card.prices.ebay.avg}
                    verified={card.prices.ebay.verified}
                    estimated={!card.prices.ebay.verified}
                  />
                  <PriceCompareRow
                    platform={card.prices.psa10.verified ? "PSA 10 (eBay)" : "PSA 10 (estimated)"}
                    price={card.prices.psa10.avg}
                    verified={card.prices.psa10.verified}
                    estimated={!card.prices.psa10.verified}
                  />
                </div>
                <p className="text-xs text-adaptive-tertiary mt-6 text-center">
                  Verified prices from Pokemon TCG API. Other sources are estimates based on market data.
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

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center p-4 modal-card rounded-lg border">
    <span className="text-adaptive-secondary font-semibold uppercase text-xs tracking-wide">{label}</span>
    <span className="text-adaptive-primary font-bold">{value}</span>
  </div>
);

export default CardModal;
