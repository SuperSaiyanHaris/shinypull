import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import AddToCollectionButton from './AddToCollectionButton';

const CardModal = ({ card, isOpen, onClose, onCardAdded, onCardRemoved }) => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  const affiliateLinks = [
    {
      name: 'TCGPlayer',
      url: `https://shop.tcgplayer.com/pokemon/${encodeURIComponent(card.set || '')}/${encodeURIComponent(card.name)}`
    },
    {
      name: 'eBay',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`Pokemon ${card.name} ${card.number || ''}`)}&_sacat=183454`
    },
    {
      name: 'Card Market',
      url: `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(card.name)}`
    },
    {
      name: 'Troll and Toad',
      url: `https://www.trollandtoad.com/pokemon/pokemon-singles-sealed-products/10209?keywords=${encodeURIComponent(card.name)}`
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4 modal-backdrop backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full md:max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-up modal-container border flex flex-col">
        
        {/* Mobile Header */}
        <div className="md:hidden flex-shrink-0 flex items-center justify-between p-4 border-b border-adaptive bg-adaptive-card z-20">
          <button onClick={onClose} className="flex items-center gap-2 text-adaptive-secondary">
            <X className="w-5 h-5" />
            <span className="font-medium">Close</span>
          </button>
          <span className="text-xs text-adaptive-tertiary font-mono">#{card.number}</span>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:block absolute top-4 right-4 z-10 p-2 modal-button rounded-lg transition-colors group border"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-adaptive-secondary group-hover:text-adaptive-primary" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 md:max-h-[90vh] bg-adaptive-card">
          {/* Mobile Layout */}
          <div className="md:hidden bg-adaptive-card">
            <div className="p-4 flex justify-center">
              <div className="relative w-40 aspect-[3/4]">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-2xl font-display text-adaptive-primary">{card.name}</h2>
                <p className="text-sm text-adaptive-secondary mt-1">{card.set} • {card.number}</p>
              </div>

              {/* Card Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 modal-card rounded-lg border">
                  <p className="text-xs text-adaptive-tertiary">Number</p>
                  <p className="text-sm font-bold text-adaptive-primary font-mono">{card.number}</p>
                </div>
                <div className="p-3 modal-card rounded-lg border">
                  <p className="text-xs text-adaptive-tertiary">Rarity</p>
                  <p className="text-sm font-bold text-adaptive-primary">{card.rarity}</p>
                </div>
              </div>

              {/* Collection Button */}
              <div className={`pt-2 ${!user ? 'blur-sm pointer-events-none' : ''}`}>
                <AddToCollectionButton
                  card={card}
                  className="w-full"
                  onSuccess={onCardAdded}
                  onRemove={onCardRemoved}
                />
              </div>

              {!user && (
                <div className="text-center p-4 bg-adaptive-hover rounded-lg">
                  <p className="text-xs text-adaptive-tertiary mb-2">Sign in to add to collection</p>
                  <button
                    onClick={() => openAuthModal()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Marketplace Links */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-adaptive-secondary uppercase tracking-wide">Buy This Card</h3>
                <div className="space-y-2">
                  {affiliateLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 modal-card rounded-lg border hover:bg-adaptive-hover transition-colors"
                    >
                      <span className="font-medium text-adaptive-primary">{link.name}</span>
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-xs text-adaptive-tertiary text-center">
                Links may be affiliate links. We may earn a commission from purchases.
              </p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="relative p-8 modal-header border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Card Image */}
                <div className="flex items-center justify-center">
                  <div className="relative aspect-[3/4] w-full max-w-md">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                </div>

                {/* Right: Card Info */}
                <div className="flex flex-col justify-center space-y-4">
                  <h2 className="text-4xl font-display text-adaptive-primary mb-2">
                    {card.name}
                  </h2>
                  <div className="flex items-center gap-3 text-adaptive-secondary">
                    <span className="text-lg">{card.set}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-lg font-mono">{card.number}</span>
                  </div>

                  {/* Collection Button */}
                  <div className={`${!user ? 'blur-sm pointer-events-none' : ''}`}>
                    <AddToCollectionButton
                      card={card}
                      className="w-full"
                      onSuccess={onCardAdded}
                      onRemove={onCardRemoved}
                    />
                  </div>

                  {!user && (
                    <div className="text-center p-4 bg-adaptive-hover rounded-lg">
                      <p className="text-sm text-adaptive-tertiary mb-3">Sign in to add to collection</p>
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
            </div>

            {/* Marketplace Links */}
            <div className="p-8 modal-content space-y-6">
              <div>
                <h3 className="text-xl font-display text-adaptive-primary mb-4">Buy This Card</h3>
                <div className="space-y-3">
                  {affiliateLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 modal-card rounded-lg border hover:shadow-sm transition-all"
                    >
                      <span className="text-adaptive-primary font-semibold">{link.name}</span>
                      <ExternalLink className="w-5 h-5 text-blue-500" />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-adaptive-tertiary mt-4 text-center">
                  Links may be affiliate links. We may earn a commission from purchases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
