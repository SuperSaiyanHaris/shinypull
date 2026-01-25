import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, SortDesc, Info, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import CardModal from './CardModal';
import CardFilters from './CardFilters';
import AddToCollectionButton from './AddToCollectionButton';
import PriceAlertButton from './PriceAlertButton';
import { formatPrice } from '../services/cardService';
import { getSetCards } from '../services/dbSetService';

const SetDetailPage = ({ set }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  
  // Filter state
  const [filters, setFilters] = useState({
    sortBy: 'number',
    types: [],
    supertypes: [],
    rarities: []
  });

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      const cardsFromDb = await getSetCards(set.id);
      setCards(cardsFromDb);
      setLoading(false);
    };

    loadCards();
  }, [set]);

  // Apply filters to cards
  const filteredCards = cards
    .filter(card => {
      // Search filter
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.types.length > 0) {
        const cardTypes = card.types || [];
        if (!cardTypes.some(type => filters.types.includes(type))) {
          return false;
        }
      }
      
      // Supertype filter
      if (filters.supertypes.length > 0) {
        if (!filters.supertypes.includes(card.supertype)) {
          return false;
        }
      }
      
      // Rarity filter
      if (filters.rarities.length > 0) {
        if (!filters.rarities.includes(card.rarity)) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'price') return (b.prices?.tcgplayer?.market || 0) - (a.prices?.tcgplayer?.market || 0);
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      if (filters.sortBy === 'number') return parseInt(a.number) - parseInt(b.number);
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
          onClick={() => navigate('/')}
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary hover:bg-adaptive-hover transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {(filters.types.length + filters.supertypes.length + filters.rarities.length) > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {filters.types.length + filters.supertypes.length + filters.rarities.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-adaptive">
          <p className="text-sm text-adaptive-tertiary">
            {loading ? (
              'Loading cards...'
            ) : (
              <>
                Showing <span className="font-semibold text-adaptive-primary">{filteredCards.length}</span> of {cards.length} cards
                <span className="mx-2">•</span>
                <span className="text-xs">Sorted by: {filters.sortBy === 'price' ? 'Price (High to Low)' : filters.sortBy === 'name' ? 'Name (A-Z)' : 'Card Number'}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className={`${showFilters ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
        <>
      {/* Mobile Card List - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {/* Auth Banner for non-authenticated users */}
        {!user && (
          <div className="glass-effect rounded-xl border border-adaptive p-4 bg-blue-600/10 border-blue-600/30">
            <p className="text-sm text-adaptive-primary mb-3">
              <span className="font-semibold">Sign in</span> to view pricing and add cards to your collection
            </p>
            <button
              onClick={() => openAuthModal()}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
        
        {filteredCards.map((card, index) => (
          <div
            key={card.id}
            className="glass-effect rounded-xl border border-adaptive p-4 flex items-center gap-4 animate-slide-up relative"
            style={{ animationDelay: `${index * 20}ms` }}
          >
            {/* Card Image */}
            <button
              onClick={() => handleViewDetails(card)}
              className="flex-shrink-0 w-16 h-22 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden"
            >
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x280?text=Card';
                }}
              />
            </button>

            {/* Card Info */}
            <button
              onClick={() => handleViewDetails(card)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-sm font-semibold text-adaptive-primary truncate">{card.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-adaptive-tertiary">#{card.number}</span>
                <span className="text-adaptive-tertiary">•</span>
                <span className="text-xs text-adaptive-tertiary">{card.rarity}</span>
              </div>
              <p className={`text-lg font-bold price-gradient mt-2 ${!user ? 'blur-sm' : ''}`}>
                {user ? formatPrice(card.prices.tcgplayer.market) : '$---.--'}
              </p>
            </button>

            {/* Add to Collection Button */}
            <div className={!user ? 'blur-sm pointer-events-none select-none' : ''}>
              <AddToCollectionButton card={card} variant="icon" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Cards Table - Hidden on mobile */}
      <div className="hidden md:block glass-effect rounded-2xl border border-adaptive">
        {/* Auth Banner for non-authenticated users */}
        {!user && (
          <div className="p-4 bg-blue-600/10 border-b border-blue-600/30 flex items-center justify-between">
            <p className="text-sm text-adaptive-primary">
              <span className="font-semibold">Sign in</span> to view pricing, add cards to your collection, and set price alerts
            </p>
            <button
              onClick={() => openAuthModal()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
        
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
                <th className="px-6 py-4 text-center text-xs font-semibold text-adaptive-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-adaptive">
              {filteredCards.map((card, index) => (
                <tr
                  key={card.id}
                  className="hover:bg-adaptive-hover transition-colors animate-slide-up cursor-pointer relative"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => handleViewDetails(card)}
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
                    <span className={`text-sm font-bold price-gradient ${!user ? 'blur-sm select-none' : ''}`}>
                      {user ? formatPrice(card.prices.tcgplayer.market) : '$---.--'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center justify-center gap-2 ${!user ? 'blur-sm pointer-events-none select-none' : ''}`} onClick={(e) => e.stopPropagation()}>
                      <AddToCollectionButton card={card} variant="compact" />
                      <PriceAlertButton card={card} className="!px-3 !py-1.5 !text-sm !rounded-lg" />
                      <button
                        onClick={() => handleViewDetails(card)}
                        className="px-3 py-1.5 bg-adaptive-card hover:bg-adaptive-hover text-adaptive-primary text-sm font-medium rounded-lg transition-colors border border-adaptive"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
          </div>

          {/* Filters Sidebar - Right side on desktop */}
          {showFilters && (
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-6">
                <CardFilters 
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            </div>
          )}
        </div>
      )}
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
