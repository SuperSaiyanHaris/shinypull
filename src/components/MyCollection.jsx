import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Trash2, Plus, Minus, Package, Sparkles, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collectionService } from '../services/collectionService';
import { formatPrice } from '../services/cardService';
import CardModal from './CardModal';

const MyCollection = ({ onBack }) => {
  const { user } = useAuth();
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('added'); // added, name, set
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ totalCards: 0, uniqueCards: 0, totalSets: 0 });

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
      // Refresh stats
      const statsData = await collectionService.getCollectionStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemove = async (cardId) => {
    try {
      await collectionService.removeFromCollection(user.id, cardId);
      setCollection(prev => prev.filter(item => item.card_id !== cardId));
      const statsData = await collectionService.getCollectionStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  const handleViewDetails = (item) => {
    // Convert collection item to card format for modal
    const card = {
      id: item.card_id,
      name: item.card_name,
      image: item.card_image,
      number: item.card_number,
      rarity: item.card_rarity,
      set: item.set_name,
      setId: item.set_id,
      prices: {
        tcgplayer: { market: 0, low: 0, high: 0 },
        ebay: { avg: 0, verified: false },
        psa10: { avg: 0, verified: false }
      },
      priceHistory: []
    };
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const filteredCollection = collection
    .filter(item =>
      item.card_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.set_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'added') return new Date(b.added_at) - new Date(a.added_at);
      if (sortBy === 'name') return a.card_name.localeCompare(b.card_name);
      if (sortBy === 'set') return (a.set_name || '').localeCompare(b.set_name || '');
      return 0;
    });

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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-display text-adaptive-primary mb-2">My Collection</h1>
            <p className="text-sm text-adaptive-secondary">Track and manage your Pokemon card collection</p>
          </div>

          {/* Stats Cards */}
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
        </div>
      </div>

      {/* Controls */}
      <div className="glass-effect rounded-2xl p-6 border border-adaptive">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-adaptive-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your collection..."
                className="w-full pl-12 pr-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary placeholder-adaptive-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 bg-adaptive-card border border-adaptive rounded-xl text-adaptive-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
            >
              <option value="added">Recently Added</option>
              <option value="name">Name (A-Z)</option>
              <option value="set">Set Name</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-adaptive">
          <p className="text-sm text-adaptive-tertiary">
            Showing <span className="font-semibold text-adaptive-primary">{filteredCollection.length}</span> of {collection.length} cards
          </p>
        </div>
      </div>

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
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Browse Sets
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filteredCollection.map((item, index) => (
              <div
                key={item.id}
                className="glass-effect rounded-xl border border-adaptive p-4 animate-slide-up"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Card Image */}
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="flex-shrink-0 w-16 h-22 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden"
                  >
                    <img
                      src={item.card_image}
                      alt={item.card_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x280?text=Card';
                      }}
                    />
                  </button>

                  {/* Card Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="text-left"
                    >
                      <p className="text-sm font-semibold text-adaptive-primary truncate">{item.card_name}</p>
                      <p className="text-xs text-adaptive-tertiary truncate">{item.set_name}</p>
                    </button>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.card_id, item.quantity - 1)}
                        className="p-1.5 rounded-lg bg-adaptive-card hover:bg-adaptive-hover border border-adaptive transition-colors"
                      >
                        <Minus className="w-4 h-4 text-adaptive-secondary" />
                      </button>
                      <span className="text-sm font-bold text-adaptive-primary w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.card_id, item.quantity + 1)}
                        className="p-1.5 rounded-lg bg-adaptive-card hover:bg-adaptive-hover border border-adaptive transition-colors"
                      >
                        <Plus className="w-4 h-4 text-adaptive-secondary" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemove(item.card_id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCollection.map((item, index) => (
              <div
                key={item.id}
                className="glass-effect rounded-2xl border border-adaptive overflow-hidden animate-slide-up group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Card Image */}
                <button
                  onClick={() => handleViewDetails(item)}
                  className="relative aspect-[3/4] w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 overflow-hidden"
                >
                  <img
                    src={item.card_image}
                    alt={item.card_name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x280?text=Card';
                    }}
                  />
                  {/* Quantity Badge */}
                  {item.quantity > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      x{item.quantity}
                    </div>
                  )}
                </button>

                {/* Card Info */}
                <div className="p-4">
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="text-left w-full"
                  >
                    <h3 className="font-semibold text-adaptive-primary truncate">{item.card_name}</h3>
                    <p className="text-sm text-adaptive-tertiary truncate">{item.set_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-adaptive-tertiary">#{item.card_number}</span>
                      <span className="text-adaptive-tertiary">•</span>
                      <span className="text-xs text-adaptive-tertiary">{item.card_rarity}</span>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-adaptive">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.card_id, item.quantity - 1)}
                        className="p-1.5 rounded-lg bg-adaptive-card hover:bg-adaptive-hover border border-adaptive transition-colors"
                      >
                        <Minus className="w-4 h-4 text-adaptive-secondary" />
                      </button>
                      <span className="text-sm font-bold text-adaptive-primary w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.card_id, item.quantity + 1)}
                        className="p-1.5 rounded-lg bg-adaptive-card hover:bg-adaptive-hover border border-adaptive transition-colors"
                      >
                        <Plus className="w-4 h-4 text-adaptive-secondary" />
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemove(item.card_id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      title="Remove from collection"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

export default MyCollection;
