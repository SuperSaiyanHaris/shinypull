import React from 'react';
import { motion } from 'framer-motion';

/**
 * BinderPage Component
 * Displays a 3x3 grid of card slots on a binder page
 * Cards can be empty (silhouette) or filled with collected cards
 */
const BinderPage = ({
  cards = [], // Array of 9 cards (or less) for this page
  pageNumber,
  totalCards,
  startIndex,
  onCardClick,
  isLeftPage = false
}) => {
  // Create 9 slots, filling with cards or empty slots
  const slots = Array.from({ length: 9 }, (_, i) => {
    const cardIndex = startIndex + i;
    return cardIndex < totalCards ? (cards[i] || { isEmpty: true, index: cardIndex }) : null;
  });

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ${
        isLeftPage ? 'rounded-l-sm' : 'rounded-r-sm'
      }`}
      style={{
        boxShadow: isLeftPage
          ? 'inset -4px 0 8px rgba(0,0,0,0.1)'
          : 'inset 4px 0 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* Page texture overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2NjY2MiPjwvcmVjdD4KPC9zdmc+')]" />

      {/* Binder rings shadow on left page */}
      {isLeftPage && (
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/10 to-transparent" />
      )}

      {/* Binder rings shadow on right page */}
      {!isLeftPage && (
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/10 to-transparent" />
      )}

      {/* 3x3 Card Grid */}
      <div className="p-3 md:p-4 h-full">
        <div className="grid grid-cols-3 gap-2 md:gap-3 h-full">
          {slots.map((slot, index) => (
            <CardSlot
              key={index}
              slot={slot}
              index={index}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>

      {/* Page Number */}
      <div className={`absolute bottom-2 ${isLeftPage ? 'left-4' : 'right-4'} text-xs text-slate-400 dark:text-slate-500`}>
        {pageNumber}
      </div>
    </div>
  );
};

/**
 * Individual Card Slot
 * Can be empty (shows placeholder), filled (shows card), or null (beyond set size)
 */
const CardSlot = ({ slot, index, onCardClick }) => {
  if (slot === null) {
    // Beyond the set size - empty decorative slot
    return (
      <div className="aspect-[2.5/3.5] rounded-lg bg-slate-200/50 dark:bg-slate-700/30 border border-dashed border-slate-300/50 dark:border-slate-600/30" />
    );
  }

  if (slot.isEmpty) {
    // Card exists but not collected - show actual card at 45% opacity
    return (
      <motion.div
        className="aspect-[2.5/3.5] rounded-lg overflow-hidden cursor-pointer relative group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onCardClick?.(slot)}
      >
        {/* Card Image at reduced opacity */}
        <img
          src={slot.image || slot.images?.small || slot.card_image}
          alt={slot.name || slot.card_name}
          className="w-full h-full object-cover opacity-45 grayscale-[30%]"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200x280?text=Card';
          }}
        />

        {/* Hover overlay to add to collection */}
        <motion.div
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center"
        >
          <p className="text-white text-[10px] md:text-xs font-medium text-center px-1 drop-shadow-lg line-clamp-2 mb-1">
            {slot.name || slot.card_name}
          </p>
          <p className="text-white/60 text-[8px] md:text-[10px]">Not collected</p>
        </motion.div>
      </motion.div>
    );
  }

  // Collected card - show the actual card
  return (
    <motion.div
      className="aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md cursor-pointer relative group"
      initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: index * 0.05 }}
      whileHover={{
        scale: 1.08,
        zIndex: 10,
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onCardClick?.(slot)}
    >
      {/* Card Image */}
      <img
        src={slot.image || slot.images?.small || slot.card_image}
        alt={slot.name || slot.card_name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/200x280?text=Card';
        }}
      />

      {/* Hover overlay with card name */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2"
      >
        <p className="text-white text-[10px] md:text-xs font-medium text-center px-1 drop-shadow-lg line-clamp-2">
          {slot.name || slot.card_name}
        </p>
      </motion.div>

      {/* Quantity badge if more than 1 */}
      {slot.quantity > 1 && (
        <div className="absolute top-1 right-1 w-5 h-5 md:w-6 md:h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-[10px] md:text-xs font-bold">
            {slot.quantity}
          </span>
        </div>
      )}

      {/* Holographic shine effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)',
        }}
        initial={{ x: '-100%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.div>
  );
};

export default BinderPage;
