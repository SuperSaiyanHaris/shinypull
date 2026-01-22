import React, { useState, useEffect } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collectionService } from '../services/collectionService';

const AddToCollectionButton = ({
  card,
  variant = 'default', // 'default', 'compact', 'icon'
  onAuthRequired,
  className = ''
}) => {
  const { user } = useAuth();
  const [isInCollection, setIsInCollection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

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
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    if (isInCollection) return;

    try {
      setLoading(true);
      await collectionService.addToCollection(user.id, card);
      setIsInCollection(true);
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
        disabled={loading || isInCollection}
        className={`p-2 rounded-lg transition-all ${
          isInCollection
            ? 'bg-green-500/20 text-green-500 border border-green-500/30'
            : 'bg-adaptive-card hover:bg-blue-500/20 hover:text-blue-500 text-adaptive-secondary border border-adaptive hover:border-blue-500/30'
        } ${className}`}
        title={isInCollection ? 'In collection' : 'Add to collection'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isInCollection ? (
          <Check className="w-4 h-4" />
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
        disabled={loading || isInCollection}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          isInCollection
            ? 'bg-green-500/20 text-green-500 border border-green-500/30'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isInCollection ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Added</span>
          </>
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
    <button
      onClick={handleClick}
      disabled={loading || isInCollection}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
        isInCollection
          ? 'bg-green-500/20 text-green-500 border border-green-500/30'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Adding...</span>
        </>
      ) : isInCollection ? (
        <>
          <Check className="w-5 h-5" />
          <span>In Collection</span>
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          <span>{user ? 'Add to Collection' : 'Sign in to Collect'}</span>
        </>
      )}
    </button>
  );
};

export default AddToCollectionButton;
