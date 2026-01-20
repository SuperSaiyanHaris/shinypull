import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { formatPrice, getPriceTrend } from '../services/cardService';
import PriceChart from './PriceChart';
import CardModal from './CardModal';

const CardItem = ({ card, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const trend = getPriceTrend(card.priceHistory);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <>
    <div
      className="glass-effect rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Card Image */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
          <span className="px-3 py-1 bg-accent/90 backdrop-blur-sm text-slate-900 text-xs font-semibold rounded-full">
            {card.rarity}
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-6">
        <h3 className="text-xl font-display text-slate-100 mb-1 line-clamp-1">
          {card.name}
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          {card.set} • {card.number}
        </p>

        {/* Price Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedView('overview')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('chart')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'chart'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setSelectedView('compare')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'compare'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Compare
          </button>
        </div>

        {/* Price Display */}
        {selectedView === 'overview' && (
          <div className="space-y-3">
            {/* Market Price */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div>
                <p className="text-xs text-slate-400 mb-1">Market Price</p>
                <p className="text-2xl font-bold price-gradient">
                  {formatPrice(card.prices.tcgplayer.market)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="text-green-400">●</span> Live from Pokemon TCG API
                </p>
              </div>
              <TrendIcon className={`w-6 h-6 ${trendColor}`} />
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Low</p>
                <p className="text-sm font-semibold text-green-400">
                  {formatPrice(card.prices.tcgplayer.low)}
                </p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">High</p>
                <p className="text-sm font-semibold text-red-400">
                  {formatPrice(card.prices.tcgplayer.high)}
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'chart' && (
          <div>
            <PriceChart
              priceHistory={card.priceHistory}
              currentPrice={card.prices.tcgplayer.market}
            />
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
              platform="eBay (est.)"
              price={card.prices.ebay.avg}
              estimated
            />
            <PriceCompareRow
              platform="Cardmarket (est.)"
              price={card.prices.cardmarket.avg}
              estimated
            />
            <p className="text-xs text-slate-500 mt-3 text-center">
              Verified prices from Pokemon TCG API. Others estimated.
            </p>
          </div>
        )}

        {/* View Details Link */}
        <button
          onClick={() => {
            console.log('Opening modal for card:', card.name);
            setIsModalOpen(true);
          }}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-primary-400 font-medium rounded-xl transition-colors group"
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
  <div className={`flex items-center justify-between p-3 rounded-lg ${
    highlight ? 'bg-primary-900/20 border border-primary-800/30' : 'bg-slate-800/30'
  }`}>
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-300">{platform}</span>
      {verified && (
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
          ✓ Live
        </span>
      )}
      {estimated && (
        <span className="px-2 py-0.5 bg-slate-700/50 text-slate-500 text-xs rounded-full">
          ~Est
        </span>
      )}
    </div>
    <span className={`text-sm font-semibold ${
      highlight ? 'text-primary-400' : 'text-slate-400'
    }`}>
      {formatPrice(price)}
    </span>
  </div>
);

export default CardItem;
