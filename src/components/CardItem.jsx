import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import CardModal from './CardModal';
import AddToCollectionButton from './AddToCollectionButton';

const CardItem = ({ card, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  return (
    <>
    <div
      className="glass-effect rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Card Image */}
      <div
        className="relative aspect-[3/4] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 overflow-hidden cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
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
      </div>

      {/* Card Info */}
      <div className="p-6 relative">
        <div className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <h3 className="text-xl font-display text-adaptive-primary mb-1 line-clamp-1">
            {card.name}
          </h3>
          <p className="text-sm text-adaptive-secondary font-medium mb-4">
            {card.set} • {card.number}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`mt-4 ${!user ? 'blur-sm select-none pointer-events-none' : ''}`}>
          <AddToCollectionButton card={card} className="w-full" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-adaptive-card text-adaptive-secondary hover:bg-adaptive-hover border border-adaptive"
          >
            View Details
          </button>
        </div>
        
        {/* Auth Gate Overlay */}
        {!user && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-adaptive-card/95 backdrop-blur-sm rounded-2xl">
            <p className="text-sm text-adaptive-secondary mb-3 text-center px-4">Sign in to add to collection</p>
            <button
              onClick={() => openAuthModal()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Modal */}
    {isModalOpen && (
      <CardModal
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    )}
    </>
  );
};

export default CardItem;
