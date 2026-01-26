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

        // Fetch card with prices from database
        const { data: cardData, error: cardError } = await supabase
          .from('cards')
          .select('*')
          .eq('id', cardId)
          .single();

        if (cardError) throw cardError;
        if (!cardData) {
          setError('Card not found');
          return;
        }

        // Fetch prices
        const { data: pricesData } = await supabase
          .from('prices')
          .select('*')
          .eq('card_id', cardId)
          .single();

        // Transform to match CardModal expected format
        const transformedCard = {
          id: cardData.id,
          name: cardData.name,
          number: cardData.number,
          rarity: cardData.rarity,
          types: cardData.types,
          supertype: cardData.supertype,
          image: cardData.image_large || cardData.image_small,
          set: cardData.set_id,
          tcgplayerUrl: cardData.tcgplayer_url,
          prices: {
            tcgplayer: {
              market: pricesData?.tcgplayer_market || 0,
              low: pricesData?.tcgplayer_low || 0,
              high: pricesData?.tcgplayer_high || 0,
              normal: pricesData?.normal_market || 0,
              holofoil: pricesData?.holofoil_market || 0
            },
            ebay: null,
            psa10: null
          },
          priceHistory: []
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
