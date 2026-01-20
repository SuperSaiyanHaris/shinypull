import React, { useState } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPrice, getPriceTrend } from '../services/cardService';
import PriceChart from './PriceChart';

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
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-slate-900 rounded-2xl shadow-2xl animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header Section */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 border-b border-slate-800">
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
                    <span className="px-3 py-1.5 bg-accent/90 backdrop-blur-sm text-slate-900 text-sm font-semibold rounded-full shadow-lg">
                      {card.rarity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Card Info */}
              <div className="flex flex-col justify-center space-y-4">
                <h2 className="text-4xl font-display text-slate-100 mb-2">
                  {card.name}
                </h2>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="text-lg">{card.set}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-lg font-mono">{card.number}</span>
                </div>

                {/* Current Price Display */}
                <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Market Price</p>
                      <p className="text-4xl font-bold price-gradient">
                        {formatPrice(card.prices.tcgplayer.market)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        <span className="text-green-400">●</span> Live from Pokemon TCG API
                      </p>
                    </div>
                    <TrendIcon className={`w-12 h-12 ${trendColor}`} />
                  </div>

                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Low</p>
                      <p className="text-lg font-semibold text-green-400">
                        {formatPrice(card.prices.tcgplayer.low)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">High</p>
                      <p className="text-lg font-semibold text-red-400">
                        {formatPrice(card.prices.tcgplayer.high)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
                    Add to Collection
                  </button>
                  <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border-b border-slate-800">
            <div className="flex gap-1 px-8 pt-6">
              {['overview', 'chart', 'compare', 'details'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-t-lg font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display text-slate-200 mb-4">Price Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      label="Current Market"
                      value={formatPrice(card.prices.tcgplayer.market)}
                      trend={trend}
                    />
                    <StatCard
                      label="Lowest Price"
                      value={formatPrice(card.prices.tcgplayer.low)}
                      color="text-green-400"
                    />
                    <StatCard
                      label="Highest Price"
                      value={formatPrice(card.prices.tcgplayer.high)}
                      color="text-red-400"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-display text-slate-200 mb-4">Quick Stats</h3>
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
                <h3 className="text-xl font-display text-slate-200 mb-4">Price History</h3>
                <PriceChart
                  priceHistory={card.priceHistory}
                  currentPrice={card.prices.tcgplayer.market}
                />
              </div>
            )}

            {activeTab === 'compare' && (
              <div>
                <h3 className="text-xl font-display text-slate-200 mb-4">Price Comparison</h3>
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
                    platform="Cardmarket (estimated)"
                    price={card.prices.cardmarket.avg}
                    estimated
                  />
                </div>
                <p className="text-xs text-slate-500 mt-6 text-center">
                  Verified prices from Pokemon TCG API. Other sources are estimates based on market data.
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <div>
                <h3 className="text-xl font-display text-slate-200 mb-4">Card Details</h3>
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
const StatCard = ({ label, value, trend, color = 'text-primary-400' }) => (
  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
    <p className="text-xs text-slate-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {trend && (
      <p className="text-xs text-slate-500 mt-1 capitalize">Trend: {trend}</p>
    )}
  </div>
);

const InfoCard = ({ label, value }) => (
  <div className="p-4 bg-slate-800/30 rounded-lg">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-200 truncate">{value}</p>
  </div>
);

const PriceCompareRow = ({ platform, price, verified, estimated }) => (
  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-slate-300">{platform}</span>
      {verified && (
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
          ✓ Verified
        </span>
      )}
      {estimated && (
        <span className="px-2 py-0.5 bg-slate-700/50 text-slate-500 text-xs rounded-full">
          ~Estimated
        </span>
      )}
    </div>
    <span className="text-lg font-semibold text-primary-400">
      {formatPrice(price)}
    </span>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-lg">
    <span className="text-slate-400">{label}</span>
    <span className="text-slate-200 font-semibold">{value}</span>
  </div>
);

export default CardModal;
