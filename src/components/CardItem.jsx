import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { formatPrice, getPriceTrend } from '../services/cardService';
import CardModal from './CardModal';

const CardItem = ({ card, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const trend = getPriceTrend(card.priceHistory);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500';

  return (
    <>
    <div
      className="glass-effect rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Card Image */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={card.image}
          alt={card.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-contain p-4 transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Rarity Badge */}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full shadow-lg">
            {card.rarity}
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-6">
        <h3 className="text-xl font-display text-adaptive-primary mb-1 line-clamp-1">
          {card.name}
        </h3>
        <p className="text-sm text-adaptive-secondary mb-4 font-medium">
          {card.set} • {card.number}
        </p>

        {/* Price Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedView('overview')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-adaptive-card text-adaptive-secondary hover:bg-adaptive-hover border border-adaptive'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('compare')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'compare'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-adaptive-card text-adaptive-secondary hover:bg-adaptive-hover border border-adaptive'
            }`}
          >
            Compare
          </button>
        </div>

        {/* Price Display */}
        {selectedView === 'overview' && (
          <div className="space-y-3">
            {/* Market Price */}
            <div className="flex items-center justify-between p-4 bg-adaptive-card rounded-xl border border-adaptive">
              <div>
                <p className="text-xs text-adaptive-secondary font-medium mb-1">Market Price</p>
                <p className="text-2xl font-bold price-gradient">
                  {formatPrice(card.prices.tcgplayer.market)}
                </p>
                <p className="text-xs text-adaptive-tertiary mt-1 font-medium">
                  <span className="text-green-500">●</span> Live from Pokemon TCG API
                </p>
              </div>
              <TrendIcon className={`w-6 h-6 ${trendColor}`} />
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-adaptive-card rounded-lg border border-adaptive">
                <p className="text-xs text-adaptive-tertiary mb-1 font-medium">Low</p>
                <p className="text-sm font-bold text-green-500">
                  {formatPrice(card.prices.tcgplayer.low)}
                </p>
              </div>
              <div className="p-3 bg-adaptive-card rounded-lg border border-adaptive">
                <p className="text-xs text-adaptive-tertiary mb-1 font-medium">High</p>
                <p className="text-sm font-bold text-red-500">
                  {formatPrice(card.prices.tcgplayer.high)}
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'compare' && (
          <div className="space-y-2">
            <PriceCompareRow
              platform="Pokemon TCG"
              price={card.prices.tcgplayer.market}
              highlight
              verified
            />
            <PriceCompareRow
              platform={card.prices.ebay.verified ? "eBay" : "eBay (est.)"}
              price={card.prices.ebay.avg}
              verified={card.prices.ebay.verified}
              estimated={!card.prices.ebay.verified}
            />
            <PriceCompareRow
              platform={card.prices.psa10.verified ? "PSA 10" : "PSA 10 (est.)"}
              price={card.prices.psa10.avg}
              verified={card.prices.psa10.verified}
              estimated={!card.prices.psa10.verified}
            />
            <p className="text-xs text-adaptive-tertiary mt-3 text-center font-medium">
              {card.prices.ebay.verified || card.prices.psa10.verified
                ? "✓ Live prices from Pokemon TCG & eBay APIs"
                : "Verified prices from Pokemon TCG API. Others estimated."}
            </p>
          </div>
        )}

        {/* View Details Link */}
        <button
          onClick={() => {
            console.log('Opening modal for card:', card.name);
            setIsModalOpen(true);
          }}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-adaptive-card hover:bg-adaptive-hover text-blue-600 dark:text-blue-400 font-semibold rounded-xl transition-colors group border border-adaptive"
        >
          View Full Details
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>

      {/* Modal - Rendered outside card container */}
      <CardModal
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

const PriceCompareRow = ({ platform, price, highlight, verified, estimated }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border ${
    highlight
      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
      : 'bg-adaptive-card border-adaptive'
  }`}>
    <div className="flex items-center gap-2">
      <span className="text-sm text-adaptive-primary font-medium">{platform}</span>
      {verified && (
        <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
          ✓ Live
        </span>
      )}
      {estimated && (
        <span className="px-2 py-0.5 badge-estimated text-xs font-semibold rounded-full">
          ~Est
        </span>
      )}
    </div>
    <span className={`text-sm font-bold ${
      highlight ? 'text-blue-600 dark:text-blue-400' : 'text-adaptive-primary'
    }`}>
      {formatPrice(price)}
    </span>
  </div>
);

export default CardItem;
