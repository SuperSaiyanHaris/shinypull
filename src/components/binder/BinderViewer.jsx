import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import BinderPage from './BinderPage';
import CardModal from '../CardModal';
import { useAuth } from '../../contexts/AuthContext';
import { collectionService } from '../../services/collectionService';

/**
 * BinderViewer Component
 * Full-screen binder experience with page-turning navigation
 * Desktop: Two pages side by side like a real open binder
 * Mobile: Single page with swipe navigation
 */
const BinderViewer = ({
  set,
  allCards = [],
  collectedCards = [],
  onClose,
  onCardClick,
  onCollectionChange
}) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isQuickActioning, setIsQuickActioning] = useState(false);
  const containerRef = useRef(null);

  const CARDS_PER_PAGE = 9;
  const totalPages = Math.ceil(allCards.length / CARDS_PER_PAGE);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create a map of collected cards by ID for quick lookup
  const collectedMap = {};
  collectedCards.forEach(card => {
    collectedMap[card.card_id || card.id] = card;
  });

  // Get cards for a specific page, marking collected/uncollected
  const getPageCards = (pageIndex) => {
    const startIdx = pageIndex * CARDS_PER_PAGE;
    const endIdx = Math.min(startIdx + CARDS_PER_PAGE, allCards.length);

    return allCards.slice(startIdx, endIdx).map((card, i) => {
      const collected = collectedMap[card.id];
      if (collected) {
        return {
          ...card,
          ...collected,
          quantity: collected.quantity || 1
        };
      }
      return { isEmpty: true, index: startIdx + i, ...card };
    });
  };

  // Navigate to next page
  const nextPage = useCallback(() => {
    const maxPage = isMobile ? totalPages - 1 : Math.floor((totalPages - 1) / 2) * 2;
    const increment = isMobile ? 1 : 2;

    if (currentPage < maxPage && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('right');
      setTimeout(() => {
        setCurrentPage(prev => Math.min(prev + increment, maxPage));
        setIsFlipping(false);
        setFlipDirection(null);
      }, 300);
    }
  }, [currentPage, totalPages, isFlipping, isMobile]);

  // Navigate to previous page
  const prevPage = useCallback(() => {
    const increment = isMobile ? 1 : 2;

    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('left');
      setTimeout(() => {
        setCurrentPage(prev => Math.max(prev - increment, 0));
        setIsFlipping(false);
        setFlipDirection(null);
      }, 300);
    }
  }, [currentPage, isFlipping, isMobile]);

  // Handle scroll wheel for page turning (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          nextPage();
        } else {
          prevPage();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [nextPage, prevPage, isMobile]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        prevPage();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, onClose]);

  // Touch/swipe handling
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Only trigger if horizontal swipe is greater than vertical (not scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextPage();
      } else {
        prevPage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    onCardClick?.(card);
  };

  // Quick add card to collection without opening modal
  const handleQuickAdd = async (card) => {
    if (!user || isQuickActioning) return;

    try {
      setIsQuickActioning(true);
      await collectionService.addToCollection(user.id, {
        id: card.id,
        name: card.name,
        image: card.images?.large || card.images?.small || card.image,
        number: card.number,
        rarity: card.rarity,
        set: set.name,
        setId: set.id
      });
      collectionService.clearCache();
      onCollectionChange?.();
    } catch (error) {
      console.error('Error adding card:', error);
    } finally {
      setIsQuickActioning(false);
    }
  };

  // Quick remove card from collection without opening modal
  const handleQuickRemove = async (card) => {
    if (!user || isQuickActioning) return;

    try {
      setIsQuickActioning(true);
      const cardId = card.card_id || card.id;
      await collectionService.removeFromCollection(user.id, cardId);
      collectionService.clearCache();
      onCollectionChange?.();
    } catch (error) {
      console.error('Error removing card:', error);
    } finally {
      setIsQuickActioning(false);
    }
  };

  // Page animation variants
  const mobilePageVariants = {
    enter: (direction) => ({
      x: direction === 'right' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction === 'right' ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const desktopPageVariants = {
    enter: (direction) => ({
      rotateY: direction === 'right' ? -90 : 90,
      opacity: 0,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      rotateY: direction === 'right' ? 90 : -90,
      opacity: 0,
    }),
  };

  // For desktop spread view
  const leftPageIndex = isMobile ? currentPage : currentPage;
  const rightPageIndex = currentPage + 1;

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2">
          {set.logo && (
            <img src={set.logo} alt="" className="h-5 sm:h-6 object-contain" />
          )}
          <h1 className="text-white font-bold text-xs sm:text-lg truncate max-w-[150px] sm:max-w-none">
            {set.name}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 text-white/60 text-xs sm:text-sm">
          <LayoutGrid className="w-4 h-4" />
          <span>{collectedCards.length}/{allCards.length}</span>
        </div>
      </div>

      {/* Mobile Single Page View */}
      {isMobile && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page Content */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait" custom={flipDirection}>
              <motion.div
                key={`mobile-page-${currentPage}`}
                className="absolute inset-2"
                custom={flipDirection}
                variants={mobilePageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <BinderPage
                  cards={getPageCards(currentPage)}
                  pageNumber={currentPage + 1}
                  totalCards={allCards.length}
                  startIndex={currentPage * CARDS_PER_PAGE}
                  onCardClick={handleCardClick}
                  onQuickAdd={handleQuickAdd}
                  onQuickRemove={handleQuickRemove}
                  isLeftPage={false}
                  isMobile={true}
                />
              </motion.div>
            </AnimatePresence>

            {/* Mobile Navigation Arrows */}
            <button
              onClick={prevPage}
              disabled={currentPage === 0 || isFlipping}
              className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 ${
                currentPage === 0 ? 'opacity-30' : 'active:scale-95'
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1 || isFlipping}
              className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 ${
                currentPage >= totalPages - 1 ? 'opacity-30' : 'active:scale-95'
              }`}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile Footer */}
          <div className="px-4 py-3 bg-black/50 backdrop-blur-sm border-t border-white/10">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full mb-2 overflow-hidden">
              <motion.div
                className="h-full bg-white/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-xs">Swipe to turn pages</p>
              <p className="text-white/80 text-sm">
                Page {currentPage + 1} of {totalPages}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Two-Page Spread View */}
      {!isMobile && (
        <>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <div
              className="relative w-full max-w-6xl aspect-[2/1.3] flex"
              style={{ perspective: '2000px' }}
            >
              {/* Left Navigation Arrow */}
              <button
                onClick={prevPage}
                disabled={currentPage === 0 || isFlipping}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all ${
                  currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110'
                }`}
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>

              {/* Binder Spread */}
              <div className="flex-1 flex shadow-2xl rounded-lg overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
                {/* Binder Spine */}
                <div className="w-4 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-700 flex flex-col justify-around items-center py-8">
                  <div className="w-2 h-2 bg-slate-500 rounded-full" />
                  <div className="w-2 h-2 bg-slate-500 rounded-full" />
                  <div className="w-2 h-2 bg-slate-500 rounded-full" />
                </div>

                {/* Left Page */}
                <AnimatePresence mode="wait" custom={flipDirection}>
                  <motion.div
                    key={`left-${currentPage}`}
                    className="flex-1"
                    custom={flipDirection}
                    variants={desktopPageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
                  >
                    {leftPageIndex < totalPages && (
                      <BinderPage
                        cards={getPageCards(leftPageIndex)}
                        pageNumber={leftPageIndex + 1}
                        totalCards={allCards.length}
                        startIndex={leftPageIndex * CARDS_PER_PAGE}
                        onCardClick={handleCardClick}
                        onQuickAdd={handleQuickAdd}
                        onQuickRemove={handleQuickRemove}
                        isLeftPage={true}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Center crease */}
                <div className="w-1 bg-gradient-to-b from-slate-400/30 via-slate-600/50 to-slate-400/30" />

                {/* Right Page */}
                <AnimatePresence mode="wait" custom={flipDirection}>
                  <motion.div
                    key={`right-${currentPage}`}
                    className="flex-1"
                    custom={flipDirection}
                    variants={desktopPageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: "easeInOut", delay: 0.05 }}
                    style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
                  >
                    {rightPageIndex < totalPages ? (
                      <BinderPage
                        cards={getPageCards(rightPageIndex)}
                        pageNumber={rightPageIndex + 1}
                        totalCards={allCards.length}
                        startIndex={rightPageIndex * CARDS_PER_PAGE}
                        onCardClick={handleCardClick}
                        onQuickAdd={handleQuickAdd}
                        onQuickRemove={handleQuickRemove}
                        isLeftPage={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-r-sm flex items-center justify-center">
                        <p className="text-slate-400 dark:text-slate-500 text-sm">End of binder</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Navigation Arrow */}
              <button
                onClick={nextPage}
                disabled={rightPageIndex >= totalPages - 1 || isFlipping}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all ${
                  rightPageIndex >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110'
                }`}
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>

          {/* Desktop Page Indicator */}
          <div className="px-4 py-3 bg-black/50 backdrop-blur-sm border-t border-white/10">
            <div className="flex items-center justify-center gap-4">
              {/* Page dots */}
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(totalPages / 2) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => !isFlipping && setCurrentPage(i * 2)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      Math.floor(currentPage / 2) === i
                        ? 'bg-white w-4'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <div className="text-white/80 text-sm">
                Pages {leftPageIndex + 1}-{Math.min(rightPageIndex + 1, totalPages)} of {totalPages}
              </div>

              <p className="text-white/40 text-xs">
                Arrow keys, scroll, or swipe
              </p>
            </div>
          </div>
        </>
      )}

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onCardAdded={onCollectionChange}
          onCardRemoved={onCollectionChange}
        />
      )}
    </motion.div>
  );
};

export default BinderViewer;
