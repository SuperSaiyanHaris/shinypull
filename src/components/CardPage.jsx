import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CardModal from './CardModal';

const CardPage = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch card from database
        const { data, error: dbError } = await supabase
          .from('cards')
          .select('*')
          .eq('id', cardId)
          .single();

        if (dbError) throw dbError;

        if (!data) {
          setError('Card not found');
          return;
        }

        // Transform to match expected format
        const transformedCard = {
          id: data.id,
          name: data.name,
          number: data.number,
          rarity: data.rarity,
          types: data.types,
          supertype: data.supertype,
          images: {
            small: data.image_small,
            large: data.image_large
          },
          tcgplayer: {
            url: data.tcgplayer_url
          },
          set: {
            id: data.set_id
          }
        };

        setCard(transformedCard);
      } catch (err) {
        console.error('Error fetching card:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (cardId) {
      fetchCard();
    }
  }, [cardId]);

  const handleClose = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-adaptive-tertiary">Loading card...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎴</div>
          <h2 className="text-2xl font-display text-adaptive-primary mb-2">
            Card Not Found
          </h2>
          <p className="text-adaptive-tertiary mb-6">
            {error || 'The card you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <CardModal
      card={card}
      isOpen={true}
      onClose={handleClose}
    />
  );
};

export default CardPage;
