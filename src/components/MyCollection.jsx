import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Minus, Package, Sparkles, Layers, Grid, List, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collectionService } from '../services/collectionService';
import { getSetCards } from '../services/dbSetService';
import { formatPrice } from '../services/cardService';
import CardModal from './CardModal';
import AddToCollectionButton from './AddToCollectionButton';

const MyCollection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCards: 0, uniqueCards: 0, totalSets: 0 });

  // Set-based view state
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [setCards, setSetCards] = useState([]);
  const [loadingSetCards, setLoadingSetCards] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadCollection();
    }
  }, [user]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const [data, statsData] = await Promise.all([
        collectionService.getCollection(user.id),
        collectionService.getCollectionStats(user.id)
      ]);
      setCollection(data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group collection by set
  const collectionBySet = collection.reduce((acc, item) => {
    const setId = item.set_id || 'unknown';
    if (!acc[setId]) {
      acc[setId] = {
        setId,
        setName: item.set_name || 'Unknown Set',
        cards: [],
        totalQuantity: 0
      };
    }
    acc[setId].cards.push(item);
    acc[setId].totalQuantity += item.quantity;
    return acc;
  }, {});

  const setList = Object.values(collectionBySet).sort((a, b) =>
    a.setName.localeCompare(b.setName)
  );

  // Load all cards for selected set
  useEffect(() => {
    if (selectedSetId) {
      loadSetCards(selectedSetId);
    }
  }, [selectedSetId]);

  const loadSetCards = async (setId) => {
    try {
      setLoadingSetCards(true);
      const cards = await getSetCards(setId);
      setSetCards(cards);
    } catch (error) {
      console.error('Error loading set cards:', error);
      setSetCards([]);
    } finally {
      setLoadingSetCards(false);
    }
  };

  // Get collected card IDs for the selected set
  const getCollectedCardIds = () => {
    const setData = collectionBySet[selectedSetId];
    if (!setData) return new Map();
    return new Map(setData.cards.map(c => [c.card_id, c]));
  };

  const collectedCards = getCollectedCardIds();

  // Calculate set statistics
  const getSetStatistics = () => {
    if (!selectedSetId || !setCards.length) return null;
    
    const setData = collectionBySet[selectedSetId];
    const collectedCount = collectedCards.size;
    const totalCards = setCards.length;
    const completionPercent = ((collectedCount / totalCards) * 100).toFixed(1);
    
    // Calculate total market value of collected cards
    const ownedMarketValue = setCards
      .filter(card => collectedCards.has(card.id))
      .reduce((sum, card) => {
        const quantity = collectedCards.get(card.id)?.quantity || 1;
        const price = card.prices?.tcgplayer?.market || 0;
        return sum + (price * quantity);
      }, 0);
    
    // Calculate total market value of entire set
    const totalSetMarketValue = setCards.reduce((sum, card) => {
      return sum + (card.prices?.tcgplayer?.market || 0);
    }, 0);
    
    // Find 3 most expensive cards in the ENTIRE set (regardless of collection status)
    const mostExpensiveCards = setCards
      .sort((a, b) => (b.prices?.tcgplayer?.market || 0) - (a.prices?.tcgplayer?.market || 0))
      .slice(0, 3);
    
    // Get release date from first card's set data
    const releaseDate = setCards[0]?.set?.releaseDate || null;
    
    return {
      collectedCount,
      totalCards,
      completionPercent,
      ownedMarketValue,
      totalSetMarketValue,
      mostExpensiveCards,
      releaseDate,
      setName: setData?.setName || 'Unknown Set'
    };
  };

  const selectedSetStats = getSetStatistics();

  // Filter cards based on search
  const filteredSetCards = setCards.filter(card =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateQuantity = async (cardId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        await collectionService.removeFromCollection(user.id, cardId);
        setCollection(prev => prev.filter(item => item.card_id !== cardId));
      } else {
        await collectionService.updateQuantity(user.id, cardId, newQuantity);
        setCollection(prev =>
          prev.map(item =>
            item.card_id === cardId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
      const statsData = await collectionService.getCollectionStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleCardAdded = () => {
    // Refresh collection when a card is added
    loadCollection();
    // Also refresh set cards to update collection status
    if (selectedSetId) {
      loadSetCards(selectedSetId);
    }
  };

  const handleCardRemoved = () => {
    // Refresh collection when a card is removed
    loadCollection();
    // Also refresh collection cache
    collectionService.clearCache();
    // Refresh set cards to update collection status
    if (selectedSetId) {
      loadSetCards(selectedSetId);
    }
  };

  const handleViewDetails = (card) => {
    // Card from setCards already has full data with prices
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleBackToSetList = () => {
    setSelectedSetId(null);
    setSetCards([]);
    setSearchQuery('');
  };

  const selectedSetData = collectionBySet[selectedSetId];
  const collectedCount = selectedSetData?.cards.length || 0;
  const totalCount = setCards.length || 1;
  const progressPercent = Math.round((collectedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-4 md:p-8 border border-adaptive">
        <button
          onClick={selectedSetId ? handleBackToSetList : () => navigate('/')}
          className="flex items-center gap-2 text-adaptive-secondary hover:text-adaptive-primary transition-colors mb-4 md:mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">
            {selectedSetId ? 'Back to Sets' : 'Back to Browse'}
          </span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-display text-adaptive-primary mb-2">
              {selectedSetId ? selectedSetData?.setName : 'My Collection'}
            </h1>
            <p className="text-sm text-adaptive-secondary">
              {selectedSetId
                ? `${collectedCount} of ${setCards.length} cards collected`
                : 'Track and manage your Pokemon card collection'
              }
            </p>
          </div>

          {/* Stats Cards - Only show on main view */}
          {!selectedSetId && (
            <div className="flex gap-3 md:gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-adaptive-card rounded-xl border border-adaptive">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-adaptive-tertiary">Total Cards</p>
                  <p className="text-lg font-bold text-adaptive-primary">{stats.totalCards}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-adaptive-card rounded-xl border border-adaptive">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-adaptive-tertiary">Unique</p>
                  <p className="text-lg font-bold text-adaptive-primary">{stats.uniqueCards}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-adaptive-card rounded-xl border border-adaptive">
                <Layers className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-adaptive-tertiary">Sets</p>
                  <p className="text-lg font-bold text-adaptive-primary">{stats.totalSets}</p>
                </div>
              </div>
            </div>
          )}

          {/* View Toggle - Only show when viewing a set */}
          {selectedSetId && !loadingSetCards && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-adaptive-card text-adaptive-secondary border-adaptive hover:bg-adaptive-hover'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-adaptive-card text-adaptive-secondary border-adaptive hover:bg-adaptive-hover'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar - Only show when viewing a set */}
      {selectedSetId && !loadingSetCards && (
        <div className="glass-effect rounded-2xl p-4 border border-adaptive">
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
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : collection.length === 0 ? (
        /* Empty State */
        <div className="glass-effect rounded-2xl p-12 border border-adaptive text-center">
          <Package className="w-16 h-16 mx-auto text-adaptive-tertiary mb-4" />
          <h3 className="text-xl font-display text-adaptive-primary mb-2">Your collection is empty</h3>
          <p className="text-adaptive-secondary mb-6">Start adding cards to track your collection!</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Browse Sets
          </button>
        </div>
      ) : !selectedSetId ? (
        /* Set List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setList.map((setData) => (
            <button
              key={setData.setId}
              onClick={() => setSelectedSetId(setData.setId)}
              className="glass-effect rounded-xl border border-adaptive p-4 text-left hover:bg-adaptive-hover transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-adaptive-primary truncate">{setData.setName}</h3>
                  <p className="text-sm text-adaptive-tertiary mt-1">
                    {setData.cards.length} unique cards • {setData.totalQuantity} total
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-adaptive-tertiary group-hover:text-adaptive-primary transition-colors flex-shrink-0" />
              </div>

              {/* Preview of collected cards */}
              <div className="flex -space-x-2 mt-3">
                {setData.cards.slice(0, 5).map((card) => (
                  <div
                    key={card.card_id}
                    className="w-10 h-14 rounded border-2 border-adaptive-card overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900"
                  >
                    <img
                      src={card.card_image}
                      alt={card.card_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100x140?text=?';
                      }}
                    />
                  </div>
                ))}
                {setData.cards.length > 5 && (
                  <div className="w-10 h-14 rounded border-2 border-adaptive bg-adaptive-card flex items-center justify-center">
                    <span className="text-xs font-bold text-adaptive-tertiary">+{setData.cards.length - 5}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : loadingSetCards ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Card Grid/List for Selected Set */
        <>
          {/* Set Statistics Header */}
          {selectedSetStats && (
            <div className="glass-effect rounded-2xl p-6 border border-adaptive">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Complete Set Stats */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wide">Complete Set</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-adaptive-primary">
                        {selectedSetStats.collectedCount} of {selectedSetStats.totalCards}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-adaptive-tertiary">Release Date</p>
                      <p className="text-sm font-medium text-adaptive-secondary">
                        {selectedSetStats.releaseDate 
                          ? new Date(selectedSetStats.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-adaptive-tertiary">Owned Market Value</p>
                      <p className="text-lg font-bold price-gradient">
                        {formatPrice(selectedSetStats.ownedMarketValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-adaptive-tertiary">Total Set Value</p>
                      <p className="text-base font-semibold text-adaptive-primary">
                        {formatPrice(selectedSetStats.totalSetMarketValue)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Most Expensive Cards */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wide mb-4">Most Expensive</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedSetStats.mostExpensiveCards.map((card, index) => {
                      const isCollected = collectedCards.has(card.id);
                      return (
                        <button
                          key={card.id}
                          onClick={() => handleViewDetails(card)}
                          className={`glass-effect rounded-xl p-3 border border-adaptive hover:bg-adaptive-hover transition-all text-left ${
                            !isCollected ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative w-12 h-16 rounded overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
                              <img
                                src={card.image}
                                alt={card.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/100x140?text=?';
                                }}
                              />
                              {isCollected && (
                                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-adaptive-primary truncate">
                                {card.name}
                              </p>
                              <p className="text-lg font-bold price-gradient mt-1">
                                {formatPrice(card.prices?.tcgplayer?.market || 0)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar - Below stats */}
          <div className="glass-effect rounded-xl border border-adaptive p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-adaptive-tertiary">
                Collection Progress
              </span>
              <span className="font-bold text-adaptive-primary">
                {collectedCount} / {setCards.length} cards ({progressPercent}%)
              </span>
            </div>
            <div className="mt-2 h-2 bg-adaptive-card rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
              {filteredSetCards.map((card) => {
                const collectedItem = collectedCards.get(card.id);
                const isCollected = !!collectedItem;

                return (
                  <div
                    key={card.id}
                    className={`relative group cursor-pointer ${!isCollected ? 'opacity-45' : ''}`}
                    onClick={() => handleViewDetails(card)}
                  >
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x280?text=Card';
                        }}
                      />
                    </div>

                    {/* Collected Badge */}
                    {isCollected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow pointer-events-none">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Quantity Badge */}
                    {collectedItem && collectedItem.quantity > 1 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded pointer-events-none">
                        x{collectedItem.quantity}
                      </div>
                    )}

                    {/* Hover Controls for Collected Cards - Bottom bar instead of full overlay */}
                    {isCollected && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 py-1 rounded-b-lg">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(card.id, collectedItem.quantity - 1);
                          }}
                          className="p-1 bg-white/20 hover:bg-red-500/50 rounded text-white"
                          title={collectedItem.quantity === 1 ? "Remove from collection" : "Decrease quantity"}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white text-xs font-bold px-1">{collectedItem.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(card.id, collectedItem.quantity + 1);
                          }}
                          className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Add Button for uncollected - always show subtle hint */}
                    {!isCollected && (
                      <>
                        {/* Persistent overlay hint */}
                        <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-lg pointer-events-none" />
                        
                        {/* Add button on hover - bright and visible */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/90 rounded-lg">
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center mb-2 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <AddToCollectionButton
                                card={card}
                                variant="icon"
                                onSuccess={(e) => {
                                  if (e) e.stopPropagation();
                                  handleCardAdded();
                                }}
                              />
                            </div>
                            <p className="text-white text-xs font-semibold">Add to Collection</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredSetCards.map((card) => {
                const collectedItem = collectedCards.get(card.id);
                const isCollected = !!collectedItem;

                return (
                  <div
                    key={card.id}
                    className={`glass-effect rounded-lg border border-adaptive p-3 flex items-center gap-3 ${
                      !isCollected ? 'opacity-45' : ''
                    }`}
                  >
                    {/* Card Thumbnail */}
                    <button
                      onClick={() => handleViewDetails(card)}
                      className="flex-shrink-0 w-10 h-14 rounded overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900"
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100x140?text=?';
                        }}
                      />
                    </button>

                    {/* Card Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-adaptive-tertiary">#{card.number}</span>
                        <span className="text-sm font-medium text-adaptive-primary truncate">{card.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-adaptive-tertiary">{card.rarity}</span>
                        <span className="text-xs text-adaptive-tertiary">•</span>
                        <span className="text-xs font-medium price-gradient">
                          {formatPrice(card.prices?.tcgplayer?.market || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Collection Status */}
                    {isCollected ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(card.id, collectedItem.quantity - 1)}
                          className="p-1.5 rounded bg-adaptive-card hover:bg-adaptive-hover border border-adaptive"
                        >
                          <Minus className="w-3 h-3 text-adaptive-secondary" />
                        </button>
                        <span className="text-sm font-bold text-adaptive-primary w-6 text-center">
                          {collectedItem.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(card.id, collectedItem.quantity + 1)}
                          className="p-1.5 rounded bg-adaptive-card hover:bg-adaptive-hover border border-adaptive"
                        >
                          <Plus className="w-3 h-3 text-adaptive-secondary" />
                        </button>
                      </div>
                    ) : (
                      <AddToCollectionButton
                        card={card}
                        variant="compact"
                        onSuccess={handleCardAdded}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCardAdded={handleCardAdded}
          onCardRemoved={handleCardRemoved}
        />
      )}
    </div>
  );
};

export default MyCollection;
