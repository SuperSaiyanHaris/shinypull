import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { collectionService } from '../../services/collectionService';
import { getAllSets } from '../../services/dbSetService';
import Binder3D from './Binder3D';
import BinderViewer from './BinderViewer';
import { getSetCards } from '../../services/dbSetService';

/**
 * BinderShelf Component
 * Displays all collected sets as 3D binders on a shelf
 * Clicking a binder opens the BinderViewer
 */
const BinderShelf = () => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState([]);
  const [sets, setSets] = useState([]);
  const [stats, setStats] = useState({ totalCards: 0, uniqueCards: 0, totalSets: 0 });
  const [openBinder, setOpenBinder] = useState(null); // { set, allCards, collectedCards }

  // Load collection data
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [collectionData, allSets, collectionStats] = await Promise.all([
          collectionService.getCollection(user.id),
          getAllSets(),
          collectionService.getCollectionStats(user.id)
        ]);

        setCollection(collectionData);
        setSets(allSets);
        setStats(collectionStats);
      } catch (error) {
        console.error('Error loading collection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Group collection by set
  const getCollectionBySet = () => {
    const bySet = {};
    collection.forEach(card => {
      const setId = card.set_id;
      if (!bySet[setId]) {
        bySet[setId] = {
          cards: [],
          totalQuantity: 0
        };
      }
      bySet[setId].cards.push(card);
      bySet[setId].totalQuantity += card.quantity || 1;
    });
    return bySet;
  };

  // Get sets that have collected cards, sorted by most recently added
  const getCollectedSets = () => {
    const collectionBySet = getCollectionBySet();

    return sets
      .filter(set => collectionBySet[set.id])
      .map(set => ({
        ...set,
        collectedCards: collectionBySet[set.id].cards,
        collectedCount: collectionBySet[set.id].cards.length,
        totalQuantity: collectionBySet[set.id].totalQuantity
      }))
      .sort((a, b) => {
        // Sort by most recently added card
        const aLatest = Math.max(...a.collectedCards.map(c => new Date(c.added_at || 0).getTime()));
        const bLatest = Math.max(...b.collectedCards.map(c => new Date(c.added_at || 0).getTime()));
        return bLatest - aLatest;
      });
  };

  // Open a binder
  const handleOpenBinder = async (set, collectedCards) => {
    try {
      // Fetch all cards for this set
      const allCards = await getSetCards(set.id);
      setOpenBinder({
        set,
        allCards: allCards.sort((a, b) => parseInt(a.number) - parseInt(b.number)),
        collectedCards
      });
    } catch (error) {
      console.error('Error loading set cards:', error);
    }
  };

  // Close binder
  const handleCloseBinder = () => {
    setOpenBinder(null);
  };

  // Handle collection change (card added/removed)
  const handleCollectionChange = async () => {
    if (!user) return;

    try {
      // Reload collection data
      const [collectionData, collectionStats] = await Promise.all([
        collectionService.getCollection(user.id),
        collectionService.getCollectionStats(user.id)
      ]);

      setCollection(collectionData);
      setStats(collectionStats);

      // Update open binder's collected cards if a binder is open
      if (openBinder) {
        const updatedCollectedCards = collectionData.filter(
          card => card.set_id === openBinder.set.id
        );
        setOpenBinder(prev => ({
          ...prev,
          collectedCards: updatedCollectedCards
        }));
      }
    } catch (error) {
      console.error('Error reloading collection:', error);
    }
  };

  const collectedSets = getCollectedSets();

  // Not logged in state
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Library className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-display text-adaptive-primary mb-4">
            Your Collection Awaits
          </h1>
          <p className="text-adaptive-secondary mb-8 max-w-md mx-auto">
            Sign in to start building your Pokemon card collection and see your binders come to life!
          </p>
          <button
            onClick={() => openAuthModal()}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
          >
            Sign In to Start Collecting
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-adaptive-secondary">Loading your collection...</p>
        </div>
      </div>
    );
  }

  // Empty collection state
  if (collectedSets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-display text-adaptive-primary mb-4">
            Start Your Collection
          </h1>
          <p className="text-adaptive-secondary mb-8 max-w-md mx-auto">
            Browse sets and add cards to see your collection binders appear here!
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
          >
            Browse Sets
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Library className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl md:text-4xl font-display text-adaptive-primary">
              My Collection
            </h1>
          </div>
          <p className="text-adaptive-secondary">
            Click a binder to open it and browse your cards
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="glass-effect rounded-2xl p-4 md:p-6 mb-8 border border-adaptive"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-adaptive-primary">
                {stats.totalCards?.toLocaleString() || 0}
              </p>
              <p className="text-xs md:text-sm text-adaptive-tertiary">Total Cards</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-adaptive-primary">
                {stats.uniqueCards?.toLocaleString() || 0}
              </p>
              <p className="text-xs md:text-sm text-adaptive-tertiary">Unique Cards</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-adaptive-primary">
                {collectedSets.length}
              </p>
              <p className="text-xs md:text-sm text-adaptive-tertiary">Binders</p>
            </div>
          </div>
        </motion.div>

        {/* Shelf with Binders */}
        <div className="relative">
          {/* Shelf Background */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-amber-900/20 to-transparent rounded-b-2xl" />

          {/* Binder Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8 pb-8">
            {collectedSets.map((set, index) => (
              <div key={set.id} className="flex justify-center">
                <Binder3D
                  set={set}
                  collectedCount={set.collectedCount}
                  totalCards={set.totalCards}
                  onClick={() => handleOpenBinder(set, set.collectedCards)}
                  index={index}
                />
              </div>
            ))}
          </div>

          {/* Wooden Shelf */}
          <div className="h-4 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-lg shadow-lg" />
          <div className="h-2 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-lg" />
        </div>

        {/* Instructions */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-adaptive-tertiary text-sm">
            <TrendingUp className="w-4 h-4 inline-block mr-1" />
            Hover over binders for a preview • Click to open and browse cards
          </p>
        </motion.div>
      </div>

      {/* Binder Viewer Modal */}
      <AnimatePresence>
        {openBinder && (
          <BinderViewer
            set={openBinder.set}
            allCards={openBinder.allCards}
            collectedCards={openBinder.collectedCards}
            onClose={handleCloseBinder}
            onCollectionChange={handleCollectionChange}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default BinderShelf;
