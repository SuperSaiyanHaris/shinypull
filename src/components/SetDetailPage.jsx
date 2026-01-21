import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SortDesc, Info } from 'lucide-react';
import CardModal from './CardModal';
import { formatPrice } from '../services/cardService';
import { getSetCards } from '../services/dbSetService';

const SetDetailPage = ({ set, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('price'); // price, name, number
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      const cardsFromDb = await getSetCards(set.id);
      setCards(cardsFromDb);
      setLoading(false);
    };

    loadCards();
  }, [set]);

  const filteredCards = cards
    .filter(card => card.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price') return b.prices.tcgplayer.market - a.prices.tcgplayer.market;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'number') return parseInt(a.number) - parseInt(b.number);
      return 0;
    });

  const handleViewDetails = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-4 md:p-8 border border-adaptive">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-adaptive-secondary hover:text-adaptive-primary transition-colors mb-4 md:mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Sets</span>
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
          <div className="w-32 h-20 md:w-48 md:h-28 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center p-3 md:p-4 flex-shrink-0">
            <img
              src={set.logo}
              alt={set.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x225?text=' + encodeURIComponent(set.name);
              }}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-display text-adaptive-primary mb-1 md:mb-2">{set.name}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-adaptive-secondary">
              <span>{set.series}</span>
              <span className="hidden sm:inline">•</span>
              <span>{set.totalCards} cards</span>
              <span className="hidden sm:inline">•</span>
              <span className="w-full sm:w-auto">Released {new Date(set.releaseDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-effect rounded-2xl p-6 border border-adaptive relative z-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-adaptive-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards in this set..."
                className="w-full pl-12 pr-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary placeholder-adaptive-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="relative">
              <SortDesc className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-adaptive-tertiary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
              >
                <option value="price">Price (High to Low)</option>
                <option value="name">Name (A-Z)</option>
                <option value="number">Card Number</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-adaptive">
          <p className="text-sm text-adaptive-tertiary">
            {loading ? (
              'Loading cards...'
            ) : (
              <>
                Showing <span className="font-semibold text-adaptive-primary">{filteredCards.length}</span> of {cards.length} cards
              </>
            )}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
      {/* Mobile Card List - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {filteredCards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleViewDetails(card)}
            className="w-full glass-effect rounded-xl border border-adaptive p-4 flex items-center gap-4 hover:bg-adaptive-hover transition-colors animate-slide-up text-left"
            style={{ animationDelay: `${index * 20}ms` }}
          >
            {/* Card Image */}
            <div className="flex-shrink-0 w-16 h-22 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x280?text=Card';
                }}
              />
            </div>

            {/* Card Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-adaptive-primary truncate">{card.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-adaptive-tertiary">#{card.number}</span>
                <span className="text-adaptive-tertiary">•</span>
                <span className="text-xs text-adaptive-tertiary">{card.rarity}</span>
              </div>
              <p className="text-lg font-bold price-gradient mt-2">
                {formatPrice(card.prices.tcgplayer.market)}
              </p>
            </div>

            {/* Arrow indicator */}
            <div className="flex-shrink-0 text-adaptive-tertiary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop Cards Table - Hidden on mobile */}
      <div className="hidden md:block glass-effect rounded-2xl border border-adaptive">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-adaptive-card border-b border-adaptive relative overflow-visible">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  Card
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  Rarity
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  Market Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  Low
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-1 group relative">
                    High
                    <Info className="w-3.5 h-3.5 text-adaptive-tertiary cursor-help" />
                    <div className="absolute top-full right-0 mt-2 w-56 p-3 price-tooltip text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] font-normal normal-case tracking-normal pointer-events-none">
                      Highest listed price on TCGPlayer. May be inflated by individual sellers and not reflect actual market value.
                      <div className="absolute bottom-full right-4 border-4 border-transparent price-tooltip-arrow-down"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-adaptive">
              {filteredCards.map((card, index) => (
                <tr
                  key={card.id}
                  className="hover:bg-adaptive-hover transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-22 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden">
                        <img
                          src={card.image}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x280?text=Card';
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-adaptive-primary">{card.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-adaptive-secondary">{card.number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-adaptive-secondary">{card.rarity}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold price-gradient">
                      {formatPrice(card.prices.tcgplayer.market)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-green-500 font-medium">
                      {formatPrice(card.prices.tcgplayer.low)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-red-500 font-medium">
                      {formatPrice(card.prices.tcgplayer.high)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewDetails(card)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SetDetailPage;
