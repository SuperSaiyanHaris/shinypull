import React, { useState, useEffect } from 'react';
import { Plus, Check, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { collectionService } from '../services/collectionService';

const EDITIONS = [
  { value: 'Unlimited', label: 'Unlimited' },
  { value: '1st Edition', label: '1st Edition 🥇' },
  { value: 'Shadowless', label: 'Shadowless' },
  { value: 'Reverse Holofoil', label: 'Reverse Holo' },
  { value: 'Normal', label: 'Normal' }
];

const AddToCollectionButton = ({
  card,
  variant = 'default', // 'default', 'compact', 'icon'
  onSuccess,
  onRemove,
  className = ''
}) => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [isInCollection, setIsInCollection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showEditionPicker, setShowEditionPicker] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState('Unlimited');

  useEffect(() => {
    if (user && card?.id) {
      checkIfInCollection();
    } else {
      setChecking(false);
    }
  }, [user, card?.id]);

  const checkIfInCollection = async () => {
    try {
      setChecking(true);
      const result = await collectionService.isInCollection(user.id, card.id);
      setIsInCollection(!!result);
    } catch (error) {
      console.error('Error checking collection:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleClick = async (e) => {
    e.stopPropagation();

    if (!user) {
      openAuthModal();
      return;
    }

    // If not in collection, show edition picker
    if (!isInCollection) {
      setShowEditionPicker(true);
      return;
    }

    // If already in collection, remove it
    try {
      setLoading(true);
      await collectionService.removeFromCollection(user.id, card.id);
      setIsInCollection(false);
      onRemove?.();
    } catch (error) {
      console.error('Error removing from collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWithEdition = async (edition) => {
    try {
      setLoading(true);
      await collectionService.addToCollection(user.id, card, edition);
      setIsInCollection(true);
      setShowEditionPicker(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding to collection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    if (variant === 'icon') {
      return (
        <button className={`p-2 rounded-lg bg-adaptive-card border border-adaptive ${className}`} disabled>
          <Loader2 className="w-4 h-4 animate-spin text-adaptive-tertiary" />
        </button>
      );
    }
    return null;
  }

  // Icon only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`p-2 rounded-lg transition-all ${
          isInCollection
            ? isHovering
              ? 'bg-red-500/20 text-red-500 border border-red-500/30'
              : 'bg-green-500/20 text-green-500 border border-green-500/30'
            : 'bg-adaptive-card hover:bg-blue-500/20 hover:text-blue-500 text-adaptive-secondary border border-adaptive hover:border-blue-500/30'
        } ${className}`}
        title={isInCollection ? (isHovering ? 'Remove from collection' : 'In collection') : 'Add to collection'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isInCollection ? (
          isHovering ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          isInCollection
            ? isHovering
              ? 'bg-red-500/20 text-red-500 border border-red-500/30'
              : 'bg-green-500/20 text-green-500 border border-green-500/30'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isInCollection ? (
          isHovering ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added</span>
            </>
          )
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </>
        )}
      </button>
    );
  }

  // Default variant
  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
          isInCollection
            ? isHovering
              ? 'bg-red-500/20 text-red-500 border border-red-500/30'
              : 'bg-green-500/20 text-green-500 border border-green-500/30'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30'
        } ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{isInCollection ? 'Removing...' : 'Adding...'}</span>
          </>
        ) : isInCollection ? (
          isHovering ? (
            <>
              <X className="w-5 h-5" />
              <span>Remove from Collection</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>In Collection</span>
            </>
          )
        ) : (
          <>
            <Plus className="w-5 h-5" />
            <span>{user ? 'Add to Collection' : 'Sign in to Collect'}</span>
          </>
        )}
      </button>

      {/* Edition Picker Modal */}
      {showEditionPicker && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditionPicker(false)}
        >
          <div 
            className="bg-adaptive-card rounded-xl p-6 max-w-md w-full border border-adaptive shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-adaptive-primary mb-2">
              Select Edition
            </h3>
            <p className="text-adaptive-secondary text-sm mb-4">
              Which edition of {card.name} do you own?
            </p>
            
            <div className="space-y-2">
              {EDITIONS.map((edition) => (
                <button
                  key={edition.value}
                  onClick={() => handleAddWithEdition(edition.value)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 rounded-lg bg-adaptive-bg hover:bg-blue-500/10 hover:border-blue-500/50 border border-adaptive transition-all text-adaptive-primary font-medium disabled:opacity-50"
                >
                  {edition.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowEditionPicker(false)}
              className="w-full mt-4 px-4 py-2 rounded-lg text-adaptive-secondary hover:text-adaptive-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddToCollectionButton;
