import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, X, LayoutGrid } from 'lucide-react';
import BinderPage from './BinderPage';
import CardModal from '../CardModal';

/**
 * BinderViewer Component
 * Full-screen binder experience with page-turning navigation
 * Shows two pages side by side like a real open binder
 */
const BinderViewer = ({
  set,
  allCards = [], // All cards in the set (sorted by number)
  collectedCards = [], // User's collected cards for this set
  onClose,
  onCardClick
}) => {
  const [currentSpread, setCurrentSpread] = useState(0); // Current page spread (0 = pages 1-2, 1 = pages 3-4, etc.)
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null); // 'left' or 'right'
  const [selectedCard, setSelectedCard] = useState(null);
  const containerRef = useRef(null);

  const CARDS_PER_PAGE = 9;
  const totalPages = Math.ceil(allCards.length / CARDS_PER_PAGE);
  const totalSpreads = Math.ceil(totalPages / 2);

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

  // Navigate to next spread
  const nextSpread = useCallback(() => {
    if (currentSpread < totalSpreads - 1 && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('right');
      setTimeout(() => {
        setCurrentSpread(prev => prev + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 400);
    }
  }, [currentSpread, totalSpreads, isFlipping]);

  // Navigate to previous spread
  const prevSpread = useCallback(() => {
    if (currentSpread > 0 && !isFlipping) {
      setIsFlipping(true);
      setFlipDirection('left');
      setTimeout(() => {
        setCurrentSpread(prev => prev - 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 400);
    }
  }, [currentSpread, isFlipping]);

  // Handle scroll wheel for page turning
  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          nextSpread();
        } else {
          prevSpread();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [nextSpread, prevSpread]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd') {
        nextSpread();
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        prevSpread();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSpread, prevSpread, onClose]);

  // Touch/swipe handling
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSpread();
      } else {
        prevSpread();
      }
    }

    touchStartX.current = null;
  };

  const leftPageIndex = currentSpread * 2;
  const rightPageIndex = currentSpread * 2 + 1;

  const handleCardClick = (card) => {
    if (!card.isEmpty) {
      setSelectedCard(card);
      onCardClick?.(card);
    }
  };

  // Page flip animation variants
  const pageVariants = {
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
          <span className="hidden sm:inline">Back to Collection</span>
        </button>

        <div className="flex items-center gap-3">
          {set.logo && (
            <img src={set.logo} alt="" className="h-6 object-contain" />
          )}
          <h1 className="text-white font-bold text-sm sm:text-lg">{set.name}</h1>
        </div>

        <div className="flex items-center gap-2 text-white/60 text-sm">
          <LayoutGrid className="w-4 h-4" />
          <span>{collectedCards.length} / {allCards.length}</span>
        </div>
      </div>

      {/* Binder Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          className="relative w-full max-w-6xl aspect-[2/1.3] flex"
          style={{ perspective: '2000px' }}
        >
          {/* Left Navigation Arrow */}
          <button
            onClick={prevSpread}
            disabled={currentSpread === 0 || isFlipping}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full md:-translate-x-12 z-20 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all ${
              currentSpread === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110'
            }`}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </button>

          {/* Binder Spread */}
          <div className="flex-1 flex shadow-2xl rounded-lg overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
            {/* Binder Spine */}
            <div className="w-3 md:w-4 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-700 flex flex-col justify-around items-center py-8">
              <div className="w-2 h-2 bg-slate-500 rounded-full" />
              <div className="w-2 h-2 bg-slate-500 rounded-full" />
              <div className="w-2 h-2 bg-slate-500 rounded-full" />
            </div>

            {/* Left Page */}
            <AnimatePresence mode="wait" custom={flipDirection}>
              <motion.div
                key={`left-${currentSpread}`}
                className="flex-1"
                custom={flipDirection}
                variants={pageVariants}
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
                key={`right-${currentSpread}`}
                className="flex-1"
                custom={flipDirection}
                variants={pageVariants}
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
                    isLeftPage={false}
                  />
                ) : (
                  // Empty right page when odd total pages
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-r-sm flex items-center justify-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">End of binder</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Navigation Arrow */}
          <button
            onClick={nextSpread}
            disabled={currentSpread >= totalSpreads - 1 || isFlipping}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-full md:translate-x-12 z-20 p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all ${
              currentSpread >= totalSpreads - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110'
            }`}
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </button>
        </div>
      </div>

      {/* Page Indicator */}
      <div className="px-4 py-3 bg-black/50 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          {/* Page dots for desktop */}
          <div className="hidden md:flex items-center gap-2">
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <button
                key={i}
                onClick={() => !isFlipping && setCurrentSpread(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSpread
                    ? 'bg-white w-4'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Page numbers */}
          <div className="text-white/80 text-sm">
            Pages {leftPageIndex + 1}-{Math.min(rightPageIndex + 1, totalPages)} of {totalPages}
          </div>

          {/* Navigation hint */}
          <p className="hidden md:block text-white/40 text-xs">
            Use arrow keys, scroll, or swipe to turn pages
          </p>
        </div>
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </motion.div>
  );
};

export default BinderViewer;
