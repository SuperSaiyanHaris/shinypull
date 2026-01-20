import { useState, useEffect, useCallback } from 'react';
import { searchCards } from '../services/cardService';

export const useCardSearch = () => {
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = useCallback(async (searchQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchCards(searchQuery);
      setCards(results);
    } catch (err) {
      setError(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return {
    query,
    setQuery,
    cards,
    loading,
    error,
    performSearch
  };
};
